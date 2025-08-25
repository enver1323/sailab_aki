import pandas as pd
import warnings
from typing import Tuple, Optional

from app.inference.utils.temporal_data import (
    format_by_temporal_type,
    mk_drug_temporal,
    mk_dynamic_temporal,
    mk_binary_dy_temporal,
    mk_pinfo_temporal,
)
from app.inference.utils.columns import final_target

warnings.filterwarnings(action="ignore")


def convert_to_temporal(
    data: pd.DataFrame,
    data_flag: pd.DataFrame,
    data_flag2: pd.DataFrame,
    temporal_type: str,
    is_model_light: Optional[bool] = False,
) -> Tuple[Tuple[
    pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame
], pd.DataFrame]:
    (data, data_flag, data_flag2), meta_data = format_by_temporal_type(
        data, data_flag, data_flag2, temporal_type
    )

    # DRUG and OPERATION
    drug_np, drug_array_col_names = mk_drug_temporal(data, is_model_light)

    # DYNAMIC
    (ts_np, ts_np_flag), ts_array_col_names = mk_dynamic_temporal(
        data, data_flag, data_flag2
    )

    # BINARY DYNAMIC
    ts_others_np, ts_array_col_names2 = mk_binary_dy_temporal(data)

    # P_INFO
    p_info_np = mk_pinfo_temporal(
        data,
        [drug_array_col_names, ts_array_col_names, ts_array_col_names2],
        is_model_light,
    )

    target_np = data[final_target].values

    return (drug_np, p_info_np, ts_np, ts_others_np, target_np, ts_np_flag), meta_data
