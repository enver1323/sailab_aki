from typing import Optional, Tuple
import os
import numpy as np
import pandas as pd
from datetime import datetime as dt

from app.inference.utils.pickle_loader import pickle_load, pickle_dump
from app.inference.utils.columns import (
    patient_info,
    dynamic0,
    vital_signs,
    dynamic,
    pre6m,
    static,
    dynamicvalues,
    drop,
)

from flask import current_app

import warnings

warnings.filterwarnings(action="ignore")


def set_stay_length(data: pd.DataFrame) -> pd.DataFrame:
    def get_stay_length(row: pd.Series) -> int:
        date_format = '%Y-%m-%d'
        start_col = 'date_discharge' if row.get('date_discharge') is not None else 'date_now'
        end = dt.strptime(str(row[start_col]), date_format)
        start = dt.strptime(str(row['date_admin']), date_format)
        return (end - start).days

    data['stay_length'] = data.apply(get_stay_length, axis=1)
    print(data['stay_length'])

    return data


def get_data(data: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
    label_encoder_path = os.path.join(
        current_app.config["INFERENCE_DATA_DIR"], "dept_encoding.pickle"
    )
    label_map = pickle_load(label_encoder_path)

    data["department"] = data["department"].apply(label_map.get)

    data_orig = data.copy()
    data = data.drop(columns=drop + ['p_id', 'department', 'date_now']).astype(float)

    for col in ['p_id', 'department', 'date_admin', 'date_now']:
        data[col] = data_orig[col]

    data["p_id2"] = np.arange(0, len(data))

    flag_data = data.copy().isnull().astype("int")
    flag_data["stay_length"] = data["stay_length"].copy()

    print("Length check: ", len(data), len(flag_data))
    return data, flag_data


def initialnull_replace(data: pd.DataFrame) -> pd.DataFrame:
    print("Initial Null data replacing to mid value...")

    # Pre-compute all column names and their replacement values
    cols_to_replace = {}
    for c in dynamicvalues:
        for type_ in ["max", "avg", "min"]:
            col = f"d1_1_{c}_{type_}"
            cols_to_replace[col] = dynamicvalues[c]

    # Vectorized replacement of zero values
    for col, value in cols_to_replace.items():
        data.loc[:, col] = data.loc[:, col].fillna(value)

    return data


def dynamic_fill(data: pd.DataFrame, flag_data: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
    def set_col(col: str, type_: Optional[str] = None):
        type_ = type_ if type_ is not None else ""
        return [
            f"d{cur_day}_{cur_slot}_{col + type_}"
            for cur_day in range(1, 8)
            for cur_slot in range(1, 4)
        ]

    for col in [
        'icu', 'anes_general', 'anes_non_general', 'asa_class', 'surgery_time', 'contrast', 'op_risk_score', 'dialysis'
    ]:
        data.loc[:, set_col(col)] = 0
        flag_data.loc[:, set_col(col)] = 0
        for day in range(1, 8):
            data.loc[:, "d" + str(day) + "_1_" + col] = data.loc[
                :, "d" + str(day) + "_" + col
            ].fillna(0)

    data.loc[:, patient_info] = data.loc[:, patient_info].fillna(0)
    flag_data.loc[:, patient_info] = 0
    data.loc[:, pre6m] = data.loc[:, pre6m].fillna(0)
    flag_data.loc[:, pre6m] = 0

    col = "creatinine"
    mask = data["d1_1_creatinine_max"].isna()
    for type_ in ["max", "min", "avg"]:
        data.loc[mask, f"d1_1_creatinine_{type_}"] = data.loc[mask, "b_cr"]

    for type_ in ["_max", "_min", "_avg"]:
        # Create combined column sets for vital signs
        for col in vital_signs:
            all_vital_cols = set_col(col, type_)
            initial_vital_cols = [
                f"d1_1_{col}{type_}",
                f"d1_2_{col}{type_}",
                f"d1_3_{col}{type_}",
                f"d2_1_{col}{type_}",
                f"d2_2_{col}{type_}",
                f"d2_3_{col}{type_}",
            ]

            # Process vital signs in one batch
            data.loc[:, initial_vital_cols] = data.loc[:, initial_vital_cols].bfill(
                axis=1
            )
            data.loc[:, all_vital_cols] = data.loc[:, all_vital_cols].ffill(axis=1)
            data.loc[:, all_vital_cols] = data.loc[:, all_vital_cols].fillna(0)

        # Process dynamic columns in batches
        for col in dynamic[:-2]:
            col_set = set_col(col, type_)
            if "creatinine" in col:
                col_set.extend(
                    [
                        f"d8_1_{col}{type_}",
                        f"d8_2_{col}{type_}",
                        f"d8_3_{col}{type_}",
                        f"d9_1_{col}{type_}",
                        f"d9_2_{col}{type_}",
                        f"d9_3_{col}{type_}",
                    ]
                )
            data.loc[:, f"d1_1_{col}{type_}"] = data.loc[
                :, f"d1_1_{col}{type_}"
            ].fillna(0)
            data.loc[:, col_set] = data.loc[:, col_set].ffill(axis=1)

    data.loc[:, ['d9_1_aki', 'd9_2_aki', 'd9_3_aki']] = np.nan
    data.loc[:, ['d9_1_aki_critical', 'd9_2_aki_critical', 'd9_3_aki_critical']] = np.nan
    for col in dynamic[-2:]:
        data.loc[:, "d1_1_" + col] = data.loc[:, "d1_1_" + col].fillna(0)
        col_set = set_col(col, None)
        col_set = col_set + [
            "d8_1_" + col,
            "d8_2_" + col,
            "d8_3_" + col,
            "d9_1_" + col,
            "d9_2_" + col,
            "d9_3_" + col,
        ]
        data.loc[:, col_set] = data.loc[:, col_set].ffill(axis=1)

    for type_ in ["_max", "_min", "_avg"]:
        for col in dynamic0:
            col_set = set_col(col, type_)
            data.loc[:, col_set] = data.loc[:, col_set].fillna(0)

    for col in static:
        col_set = set_col(col, None)
        data.loc[:, col_set] = data.loc[:, col_set].fillna(0)
        flag_data.loc[:, col_set] = 0
    return data, flag_data


def fill_na(data: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
    print("Dynamic forward and backward fill...")
    data, flag_data = get_data(data)
    data = initialnull_replace(data)

    print("Dynamic forward fill...")
    data, flag_data = dynamic_fill(data, flag_data)
    aki_col = ['d1_1_aki', 'd1_2_aki', 'd1_3_aki', 'd2_1_aki', 'd2_2_aki', 'd2_3_aki']
    data['init_aki'] = data.loc[:, aki_col].any(axis=1)
    flag_data['init_aki'] = 0

    print("Length check: ", len(data), len(flag_data))

    return data, flag_data
