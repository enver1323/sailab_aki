import os
import pickle
from typing import Tuple, List

import numpy as np
import pandas as pd

from app.inference.utils.columns import (
    static,
    minmaxvalues,
    lowhighvalues,
    dynamic0,
    dynamic,
    vital_signs,
    cancer_name,
    final_target,
)

import warnings

warnings.filterwarnings(action="ignore")


def format_by_temporal_type(
        data: pd.DataFrame,
        data_flag: pd.DataFrame,
        data_flag2: pd.DataFrame,
        temporal_type: str,
) -> Tuple[Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame], pd.DataFrame]:
    flag = int(temporal_type == "recovery")

    data = data.loc[data["pre_aki"] == flag]
    data_flag = data_flag.loc[data.index]
    data_flag2 = data_flag2.loc[data.index]

    # Cr이나 vital sign하나도 없는거 제외
    cols = [
        "d1_1_dbp_max",
        "d1_2_dbp_max",
        "d1_3_dbp_max",
        "d2_1_dbp_max",
        "d2_2_dbp_max",
        "d2_3_dbp_max",
    ]
    cols2 = [
        "d1_1_creatinine_max",
        "d1_2_creatinine_max",
        "d1_3_creatinine_max",
        "d2_1_creatinine_max",
        "d2_2_creatinine_max",
        "d2_3_creatinine_max",
    ]
    data = data.loc[(data[cols].any(axis=1) & data[cols2].any(axis=1))]
    data_flag = data_flag.loc[data.index]
    data_flag2 = data_flag2.loc[data.index]

    # Cr 변화 없는거 제외
    data = data.loc[data["d1_1_creatinine_max"] - data["d2_3_creatinine_max"] != 0]
    data_flag = data_flag.loc[data.index]
    data_flag2 = data_flag2.loc[data.index]

    # """
    # Cr검사 2회 미만 제외
    if temporal_type != "recovery":
        flag = None
        if temporal_type == "freq":
            flag = False
        elif temporal_type == "rare":
            flag = True
        idx = data_flag.loc[
            (
                    data_flag[
                        [
                            "d1_1_creatinine_max",
                            "d1_2_creatinine_max",
                            "d1_3_creatinine_max",
                            "d2_1_creatinine_max",
                            "d2_2_creatinine_max",
                            "d2_3_creatinine_max",
                        ]
                    ]
                    .clip(-1, 0)
                    .sum(axis=1)
                    < -4
            ) == flag
            ].index
        data = data.loc[idx]
        data_flag = data_flag.loc[idx]
        data_flag2 = data_flag2.loc[idx]
    # """

    microalbumins = [c for c in data.columns if "microalbumin" in c]
    meta_data = data[["day", "department"]]

    data = data.drop(
        columns=["pre_aki", "day", "p_id", "p_id2"] + microalbumins + cancer_name
    )

    return (data, data_flag, data_flag2), meta_data


def mk_drug_temporal(
        data: pd.DataFrame, is_model_light: bool = False
) -> Tuple[np.ndarray, np.ndarray]:
    # Pre-compute drug list using list comprehension instead of loop
    drops = []
    if is_model_light:
        selected_cols = [
            'statin', 'cyclosporin', 'cisplatin', 'acei', 'colistin', 'tnx', 'acyclovir', 'tacrolimus', 'vancomycin',
            'amphotericin', 'op_risk_score', 'anes_general', 'anes_non_general', 'contrast', 'dialysis'
        ]
        all_cols = [
            ['d1_1_' + c, 'd1_2_' + c, 'd1_3_' + c, 'd2_1_' + c, 'd2_2_' + c, 'd2_3_' + c] for c in selected_cols
        ]
        drops = all_cols
    else:
        drug = ['_'.join(c.split('_')[1:]) for c in data.columns if 'pre6m' in c]

        op = ['anes_general', 'anes_non_general', 'asa_class', 'contrast', 'dialysis', 'surgery_time', 'op_risk_score',
              'icu']
        treatment = ['antibiotic_j01a', 'antibiotic_j01c', 'antibiotic_j01d', 'antibiotic_j01e',
                     'antibiotic_j01f', 'antibiotic_j01m', 'antibiotic_j01x', 'med_albumin', 'rbc']

        # Pre-calculate column sets for all time periods at once
        base_cols = drug[:-29] + op  # + drug[-29:-17] + treatment

        drop_pre6m = [['pre6m_' + c for c in base_cols]]
        drop_op = [
            [f"{d}_{c}" for c in drug[-29:-17] + treatment]
            for d in ['pre6m', 'd1_1', 'd1_2', 'd1_3', 'd2_1', 'd2_2', 'd2_3']
        ]

        all_cols = [
            [f"{d}_{c}" for c in base_cols]
            for d in ['d1_1', 'd1_2', 'd1_3', 'd2_1', 'd2_2', 'd2_3']
        ]
        drops = all_cols + drop_pre6m + drop_op
    # Single DataFrame selection instead of multiple appends
    drug_array = [data[cols].values for cols in all_cols]
    drug_np = np.stack(drug_array, axis=-1)  # More efficient than array() + transpose()

    return drug_np, np.hstack(drops)


