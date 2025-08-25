import warnings
from typing import Tuple, List

import numpy as np
import pandas as pd
from pandas import DataFrame


from app.inference.utils.columns import static_e

warnings.filterwarnings(action="ignore")

random_seed = 10
np.random.seed(random_seed)


def preprocess_file(
    filepath: str, department_ids: List[str]
) -> DataFrame:
    data = pd.read_csv(filepath, encoding='euc-kr')  # encoding='CP949'

    print("Original Data Length: ", len(data))
    data = data.dropna(how="any", subset=static_e).reset_index(drop=True)
    print("After filter by nans in static columns: ", len(data))

    data = data.loc[data["age"] > 18]
    print("After filter by age less than 18: ", len(data))

    data["year"] = data["date_admin"].apply(lambda x: x.split("-")[0])
    data["month"] = data["date_admin"].apply(lambda x: x.split("-")[1])
    data = data.loc[data["year"].astype(int) > 2018].reset_index(drop=True)
    print("After filter by year less than 2018: ", len(data))

    data = data.loc[data["department"].isin(set(department_ids))].reset_index(drop=True)
    print("After filter by department: ", len(data))
    data["stay_length"] = data["stay_length"].clip(upper=9)

    # Transform NaN to None
    print("Filling na. ...")
    data.fillna(np.nan, inplace=True)
    print("Preprocressed len: ", len(data))

    print("Replacing na. ...")
    data.replace(np.nan, None, inplace=True)
    print("Preprocressed len: ", len(data))

    print("Resetting index ...")
    data.reset_index(drop=True, inplace=True)
    print("Preprocressed len: ", len(data))

    data["p_id"] = data["p_id"].astype(int).astype(str)

    return data
