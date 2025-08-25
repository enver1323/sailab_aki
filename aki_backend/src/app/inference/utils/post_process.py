from typing import Tuple

from tqdm import tqdm

import numpy as np
import pandas as pd

from app.inference.utils.columns import (
    static,
    minmaxvalues,
    lowhighvalues,
    dynamic0,
    dynamic,
    vital_signs,
)

import warnings

warnings.filterwarnings(action="ignore")


def surgery_bt_fix(data: pd.DataFrame):
    # Vectorized surgery day calculation
    surgery_days = (
            data[[f'd{d}_{s}_surgery_time'
                  for d in range(1, 3)
                  for s in range(1, 4)]].astype(float) > 0
    ).astype(int)
    data['surgery_day'] = (surgery_days * np.array([1, 1, 1, 2, 2, 2])).max(axis=1)

    # Generate all column names once
    bt_cols = [f'd{d}_{j}_bt_{type_}'
               for d in range(1, 3)
               for j in range(1, 4)
               for type_ in ['max', 'avg', 'min']]

    # Vectorized body temperature update
    mask_day1 = data['surgery_day'] == 1
    mask_day2 = data['surgery_day'] == 2

    # Update day 1 surgery patients
    day1_cols = [col for col in bt_cols]
    data.loc[mask_day1, day1_cols] = 36.8

    # Update day 2 surgery patients
    day2_cols = [col for col in bt_cols if 'd2_' in col]
    data.loc[mask_day2, day2_cols] = 36.8

    data.drop(columns=['surgery_day'], inplace=True)
    return data


def cal_effect(row: pd.DataFrame) -> bool:
    return row.any() > 0


def aki_threshold(
        data: pd.DataFrame,
        flag_data: pd.DataFrame,
):
    print("AKI threshold and margin...")
    data["AKI_thres"] = data["b_cr"] * 1.5
    flag_data["AKI_thres"] = 0

    for d in range(1, 3):
        for s in range(1, 4):
            # Vectorized calculation of margin
            creatinine_col = f"d{d}_{s}_creatinine_max"
            margin = np.minimum(data["AKI_thres"], data[creatinine_col] + 0.3)
            data[f"d{d}_{s}_margin"] = np.maximum(margin - data[creatinine_col], 0)
            flag_data[f"d{d}_{s}_margin"] = 0

    return data, flag_data


def pre_aki_threshold(
        data: pd.DataFrame,
        flag_data: pd.DataFrame,
):
    print("Pre AKI threshold...")
    # Calculate threshold once
    data["pre_AKI_thres"] = data["b_cr"] * 1.25
    flag_data["pre_AKI_thres"] = 0

    # Create column names for all slots at once
    cols = [f"d{d}_{s}_creatinine_max" for d in range(1, 3) for s in range(1, 4)]
    margin_cols = [f"d{d}_{s}_pre_aki_margin" for d in range(1, 3) for s in range(1, 4)]

    # Vectorized comparison for all slots at once
    data[margin_cols] = (
            data[cols].values > data["pre_AKI_thres"].values[:, None]
    ).astype(int)
    flag_data[margin_cols] = 0

    return data, flag_data


def limit(data: pd.DataFrame) -> pd.DataFrame:
    print("Setting limits...")
    # Convert to float once at the start
    data.iloc[:, 7:] = data.iloc[:, 7:].astype(float)

    # Pre-compute column lists
    for i, c in enumerate(minmaxvalues):
        if i < 4:
            # For first 4 columns, use as is
            data[c] = data[c].clip(upper=minmaxvalues[c][0], lower=minmaxvalues[c][1])
        else:
            # Create column names once
            if "_max" in c or "_avg" in c or "_min" in c:
                cols = [f"d{d}_{s}_{c}" for d in range(1, 3) for s in range(1, 4)]
            else:
                cols = [
                    f"d{d}_{s}_{c}_{type_}"
                    for d in range(1, 3)
                    for s in range(1, 4)
                    for type_ in ["max", "avg", "min"]
                ]

            # Vectorized clip operation on all columns at once
            data[cols] = data[cols].clip(
                upper=minmaxvalues[c][0], lower=minmaxvalues[c][1]
            )

    return data