def mk_dynamic_temporal(
        data: pd.DataFrame,
        data_flag: pd.DataFrame,
        data_flag2: pd.DataFrame,
        is_model_light: bool = False,
) -> Tuple[Tuple[np.ndarray], np.ndarray]:
    dynamics = dynamic0 + vital_signs + dynamic[:-2]
    types = ["max", "min", "avg"]

    if is_model_light:
        dynamics = [
            "creatinine",
            "pr",
            "sbp",
            "bt",
            "dbp",
            "albumin",
            "bilirubin",
            "crp",
            "calcium",
            "sodium",
            "plt",
            "hb",
            "hematocrit",
            "wbc",
            "potassium",
            "troponin",
            "ck",
            "urine_protein_dipstick",
            "urine_creatinine",
            "urine_protein_cr_ratio",
        ]
        types = ["max"]
    # Pre-calculate all column names once
    all_col_sets = []
    for type_ in types:
        for d in ["d1_1", "d1_2", "d1_3", "d2_1", "d2_2", "d2_3"]:
            all_col_sets.extend(
                [
                    [f"{d}_{c}_{type_}" for c in dynamics],  # base columns
                    [f"{d}_{c}_{type_}_ratio" for c in dynamics],  # ratio columns
                    [f"{d}_{c}_{type_}_gradient" for c in dynamics],  # gradient columns
                ]
            )

    # Pre-allocate numpy arrays with known shapes
    n_samples = len(data)
    n_features = len(dynamics)
    arrays = {
        "base": np.zeros(
            (len(types), 6, n_samples, n_features)
        ),  # [type, time, samples, features]
        "flag": np.zeros((len(types), 6, n_samples, n_features)),
        "flag2": np.zeros((len(types), 6, n_samples, n_features)),
        "flag3": np.zeros((len(types), 6, n_samples, n_features)),
        "flag4": np.zeros((len(types), 6, n_samples, n_features)),
    }

    # Fill arrays directly without intermediate lists
    for t_idx, type_ in enumerate(types):
        for d_idx, d in enumerate(["d1_1", "d1_2", "d1_3", "d2_1", "d2_2", "d2_3"]):
            base_cols = [d + "_" + c + "_" + type_ for c in dynamics]
            ratio_cols = [d + "_" + c + "_" + type_ + "_ratio" for c in dynamics]
            grad_cols = [d + "_" + c + "_" + type_ + "_gradient" for c in dynamics]

            arrays["base"][t_idx, d_idx] = data[base_cols].values
            arrays["flag"][t_idx, d_idx] = data_flag[base_cols].values
            arrays["flag2"][t_idx, d_idx] = data_flag2[base_cols].values
            arrays["flag3"][t_idx, d_idx] = data[ratio_cols].values
            arrays["flag4"][t_idx, d_idx] = data[grad_cols].values

    # Transpose once at the end
    ts_np = arrays["base"].transpose(2, 3, 0, 1)
    ts_np_flag = np.concatenate(
        [
            arrays["flag"].transpose(2, 3, 0, 1),
            arrays["flag2"].transpose(2, 3, 0, 1),
            arrays["flag3"].transpose(2, 3, 0, 1),
            arrays["flag4"].transpose(2, 3, 0, 1),
        ],
        axis=2,
    )

    return (ts_np, ts_np_flag), np.hstack(np.array(all_col_sets))


def mk_binary_dy_temporal(data: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
    dy_others = dynamic[-2:] + ["margin", "pre_aki_margin"]
    ts_array2 = []
    ts_array_col_names2 = []
    for d in ["d1_1", "d1_2", "d1_3", "d2_1", "d2_2", "d2_3"]:
        col_set = [d + "_" + c for c in dy_others]
        ts_array2.append(data[col_set])
        ts_array_col_names2.append(col_set)
    ts_np2 = np.array(ts_array2).transpose(1, 2, 0)

    return ts_np2, np.hstack(np.array(ts_array_col_names2))


def mk_pinfo_temporal(
        data: pd.DataFrame, drop_cols: List[np.ndarray], is_model_light: bool = False
):
    cols_to_preserve = []
    if is_model_light:
        cols_to_preserve = [
            'department', 'b_cr', 'age', 'age_extreme', 'sex', 'bmi', 'weight', 'b_egfr', 'b_egfr_categorize',
            'surgery', 'smoking', 'drinking', 'pre_AKI_thres', 'aki', 'cci', 'chf', 'ami', 'cancer', 'cancer_high_risk',
            'renal_disease', 'pulmonary_disease', 'liver_disease', 'diabetes', 'paraplegia'
        ]
    else:
        drop_cols = map(list, drop_cols)
        all_drop_cols = set(sum(drop_cols, []) + final_target + ["Cr_kidigo", "date_now", "date_admin"])
        cols_to_preserve = [c for c in data.columns if c not in all_drop_cols]
    cols_to_preserve.append("Cr_kidigo")

    return np.array(data[cols_to_preserve].values)
