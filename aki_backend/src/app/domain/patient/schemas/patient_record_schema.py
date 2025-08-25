from typing import List, Dict, Tuple, Optional
import datetime

from marshmallow import fields

from app import ma
from app.core.constants import APIItems
from app.domain.user.entities.user import User
from app.domain.user.schemas.department_schema import DepartmentSchema
from app.domain.patient.schemas.patient_schema import PatientSchema
from app.domain.patient.entities.patient import PatientMedicalRecord
from app.domain.patient.schemas.patient_record_schema_columns import (
    GENERAL_DATA_COLUMNS,
    BINARY_DATA_COLUMNS,
    CREATININE_COLUMNS,
    TEST_SMALL_RANGE_COLUMNS,
    TEST_MID_RANGE_COLUMNS,
    TEST_LONG_RANGE_COLUMNS,
    VITAL_DATA_COLUMNS,
    PRESCRIPTION_COLUMNS,
    SURGERY_COLUMNS,
    N_DAYS,
    N_SLOTS,
)


class PatientMedicalRecordSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = PatientMedicalRecord

    def __init__(
            self,
            user: User,
            starred_items_map: Optional[Dict[Tuple[int, int], PatientMedicalRecord]] = None,
            viewed_items_map: Optional[Dict[Tuple[int, int], PatientMedicalRecord]] = None,
    ):
        super().__init__()
        self.user = user
        self.starred_items_map = starred_items_map if starred_items_map is not None else {}
        self.viewed_items_map = viewed_items_map if viewed_items_map is not None else {}

    id = fields.Integer(dump_only=True)
    departments = fields.Nested(DepartmentSchema, many=True)
    patient = fields.Nested(PatientSchema)
    reference_date = fields.DateTime(dump_only=True)
    prediction_state = fields.Method("get_prediction_state")
    alert_type = fields.Integer(dump_only=True)
    actual_state = fields.Enum(PatientMedicalRecord.PredictionStates)
    previous_actual_state = fields.Method("get_previous_actual_state")
    treatment = fields.Enum(PatientMedicalRecord.Treatment)
    is_starred = fields.Method("get_is_starred")
    is_viewed = fields.Method("get_is_viewed")
    is_deleted = fields.Method("get_is_deleted")

    data = fields.Dict(load_only=True)
    prediction = fields.List(fields.Integer(), load_only=True)

    def get_is_starred(self, record, **kwargs):
        return record.id in self.starred_items_map

    def get_is_viewed(self, record, **kwargs):
        return record.id in self.viewed_items_map

    def get_is_deleted(self, record, **kwargs):
        return record.deleted_at is not None

    def get_prediction_state(self, record, **kwargs):
        return (
            None if record.prediction_state is None else record.prediction_state.value
        )

    def get_previous_actual_state(self, record, **kwargs):
        return record.previous_actual_state


