import os
import random
from typing import List

import numpy as np

import warnings

import pandas as pd

warnings.filterwarnings(action="ignore")

import torch
from torch.utils.data import DataLoader

from app.inference.model.AKImodel import AKIDataset, ResNet, lrp, predict
from app.inference.utils.pickle_loader import pickle_load


def seed_everything(seed: int = 42):
    random.seed(seed)
    np.random.seed(seed)
    os.environ["PYTHONHASHSEED"] = str(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


device = "cuda" if torch.cuda.is_available() else "cpu"


def scale_data(data: List[np.ndarray], path: str) -> List[np.ndarray]:
    for i in range(data[0].shape[-1]):
        sc = pickle_load(os.path.join(path, f"scaler0_{i}.pickle"))
        data[0][:, :, i] = np.array(sc.transform(data[0][:, :, i]))

    sc = pickle_load(os.path.join(path, f"scaler1.pickle"))
    data[1] = np.array(sc.transform(data[1]))

    for i in range(data[2].shape[-1]):
        for j in range(data[2].shape[-2]):
            sc = pickle_load(os.path.join(path, f"scaler2_{i}_{j}.pickle"))
            data[2][:, :, j, i] = np.array(sc.transform(data[2][:, :, j, i]))

    for i in range(data[3].shape[-1]):
        sc = pickle_load(os.path.join(path, f"scaler3_{i}.pickle"))
        data[3][:, :, i] = np.array(sc.transform(data[3][:, :, i]))

    for i in range(data[5].shape[-1]):
        for j in range(data[5].shape[-2]):
            sc = pickle_load(os.path.join(path, f"scaler_flag_{i}_{j}.pickle"))
            data[5][:, :, j, i] = np.array(sc.transform(data[5][:, :, j, i]))

    return data


def load_model(data: List[np.ndarray]) -> ResNet:
    return ResNet(
        input_size=[
            data[0].shape[1],
            data[1].shape[1],
            data[2].shape[1],
            data[3].shape[1],
        ],
        classes=1,
    ).to(device)


def predict_and_explain(
    data: List[np.ndarray], result_dir: str, thresholds: np.ndarray
):
    seed_everything(42)

    data = scale_data(data, result_dir)
    model = load_model(data)

    test_dataset = AKIDataset(data, thresholds)
    test_loader = DataLoader(
        dataset=test_dataset, batch_size=512, shuffle=False, num_workers=4
    )

    print("Evaluating...")
    logits, preds, explanations = predict(device, model, result_dir, test_loader)
    # logits, preds, explanations = lrp(device, model, result_dir, test_loader)
    return logits, preds, explanations
