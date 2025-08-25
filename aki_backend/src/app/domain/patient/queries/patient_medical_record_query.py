from typing import Optional, Sequence, Dict, Tuple
from datetime import datetime
from sqlalchemy import select, text, or_, column

from app.core.database import db
from app.core.generics import Query
from app.domain.user.entities.user import User
from app.domain.user.entities.action_history import ActionHistory, ActionTypes


class PatientMedicalRecordQuery(Query):
    def where_starred(self, user_id: int):
        model = self.models[0]
        return self.join(model.users, isouter=True).filter(User.id == user_id)

    def where_viewed(self, user_id: int):
        model = self.models[0]

        def get_action_query(col):
            return select(
                text(
                    # f"""json_extract(action_history.entity_key,'$.{col}') AS {col}
                    #     FROM action_history
                    #     WHERE
                    #         action_history.user_id = {user_id} AND
                    #         action_history.entity = '{ActionHistory.encode_entity(model)}' AND
                    #         action_history.action_type = '{ActionTypes.view.value}'
                    # """
                    f"""CAST(action_history.entity_key::json->>'{col}' as INT) AS {col}
                        FROM action_history
                        WHERE
                            action_history.user_id = {user_id} AND
                            action_history.entity = '{ActionHistory.encode_entity(model)}' AND
                            action_history.action_type = '{ActionTypes.view.value}'
                    """
                )
            )

        return self.filter(model.id.in_(get_action_query("id")))

    def where_key(self, idx: int):
        model = self.models[0]
        return self.filter(model.id == idx)

    def where_user_departments(self, user: "User"):
        model = self.models[0]
        department_model = self._get_models("departments")[0]

        return self.filter(
            model.departments.any(
                department_model.id.in_(
                    select(column("departments_id"))
                    .select_from(user.departments)
                    .subquery()
                )
            )
        )

    def where_deleted(self):
        model = self.models[0]
        return self.filter(model.deleted_at.isnot(None))

    def where_not_deleted(self):
        model = self.models[0]
        return self.filter(model.deleted_at.is_(None))

    def where_treatment_not_control(self):
        model = self.models[0]
        return self.filter(
            or_(model.treatment != model.Treatment.control, model.treatment.is_(None))
        )

    def search(self, query: str):
        model = self.models[0]
        patient_model = self._get_models("patients")[0]
        query = f"%{query}%"
        return self.filter(
            model.patient.has(
                or_(
                    patient_model.external_id.ilike(query),
                    patient_model.name.ilike(query),
                )
            )
        )

    def evaluate(
        self,
        states: Dict[str, Tuple[Sequence[str], Sequence[str]]],
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ):
        def get_states_str(states):
            return "(" + ", ".join(f"'{state}'" for state in states) + ")"

        def get_states_query_stmt(
            pos_states: Sequence[str], neg_states: Sequence[str], name: str
        ):
            pos_states_str = get_states_str(pos_states)
            neg_states_str = get_states_str(neg_states)
            all_states_str = get_states_str(list(set(pos_states + neg_states)))
            return f"""
                SUM(CASE WHEN prediction_state IN {pos_states_str} and actual_state IN {pos_states_str} THEN 1 ELSE 0 END) as {name}_tp,
                SUM(CASE WHEN prediction_state IN {pos_states_str} and actual_state IN {neg_states_str} THEN 1 ELSE 0 END) as {name}_fp,
                SUM(CASE WHEN prediction_state IN {neg_states_str} and actual_state IN {pos_states_str} THEN 1 ELSE 0 END) as {name}_fn,
                SUM(CASE WHEN prediction_state IN {neg_states_str} and actual_state IN {neg_states_str} THEN 1 ELSE 0 END) as {name}_tn,
                SUM(CASE WHEN prediction_state IN {all_states_str} and actual_state IN {all_states_str} THEN 1 ELSE 0 END) as {name}_total
            """

        model = self.models[0]
        state_names = list(states.keys())

        query_stmt = "SELECT " + ", ".join(
            [
                get_states_query_stmt(pos_states, neg_states, pred_name)
                for pred_name, (pos_states, neg_states) in states.items()
            ]
        )

        query_stmt += f"FROM {model.__table__} "
        if start_date is not None or end_date is not None:
            query_stmt += f"WHERE actual_state IS NOT NULL AND prediction_state != '{model.PredictionStates.unknown.value}' and deleted_at is NULL "
            dates = []
            if start_date is not None:
                dates.append(f" reference_date >= '{start_date}' ")
            if end_date is not None:
                dates.append(f" reference_date <= '{end_date}' ")
            if len(dates) > 0:
                query_stmt += " AND " + " AND ".join(dates)

        state_cols = [
            f"{state}_{col_type}"
            for state in state_names
            for col_type in ("tp", "fp", "fn", "tn", "total")
        ]

        result = db.session.execute(text(query_stmt)).first()
        result = [0 if datum is None else datum for datum in result]
        return dict(zip(state_cols, result)), state_names