class PatientMedicalRecordPredictionsSchema(ma.SQLAlchemyAutoSchema):
    LIMIT = 10
    TARGET_THRESHOLD = 0.5

    prediction = fields.Method("get_normalized_prediction")
    general_data = fields.Method("get_general_data")
    binary_data = fields.Method("get_binary_data")
    test_data = fields.Method("get_test_data")
    vital_data = fields.Method("get_vital_data")
    prob_data = fields.Method("get_prob_data")
    prescription_data = fields.Method("get_prescription_data")
    surgical_data = fields.Method("get_surgical_data")

    def _default_daily_data_formatter(
            self,
            day: int,
            slot: int,
            columns: List[str],
            data: dict,
            top_explanations: Dict[str, Dict[str, str]],
            slot_data: dict,
            **kwargs,
    ):
        for col in columns:
            value = data.get(f"d{day}_{slot}_{col}", None)
            has_lrp = any(
                bool(top_explanations.get(str(day), {}).get(f"{prefix}_{col}"))
                for prefix in ("d1_1", "d1_2", "d1_3", "d2_1", "d2_2", "d2_3")
            )

            slot_data[col] = value
            slot_data[f"{col}_lrp"] = value if has_lrp else None

        return slot_data

    def _format_daily_data(
            self,
            record: PatientMedicalRecord,
            columns: List[str],
            top_explanations: Dict[str, Dict[str, str]],
            callback: Optional[callable] = None,
            **kwargs,
    ):
        data: dict = record.data

        if callback is None:
            callback = self._default_daily_data_formatter
        formatted = []

        for day in range(N_DAYS):
            for slot in range(N_SLOTS):
                slot_data = {
                    APIItems.DAY.value: day + 1,
                    APIItems.SLOT.value: slot + 1,
                    APIItems.DATE.value: self._get_date(record.reference_date, day),
                }
                slot_data = callback(
                    day, slot, columns, data, top_explanations, slot_data, **kwargs
                )
                formatted.append(slot_data)

        return formatted

    def get_general_data(self, record: PatientMedicalRecord, **kwargs):
        if record.data is None:
            return None

        data = record.data or {}

        return {col: data.get(col, None) for col in GENERAL_DATA_COLUMNS}

    def get_binary_data(self, record: PatientMedicalRecord, **kwargs):
        if record.data is None:
            return None

        data: dict = record.data
        top_explanations = record.get_top_explanations_in_any(self.LIMIT)
        top_explanations = top_explanations if top_explanations is not None else {}

        return [
            {
                APIItems.FIELD.value: col,
                APIItems.VALUE.value: data.get(col, None),
                APIItems.LRP_VALUE.value: bool(top_explanations.get(col, None)),
            }
            for col in BINARY_DATA_COLUMNS
        ]

    def _test_data_formatter(
            self,
            day: int,
            slot: int,
            columns: List[str],
            data: dict,
            top_explanations: Dict[str, Dict[str, str]],
            slot_data: dict,
            **kwargs,
    ):
        for col in columns:
            value = data.get(f"d{day}_{slot}_{col}_avg", None)
            has_lrp = any(
                bool(top_explanations.get(str(day), {}).get(f"{prefix}_{col}_{suffix}"))
                for prefix in ("d1_1", "d1_2", "d1_3", "d2_1", "d2_2", "d2_3")
                for suffix in ("min", "max", "avg")
            )

            slot_data[col] = value
            slot_data[f"{col}_lrp"] = value if has_lrp else None

        return slot_data

    def get_test_data(self, record: PatientMedicalRecord, **kwargs):
        if record.data is None:
            return None

        top_explanations = record.get_top_explanations_by_day(self.LIMIT)
        top_explanations = top_explanations if top_explanations is not None else {}

        return {
            APIItems.SMALL.value: self._format_daily_data(
                record,
                TEST_SMALL_RANGE_COLUMNS,
                top_explanations,
                callback=self._test_data_formatter,
            ),
            APIItems.MID.value: self._format_daily_data(
                record,
                TEST_MID_RANGE_COLUMNS,
                top_explanations,
                callback=self._test_data_formatter,
            ),
            APIItems.LONG.value: self._format_daily_data(
                record,
                TEST_LONG_RANGE_COLUMNS,
                top_explanations,
                callback=self._test_data_formatter,
            ),
        }

    def _format_vital_data(
            self,
            record: PatientMedicalRecord,
            name: str,
            column: str,
            area_columns: Tuple[str, str],
            top_explanations: Dict[str, Dict[str, str]],
    ):
        data: dict = record.data

        formatted = []
        lrp_test_columns = (*area_columns, column)

        for day in range(N_DAYS):
            for slot in range(N_SLOTS):
                slot_data = {
                    APIItems.DAY.value: day + 1,
                    APIItems.SLOT.value: slot + 1,
                    APIItems.DATE.value: self._get_date(record.reference_date, day),
                }

                value = data.get(f"d{day}_{slot}_{column}", None)
                has_lrp = any(
                    bool(top_explanations.get(str(day), {}).get(f"{prefix}_{col}"))
                    for prefix in ("d1_1", "d1_2", "d1_3", "d2_1", "d2_2", "d2_3")
                    for col in lrp_test_columns
                )

                slot_data[name] = value
                slot_data[f"{name}_area"] = [
                    data.get(f"d{day}_{slot}_{col}", None) for col in area_columns
                ]
                slot_data[f"{name}_lrp"] = value if has_lrp else None

                formatted.append(slot_data)

        return formatted

    def get_vital_data(self, record: PatientMedicalRecord, **kwargs):
        if record.data is None:
            return None

        top_explanations = record.get_top_explanations_by_day(self.LIMIT)
        top_explanations = top_explanations if top_explanations is not None else {}

        return {
            col.upper(): self._format_vital_data(
                record,
                col,
                f"{col}_avg",
                (f"{col}_min", f"{col}_max"),
                top_explanations,
            )
            for col in VITAL_DATA_COLUMNS
        }

    def get_prob_data(self, record: PatientMedicalRecord, **kwargs):
        if record.data is None:
            return None

        data = record.data or {}

        baseline_creatinine = data.get("b_cr", None)
        creatinine_vals = [None]
        for key in CREATININE_COLUMNS:
            creatinine_vals.append(data.get(key, None) or creatinine_vals[-1])
        creatinine_vals = creatinine_vals[1:]
        for i in range(len(creatinine_vals) - 2, -1, -1):
            creatinine_vals[i] = creatinine_vals[i] or creatinine_vals[i + 1]

        n_entries = len(CREATININE_COLUMNS)

        src_pred = (record.prediction or {}).get("logits", None)
        src_thresh: dict = (record.prediction or {}).get("threshold", {})

        predictions = [None] * n_entries
        predictions_daily = [None] * n_entries
        thresholds = [None] * n_entries

        if src_pred is not None:
            for day, value in src_pred.items():
                day = int(day) - 1
                predictions[day * 3: (day + 1) * 3] = [value] * 3
                predictions_daily[day * 3] = value

            for day, value in src_thresh.items():
                day = int(day) - 1
                thresholds[day * 3: (day + 1) * 3] = [value] * 3

            # Backward fill
            for i in range(1, n_entries):
                if predictions[i] is None and predictions[i - 1] is not None:
                    predictions[i] = predictions[i - 1]
                if thresholds[i] is None and thresholds[i - 1] is not None:
                    thresholds[i] = thresholds[i - 1]

        return [
            {
                APIItems.DATE.value: self._get_date(record.reference_date, i // 3),
                APIItems.DAY.value: (i // 3) + 1,
                APIItems.SLOT.value: (i % 3) + 1,
                APIItems.BASELINE_CREATININE.value: baseline_creatinine,
                APIItems.CREATININE.value: creatinine_vals[i],
                APIItems.PROBABILITY.value: predictions[i],
                APIItems.PROBABILITY_DAILY.value: predictions_daily[i],
                APIItems.THRESHOLD.value: thresholds[i],
            }
            for i in range(len(creatinine_vals))
        ]

    def _prescription_data_formatter(
            self,
            day: int,
            slot: int,
            columns: List[str],
            data: dict,
            top_explanations: Dict[str, Dict[str, str]],
            slot_data: dict,
            **kwargs,
    ):
        for col in columns:
            value = data.get(f"d{day}_{slot}_{col}", None)
            has_lrp = any(
                bool(top_explanations.get(str(day), {}).get(f"{prefix}_{col}"))
                for prefix in ("d1_1", "d1_2", "d1_3", "d2_1", "d2_2", "d2_3")
            )

            slot_data[col] = col if value else None
            slot_data[f"{col}_lrp"] = col if has_lrp else None

        return slot_data

    def _format_prescription_past_months_data(
            self,
            record: PatientMedicalRecord,
            columns: List[str],
            top_explanations: Dict[str, Dict[str, str]],
    ):
        data: dict = record.data

        slot_data = {APIItems.DAY.value: "pre6m", APIItems.SLOT.value: ""}
        for column in columns:
            value = data.get(f"pre6m_{column}", None)
            has_lrp = any(
                bool(top_explanations.get(str(day), {}).get(f"pre6m_{column}"))
                for day in top_explanations.keys()
            )

            slot_data[column] = column if value else None
            slot_data[f"{column}_lrp"] = column if has_lrp else None

        return [slot_data]

    def get_prescription_data(self, record: PatientMedicalRecord, **kwargs):
        if record.data is None:
            return None

        top_explanations = record.get_top_explanations_by_day(self.LIMIT)
        top_explanations = top_explanations if top_explanations is not None else {}

        return self._format_daily_data(
            record,
            PRESCRIPTION_COLUMNS,
            top_explanations,
            self._prescription_data_formatter,
        )

    def get_surgical_data(self, record: PatientMedicalRecord, **kwargs):
        if record.data is None:
            return None

        top_explanations = record.get_top_explanations_by_day(self.LIMIT)
        top_explanations = top_explanations if top_explanations is not None else {}

        data: dict = record.data
        columns = SURGERY_COLUMNS

        return [
            {
                APIItems.DAY.value: day + 1,
                APIItems.DATE.value: self._get_date(record.reference_date, day),
                **{column: data.get(f"d{day}_{column}", None) for column in columns},
            }
            for day in range(N_DAYS)
        ]

    def get_normalized_prediction(self, record: PatientMedicalRecord, **kwargs):
        if record.prediction is None:
            return None
        data: dict = record.prediction

        if len(data.get("logits", {})) == 0:
            return None

        last_day = max(data["logits"].keys())
        logit = data["logits"][last_day]
        threshold = data["threshold"][last_day]

        if logit == threshold:
            value = self.TARGET_THRESHOLD
        elif logit < threshold:
            value = logit / threshold * self.TARGET_THRESHOLD
        else:
            value = threshold + (
                    (logit - threshold) / (1 - threshold) * (1 - self.TARGET_THRESHOLD)
            )
        return {APIItems.VALUE.value: value, APIItems.THRESHOLD.value: threshold}

    def _get_date(self, date, day: int):
        return (date + datetime.timedelta(days=day)).timestamp() * 1000


class PatientMedicalRecordUpdateSchema(ma.SQLAlchemyAutoSchema):
    treatment = fields.Enum(PatientMedicalRecord.Treatment, allow_none=True)
