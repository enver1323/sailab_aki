import os
from collections import defaultdict
from typing import List, Dict, Tuple

import pandas as pd
import numpy as np

from app import app

from app.domain.patient.entities.patient import PatientMedicalRecord
from app.domain.user.entities.department import TemporalType, Department
from app.inference.test import predict_and_explain
from app.inference.format_data import format_data
from app.inference.convert_to_temporal import convert_to_temporal


def df_from_patient_medical_records(
    records: List[PatientMedicalRecord],
) -> pd.DataFrame:
    return pd.DataFrame.from_records([record.data for record in records])


def process_data_by_type(
    data: pd.DataFrame,
    flag_data: pd.DataFrame,
    flag_data2: pd.DataFrame,
    temporal_type: str,
    thresholds: Dict[str, float],
    is_model_light: bool,
) -> Tuple[np.ndarray, np.ndarray, pd.DataFrame, pd.DataFrame, np.ndarray]:
    data, meta_data = convert_to_temporal(
        data, flag_data, flag_data2, temporal_type, is_model_light
    )
    data = list(data)

    work_dir = os.path.join(
        app.config["INFERENCE_DATA_DIR"],
        f"result_{temporal_type}{'_light' if is_model_light else ''}",
    )

    thresholds = meta_data["department"].apply(lambda x: thresholds.get(x, 0.5)).values
    logits, predictions, explanations = (
        predict_and_explain(data, work_dir, thresholds)
        if len(data[0]) > 0
        else (np.array([]), np.array([]), pd.DataFrame([]))
    )

    return logits, predictions, explanations, meta_data, thresholds

def prior_predicted_days(records: List[PatientMedicalRecord]) -> List[int]:
    return [record.max_predicted_day for record in records]

def predict_aki(records: List[PatientMedicalRecord]):
    input_df = df_from_patient_medical_records(records)
    predicted_days = prior_predicted_days(records)

    input_len = len(input_df)

    def get_pred_template():
        return [{} for _ in range(input_len)]

    all_logits = get_pred_template()
    all_predictions = get_pred_template()
    all_explanations = get_pred_template()
    all_thresholds = get_pred_template()

    data = format_data(input_df.copy())

    thresholds_pool = Department.get_inference_thresholds()

    for day_datum_acc in data:
        datum, flag_data, flag_data2 = day_datum_acc
        for is_model_light in [False]:
            for temporal_type in [TemporalType.freq, TemporalType.rare]:
                temporal_type = temporal_type.value

                logits, predictions, explanations, meta_data, thresholds = (
                    process_data_by_type(
                        datum,
                        flag_data,
                        flag_data2,
                        temporal_type,
                        thresholds_pool[temporal_type],
                        is_model_light,
                    )
                )

                explanations = explanations.to_dict("records")

                has_na_vals = lambda x: any(map(lambda y: pd.isna(y), x.values()))

                for pred_i, data_i in enumerate(meta_data.index):
                    day = int(meta_data.iloc[pred_i]["day"])
                    if predicted_days[data_i] is not None and day <= predicted_days[data_i]:
                        continue

                    if not np.isnan(logits[pred_i]):
                        all_logits[data_i][day] = logits[pred_i].item()

                    if not np.isnan(predictions[pred_i]):
                        all_predictions[data_i][day] = predictions[pred_i].item()

                    if not has_na_vals(explanations[pred_i]):
                        all_explanations[data_i][day] = explanations[pred_i]

                    all_thresholds[data_i][day] = thresholds[pred_i]

    results = [
        {
            "logits": logits,
            "prediction": prediction,
            "explanations": explanations,
            "threshold": threshold,
        }
        for logits, prediction, explanations, threshold in zip(
            all_logits, all_predictions, all_explanations, all_thresholds
        )
    ]

    return results