def flag_replace(data: pd.DataFrame, flag_data: pd.DataFrame) -> pd.DataFrame:
    print("Flag data replacing to real value...")
    drug_cols_array = []
    for d in ["pre6m", "d1_1", "d1_2", "d1_3", "d2_1", "d2_2", "d2_3"]:
        drug_cols_array.extend([d + "_" + c for c in static])
    flag_data.loc[:, [f"pre6m_{col}" for col in static]] = 0
    tmp = flag_data.copy().loc[:, drug_cols_array]
    flag_data = flag_data.replace({0: 1, 1: -1})
    lowhigh_df = pd.DataFrame(index=data.index)
    lowhigh_df2 = pd.DataFrame(index=data.index)

    # Pre-compute column names
    days = range(1, 3)
    slots = range(1, 4)
    types = ["max", "avg", "min"]

    for i, c in enumerate(lowhighvalues):
        # Determine if we're handling regular or special columns
        is_regular = i < len(lowhighvalues) - 12

        # Generate column names once
        if is_regular:
            cols = [
                f"d{day}_{slot}_{c}_{type_}"
                for day in days
                for slot in slots
                for type_ in types
            ]
        else:
            cols = [f"d{day}_{slot}_{c}" for day in days for slot in slots]

        # Process all columns for this variable at once
        for col in cols:
            mask_1 = flag_data[col] == 1
            flag_data.loc[mask_1, col] = data.loc[mask_1, col]
            lowhigh_df2[col] = data[col]

            mask_not_neg1 = flag_data[col] != -1

            if lowhighvalues[c][0] == 1:
                flag_data.loc[mask_not_neg1, col] = (
                        flag_data.loc[mask_not_neg1, col] < lowhighvalues[c][1]
                )
                lowhigh_df2[col] = lowhigh_df2[col] < lowhighvalues[c][1]

            elif lowhighvalues[c][0] == 2:
                flag_data.loc[mask_not_neg1, col] = (
                        flag_data.loc[mask_not_neg1, col] > lowhighvalues[c][2]
                )
                lowhigh_df2[col] = (lowhigh_df2[col] > lowhighvalues[c][2]) & (
                        lowhigh_df2[col] > 0
                )

            elif lowhighvalues[c][0] == 3:
                flag_data.loc[mask_not_neg1, col] = (
                                                            flag_data.loc[mask_not_neg1, col] > lowhighvalues[c][2]
                                                    ) | (flag_data.loc[mask_not_neg1, col] < lowhighvalues[c][1])
                lowhigh_df2[col] = (
                                           (lowhigh_df2[col] > lowhighvalues[c][2]) & (lowhigh_df2[col] > 0)
                                   ) | (lowhigh_df2[col] < lowhighvalues[c][1])

            elif lowhighvalues[c][0] == 4:
                flag_data.loc[mask_not_neg1, col] = 0
                lowhigh_df2[col] = 0

            lowhigh_df[col] = flag_data[col]

    lowhigh_df = pd.concat([lowhigh_df, tmp], axis=1)
    lowhigh_df2 = pd.concat([lowhigh_df2, tmp], axis=1)

    return lowhigh_df, lowhigh_df2


