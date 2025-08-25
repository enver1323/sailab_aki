from typing import Tuple, List

import pandas as pd
import numpy as np

from app.inference.utils.columns import (
    patient_info,
    dynamic0,
    vital_signs,
    dynamic,
    pre6m,
    static,
)

import warnings

warnings.filterwarnings(action="ignore")


def df_with_index(tgt: pd.DataFrame, idx_df: pd.DataFrame):
    return pd.DataFrame.from_records(tgt.values).set_index(idx_df.index).astype("float")


def day_by_day(
    data: pd.DataFrame,
    flag_data: pd.DataFrame,
):
    meta_cols = ['p_id2', 'p_id', 'department', 'month', 'date_now', 'date_admin', 'init_aki']

    # Perform assignments in bulk
    result = pd.DataFrame(
        {"day": data["stay_length"] - 1, **{col: data[col] for col in meta_cols}}
    )
    result_flag = pd.DataFrame(
        {"day": flag_data["stay_length"] - 1, **{col: data[col] for col in meta_cols}}
    )

    meta_cols = ["day"] + meta_cols

    def add_day_to_cols(columns: list, day: int):
        return [f"d{day}_{col}" for col in columns]

    def add_day_and_slot_to_cols(columns: list, day: int):
        return [f"d{day}_{slot}_{col}" for col in columns for slot in range(1, 4)]

    def add_day_and_slot_to_cols_target(columns: list, day: int, pred=False):
        pred_type = "target" if pred else "pre"
        return [
            f"d{day}_{slot}_{pred_type}_{col}" for col in columns for slot in range(1, 4)
        ]

    def get_records_by_stay_len(columns: list, col_mapper: callable, offset: int):
        return lambda row: row[
            col_mapper(columns, int(row["stay_length"]) + offset)
        ].values

    result[patient_info[4:] + pre6m] = data[patient_info[4:] + pre6m].copy()
    result_flag[patient_info[4:] + pre6m] = flag_data[patient_info[4:] + pre6m].copy()

    for i in range(2):
        result[add_day_and_slot_to_cols(static, i + 1)] = df_with_index(
            data.apply(
                get_records_by_stay_len(static, add_day_and_slot_to_cols, i - 2),
                axis=1,
            ),
            data,
        )

        result_flag[add_day_and_slot_to_cols(static, i + 1)] = df_with_index(
            flag_data.apply(
                get_records_by_stay_len(static, add_day_and_slot_to_cols, i - 2),
                axis=1,
            ),
            flag_data,
        )

    for type_ in ["max", "min", "avg"]:
        dy_all = [f"{c}_{type_}" for c in dynamic0 + vital_signs + dynamic[:-2]]
        for i in range(2):
            result[add_day_and_slot_to_cols(dy_all, i + 1)] = df_with_index(
                data.apply(
                    get_records_by_stay_len(dy_all, add_day_and_slot_to_cols, i - 2),
                    axis=1,
                ),
                data,
            )
            result_flag[add_day_and_slot_to_cols(dy_all, i + 1)] = df_with_index(
                flag_data.apply(
                    get_records_by_stay_len(dy_all, add_day_and_slot_to_cols, i - 2),
                    axis=1,
                ),
                flag_data,
            )

    for i in range(2):
        result[add_day_and_slot_to_cols(["aki", "aki_critical"], i + 1)] = (
            df_with_index(
                data.apply(
                    get_records_by_stay_len(
                        ["aki", "aki_critical"], add_day_and_slot_to_cols, i - 2
                    ),
                    axis=1,
                ),
                data,
            )
        )
        result_flag[add_day_and_slot_to_cols(["aki", "aki_critical"], i + 1)] = (
            df_with_index(
                flag_data.apply(
                    get_records_by_stay_len(
                        ["aki", "aki_critical"], add_day_and_slot_to_cols, i - 2
                    ),
                    axis=1,
                ),
                flag_data,
            )
        )

    cols_arranged = sorted(set(result.columns).difference(meta_cols))
    cols_arranged = meta_cols + cols_arranged

    result = result[cols_arranged]
    result_flag = result_flag[cols_arranged]

    return result, result_flag


def make_target(data: pd.DataFrame):
    target_cols1_p = ['d1_1_aki', 'd1_2_aki', 'd1_3_aki']
    target_cols2_p = ['d2_1_aki', 'd2_2_aki', 'd2_3_aki']

    target_df = pd.DataFrame()

    def format_df(df: pd.DataFrame):
        return (df.astype('int').any(axis=1)).astype('float')

    target_df['pre_aki'] = format_df(data[target_cols1_p + target_cols2_p])
    target_df['48h'] = target_df['pre_aki'].copy()
    target_df['24h_1'] = format_df(data[target_cols1_p])
    target_df['24h_2'] = format_df(data[target_cols2_p])

    print("AKI")
    print("48H-1Alarm:\n", target_df['48h'].value_counts(),
          "\n24H-1Alarm-day1:\n", target_df['24h_1'].value_counts(),
          "\n24H-1Alarm-day2:\n", target_df['24h_2'].value_counts())

    return target_df


def day_by_day_with_past(
    data: pd.DataFrame,
    data_flag: pd.DataFrame,
) -> Tuple[List[pd.DataFrame], List[pd.DataFrame]]:
    result = []
    result_flag = []

    data = data.copy()
    data_flag = data_flag.copy()

    data["stay_length"] -= 1
    data_flag["stay_length"] = data["stay_length"].copy()

    data = data[data["stay_length"] > 2]
    data_flag = data_flag[data_flag["stay_length"] > 2]

    while len(data) > 0:
        offset_data, offset_flag = day_by_day(data, data_flag)

        target = make_target(offset_data)
        offset_data = pd.concat([offset_data, target], axis=1)
        offset_flag = pd.concat([offset_flag, target], axis=1)

        result.append(offset_data)
        result_flag.append(offset_flag)

        data["stay_length"] -= 1
        data = data[data["stay_length"] > 2]

        data_flag["stay_length"] -= 1
        data_flag = data_flag[data_flag["stay_length"] > 2]

    return result, result_flag
