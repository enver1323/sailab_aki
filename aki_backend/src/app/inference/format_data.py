import pandas as pd
import warnings
from typing import Generator, Tuple

from app.inference.utils.fill_data import fill_na, set_stay_length
from app.inference.utils.dataset import day_by_day_with_past
from app.inference.utils.post_process import post_process_, side_effect, ratio

warnings.filterwarnings(action="ignore")


def format_data(
    data: pd.DataFrame,
) -> Generator[Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame], None, None]:
    data = set_stay_length(data)
    data, flag_data = fill_na(data)

    data_daily, flag_data_daily = day_by_day_with_past(data, flag_data)

    n_days = len(data_daily)
    assert n_days == len(flag_data_daily)

    for day in range(n_days):
        data, flag_data = data_daily[day], flag_data_daily[day]
        data, flag_data = post_process_(data, flag_data)
        data, flag_data, flag_data2 = side_effect(data, flag_data)
        data, flag_data = ratio(data, flag_data)

        yield data, flag_data, flag_data2