def get_side_effects(data: pd.DataFrame, flag_data: pd.DataFrame):
    print("Calculating side effects...")
    side_effects = ['nephro_toxic', 'renal_relevant', 'bp_up', 'bp_down', 'pr_relevant', 'hemodynamic',
                    'inflammation', 'hypoperfusion', 'thr_micro', 'tub_necrosis', 'tubular', 'inter_neph']
    relevant_index = dict(zip(side_effects, [
        [1, 2, 3, 7, 8, 9, 11, 13, 14, 16],
        [0, 4, 5, 6, 9, 10, 13, 15, 12],
        [11, 15],
        [0, 4, 5, 6, 10],
        [5, 6, 15],
        [0, 4, 5, 10, 11, 12, 15],
        [1, 2, 3, 8, 11, 14],
        [0, 4, 11, 15],
        [9, 13],
        [2, 3, 7, 8, 11, 14],
        [2, 3, 7, 8, 9, 11, 12, 13, 14, 16],
        [7, 11, 14]
    ]))

    # Pre-compute all possible prescription names
    base_pres_names = ['acei', 'acyclovir', 'aminoglycoside', 'amphotericin', 'arb',
                       'betablocker', 'ccb', 'cisplatin', 'colistin', 'cyclosporin',
                       'diuretics', 'nsaid', 'statin', 'tacrolimus', 'vancomycin',
                       'vasopressor', 'tnx']
    days = ['pre6m', 'd1_1', 'd1_2', 'd1_3', 'd2_1', 'd2_2', 'd2_3']

    # Vectorized operations for side effects
    for effect in tqdm(side_effects):
        pres_index = relevant_index[effect]

        for day in days:
            column_name = f"{day}_{effect}"
            pres_names = [f"{day}_{base}" for base in base_pres_names]
            selected_pres = [pres_names[idx] for idx in pres_index]
            data[column_name] = data[selected_pres].any(axis=1)
            flag_data[column_name] = flag_data[selected_pres].any(axis=1)

    # Handle contrast effects
    contrast_days = ['d1_1', 'd1_2', 'd1_3', 'd2_1', 'd2_2', 'd2_3']
    for day in contrast_days:
        contrast_col = f"{day}_contrast"
        data[f"{day}_nephro_toxic"] = data[contrast_col]
        data[f"{day}_tubular"] = data[contrast_col]
        flag_data[f"{day}_nephro_toxic"] = flag_data[contrast_col]
        flag_data[f"{day}_tubular"] = flag_data[contrast_col]
    return data, flag_data


def get_binary(data: pd.DataFrame, data_flag: pd.DataFrame):
    # Simple boolean operations
    data['age_extreme'] = data['age'] > 70

    # Vectorized operations for day 2 conditions
    day2_mask = data['day'] == 2
    data.loc[day2_mask, 'b_cr_true'] = (data_flag.loc[day2_mask, 'd1_1_creatinine_max'] != -1)
    data['b_cr_true'].fillna(False, inplace=True)

    # Vectorized creatinine calculations
    cr_col = ['d1_1_creatinine_max', 'd1_2_creatinine_max', 'd1_3_creatinine_max',
              'd2_1_creatinine_max', 'd2_2_creatinine_max', 'd2_3_creatinine_max']
    data['Cr_kidigo'] = (data[cr_col].max(axis=1) - data[cr_col].min(axis=1)) >= 0.3

    # Initialize pre6m columns efficiently
    op = ['antibiotic_j01a', 'antibiotic_j01c', 'antibiotic_j01d', 'antibiotic_j01e',
          'antibiotic_j01f', 'antibiotic_j01m', 'antibiotic_j01x', 'med_albumin',
          'rbc', 'anes_general', 'anes_non_general', 'asa_class', 'contrast', 'dialysis',
          'surgery_time', 'op_risk_score', 'icu']
    col_set = ['pre6m_' + c for c in op]
    data[col_set] = 0

    # Vectorized binary feature calculations
    data['surgery'] = data[[f'd{d}_{s}_surgery_time' for d in range(1, 3) for s in range(1, 4)]].any(axis=1)
    data['blood'] = data[[f'd{d}_{s}_tnx' for d in range(1, 3) for s in range(1, 4)]].any(axis=1)
    data['contrast'] = data[[f'd{d}_{s}_contrast' for d in range(1, 3) for s in range(1, 4)]].any(axis=1)
    data['dialysis'] = data[[f'd{d}_{s}_dialysis' for d in range(1, 3) for s in range(1, 4)]].any(axis=1)
    data['cancer_high_risk'] = data[['female_genital_cancer', 'male_genital_cancer', 'urinary_cancer']].any(axis=1)

    # Department weight using numpy where
    high_risk_departments = {0, 2, 5, 7, 8, 11, 13, 14, 15}
    data['department_weight'] = np.where(data['department'].isin(high_risk_departments), 1, 0)

    # eGFR categorization using numpy select
    egfr_conditions = [
        data['b_egfr'] >= 90,
        (data['b_egfr'] >= 60) & (data['b_egfr'] < 90),
        (data['b_egfr'] >= 30) & (data['b_egfr'] < 60),
        (data['b_egfr'] >= 15) & (data['b_egfr'] < 30),
        data['b_egfr'] < 15
    ]
    egfr_choices = [1, 2, 3, 4, 5]
    data['b_egfr_categorize'] = np.select(egfr_conditions, egfr_choices)

    # BMI categorization using numpy select
    bmi_conditions = [
        data['bmi'] >= 30,
        (data['bmi'] >= 25) & (data['bmi'] < 30),
        (data['bmi'] >= 23) & (data['bmi'] < 25),
        (data['bmi'] >= 18.5) & (data['bmi'] < 23),
        data['bmi'] < 18.5
    ]
    bmi_choices = [4, 3, 2, 1, 5]
    data['bmi_categorize'] = np.select(bmi_conditions, bmi_choices)

    return data


def get_ratio(data: pd.DataFrame, data_flag: pd.DataFrame):
    print("Calculate Ratio...")

    cols = dynamic0 + vital_signs + dynamic[:-2]
    types = ["max", "avg", "min"]

    # Pre-compute all column names
    all_cols = []
    for day in range(1, 3):
        for slot in range(1, 4):
            for c in cols:
                for type_ in types:
                    all_cols.append(f"d{day}_{slot}_{c}_{type_}")

    # Create ratio and gradient columns at once
    ratio_cols = [col + "_ratio" for col in all_cols]
    gradient_cols = [col + "_gradient" for col in all_cols]
    data[ratio_cols] = 0
    data[gradient_cols] = 0

    # Process each time slot efficiently
    for day in range(1, 3):
        for slot in range(1, 4):
            if day == 1 and slot == 1:
                continue

            # Get current and previous slot indices
            if (day == 2 and slot == 1) or (day == 3 and slot == 1):
                prev_day, prev_slot = day - 1, 3
            else:
                prev_day, prev_slot = day, slot - 1

            # Vectorized computation for all columns in current time slot
            for c in cols:
                curr_cols = [f"d{day}_{slot}_{c}_{type_}" for type_ in types]
                prev_cols = [f"d{prev_day}_{prev_slot}_{c}_{type_}" for type_ in types]
                curr_cr = [f"d{day}_{slot}_creatinine_{type_}" for type_ in types]
                prev_cr = [
                    f"d{prev_day}_{prev_slot}_creatinine_{type_}" for type_ in types
                ]

                ratio_cols = [f"{col}_ratio" for col in curr_cols]
                gradient_cols = [f"{col}_gradient" for col in curr_cols]

                # Mask for non-zero previous values
                mask = data[prev_cols[0]] != 0

                # Vectorized ratio calculation
                if mask.any():
                    data.loc[mask, ratio_cols] = (
                                                         data.loc[mask, curr_cols].values
                                                         - data.loc[mask, prev_cols].values
                                                 ) / data.loc[mask, prev_cols].values

                    # Vectorized gradient calculation
                    data.loc[mask, gradient_cols] = (
                                                            data.loc[mask, curr_cols].values
                                                            - data.loc[mask, prev_cols].values
                                                    ) / (
                                                            data.loc[mask, curr_cr].values
                                                            - data.loc[mask, prev_cr].values
                                                            + 1e-4
                                                    )

    data.fillna(0, inplace=True)
    data.replace([np.inf, -np.inf], 0, inplace=True)

    return data


def post_process_(
        data: pd.DataFrame, flag_data: pd.DataFrame
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    data = surgery_bt_fix(data)

    data, flag_data = aki_threshold(limit(data), flag_data)
    data, flag_data = pre_aki_threshold(data, flag_data)

    return data, flag_data


def side_effect(
        data: pd.DataFrame, flag_data: pd.DataFrame
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    flag_data, flag_data2 = flag_replace(data, flag_data)
    data, flag_data = get_side_effects(data, flag_data)

    data = get_binary(data, flag_data)

    return data, flag_data, flag_data2


def ratio(
        data: pd.DataFrame, flag_data: pd.DataFrame
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    data = get_ratio(data, flag_data)

    return data, flag_data
