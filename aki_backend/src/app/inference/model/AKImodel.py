import os
from typing import Tuple
import numpy as np
import pandas as pd
import math

import torch
from torch import nn
import torch.nn.functional as F
from torch.utils.data import Dataset

from app.inference.src.lrp_for_model import construct_lrp
from app.inference.utils.columns import (
    drug_name,
    ts_name,
    dy_others,
    others,
)

import warnings

warnings.filterwarnings(action="ignore")


class AKIDataset(Dataset):
    def __init__(self, data, thresholds):
        for d in data:
            print("Nan check: ", np.isnan(d.astype(float)).sum())

        self.x_drug = torch.Tensor(data[0].astype(float))
        self.x_info = torch.Tensor(data[1].astype(float))
        self.x_ts = torch.Tensor(data[2].astype(float))
        self.x_ts2 = torch.Tensor(data[3].astype(float))

        self.x_ts_flag = torch.Tensor(data[5].astype(float))
        self.thresholds = thresholds

        print(
            "X shape: ",
            self.x_drug.shape,
            self.x_info.shape,
            self.x_ts.shape,
            self.x_ts2.shape,
            self.x_ts_flag.shape,
        )

    def __len__(self):
        return len(self.x_drug)

    def __getitem__(self, idx):
        return {
            'drug': self.x_drug[idx],
            'info': self.x_info[idx],
            'timeseries': self.x_ts[idx],
            'dynamic2': self.x_ts2[idx],
            'flag': self.x_ts_flag[idx],
            'labels': 0,
            'thresholds': self.thresholds[idx],
        }


def scaled_dot_product_attention(
        query, key, value, attn_mask=None, dropout_p=0.0, is_causal=False, scale=None
) -> torch.Tensor:
    L, S = query.size(-2), key.size(-2)
    scale_factor = 1 / math.sqrt(query.size(-1)) if scale is None else scale
    attn_bias = torch.zeros(L, S, dtype=query.dtype, device=query.device)
    if is_causal:
        assert attn_mask is None
        temp_mask = torch.ones(L, S, dtype=torch.bool).tril(diagonal=0).to(query.device)
        attn_bias.masked_fill_(temp_mask.logical_not(), float("-inf"))
        attn_bias.to(query.dtype)

    if attn_mask is not None:
        if attn_mask.dtype == torch.bool:
            attn_bias.masked_fill_(attn_mask.logical_not(), float("-inf"))
        else:
            attn_bias += attn_mask
    attn_weight = query @ key.transpose(-2, -1) * scale_factor
    attn_weight += attn_bias
    attn_weight = torch.softmax(attn_weight, dim=-1)
    attn_weight = torch.dropout(attn_weight, dropout_p, train=True)
    return attn_weight @ value


class ResBlock(nn.Module):
    def __init__(
            self,
            input_size,
            kernel_size=[(1, 2), (1, 1), (1, 1)],
            hidden_size=[64, 128, 64],
    ):
        super(ResBlock, self).__init__()
        self.init_h = input_size
        self.kernel_sizes = kernel_size
        self.hidden_sizes = [self.init_h, self.init_h * 2, self.init_h]
        self.conv1 = nn.Conv2d(
            in_channels=self.init_h,
            out_channels=self.hidden_sizes[0],
            kernel_size=kernel_size[0],
        )

        self.conv2 = nn.Conv2d(
            in_channels=self.hidden_sizes[0],
            out_channels=self.hidden_sizes[1],
            kernel_size=kernel_size[1],
        )

        self.conv3 = nn.Conv2d(
            in_channels=self.hidden_sizes[1],
            out_channels=self.hidden_sizes[2],
            kernel_size=kernel_size[2],
        )

        self.conv_skip1 = nn.Conv2d(
            in_channels=self.init_h,
            out_channels=self.hidden_sizes[2],
            kernel_size=(1, 1),
        )

        self.relu = nn.ReLU()

    def forward(self, x):
        h = x
        if self.kernel_sizes[0][1] == 2 and self.kernel_sizes[0][0] == 2:
            h = F.pad(h, (int(self.kernel_sizes[0][1] // 2), 0), "constant", 0)
            h = F.pad(
                h.permute(0, 1, 3, 2),
                (int(self.kernel_sizes[0][1] // 2), 0),
                "constant",
                0,
            ).permute(0, 1, 3, 2)
        else:
            h = F.pad(h, (int(self.kernel_sizes[0][1] // 2), 0), "constant", 0)
        h = self.relu((self.conv1(h)))
        h = self.relu((self.conv2(h)))
        h = self.conv3(h)
        s = self.conv_skip1(x)
        h = h + s
        h = self.relu(h)

        return h


class ResNet(nn.Module):
    def __init__(
            self,
            input_size,
            classes,
            hidden_sizes=[256, 512, 256],
            kernel_sizes=[2, 1, 1],
            is_light: bool = False,
    ):
        super(ResNet, self).__init__()
        self.hidden_sizes = hidden_sizes
        self.kernel_sizes = kernel_sizes
        self.init_h = 64  # 64 / 32
        hidden_sizes = [self.init_h, self.init_h * 2, self.init_h]

        self.lin1_drug = nn.Sequential(
            nn.Conv2d(input_size[0], self.init_h // 2, 1),
            nn.ReLU(),
            nn.Conv2d(self.init_h // 2, self.init_h, 1),
            nn.ReLU(),
            nn.Conv2d(self.init_h, self.init_h, 1),
        )
        self.lin1_drug_skip = nn.Conv2d(input_size[0], self.init_h, 1)

        self.lin1_info = nn.Sequential(
            nn.Conv2d(1, self.init_h // 2, 1),
            nn.ReLU(),
            nn.Conv2d(self.init_h // 2, self.init_h, 1),
            nn.ReLU(),
            nn.Conv2d(self.init_h, self.init_h, 1),
        )
        self.lin1_info_skip = nn.Conv2d(1, self.init_h, 1)

        self.lin1_d = nn.Sequential(
            nn.Conv2d(input_size[3], self.init_h // 2, 1),
            nn.Tanh(),
            nn.Conv2d(self.init_h // 2, self.init_h, 1),
            nn.Tanh(),
            nn.Conv2d(self.init_h, self.init_h, 1),
        )
        self.lin1_d_skip = nn.Conv2d(input_size[3], self.init_h, 1)

        self.lin1_d_ratio = nn.Sequential(
            nn.Conv2d(input_size[2], self.init_h // 2, 1),
            nn.Tanh(),
            nn.Conv2d(self.init_h // 2, self.init_h, 1),
            nn.Tanh(),
            nn.Conv2d(self.init_h, self.init_h, 1),
        )
        self.lin1_d_ratio_skip = nn.Conv2d(input_size[2], self.init_h, 1)

        self.lin1_d_mma = nn.Sequential(
            nn.Conv2d(input_size[2], self.init_h // 2, 1),
            nn.Tanh(),
            nn.Conv2d(self.init_h // 2, self.init_h, 1),
            nn.Tanh(),
            nn.Conv2d(self.init_h, self.init_h, 1),
        )
        self.lin1_d_mma_skip = nn.Conv2d(input_size[2], self.init_h, 1)

        self.lin1_d_flag = nn.Sequential(
            nn.Conv2d(input_size[2], self.init_h // 2, 1),
            nn.ReLU(),
            nn.Conv2d(self.init_h // 2, self.init_h, 1),
            nn.ReLU(),
            nn.Conv2d(self.init_h, self.init_h, 1),
        )
        self.lin1_d_flag_skip = nn.Conv2d(input_size[2], self.init_h, 1)

        self.lin1_d_grad = nn.Sequential(
            nn.Conv2d(input_size[2], self.init_h // 2, 1),
            nn.Tanh(),
            nn.Conv2d(self.init_h // 2, self.init_h, 1),
            nn.ReLU(),
            nn.Conv2d(self.init_h, self.init_h, 1),
        )
        self.lin1_d_grad_skip = nn.Conv2d(input_size[2], self.init_h, 1)

        self.res1 = ResBlock(self.init_h)
        self.res2 = ResBlock(self.init_h)
        self.res3 = ResBlock(self.init_h)

        h = 44
        k = 2
        self.num = 3
        if is_light:
            h = 33
            k = 1
            self.num = 1

        self.res1_2 = ResBlock(self.init_h, [(k, 2), (1, 1), (1, 1)])
        self.res2_2 = ResBlock(self.init_h, [(k, 2), (1, 1), (1, 1)])
        self.res3_2 = ResBlock(self.init_h, [(k, 2), (1, 1), (1, 1)])

        self.res1_deep = ResBlock(self.init_h)
        self.res2_deep = ResBlock(self.init_h)
        self.res3_deep = ResBlock(self.init_h)

        self.tanh = nn.Tanh()
        self.relu = nn.ReLU()
        self.GAP = nn.AvgPool2d((1, 2))
        self.GAP2 = nn.AvgPool2d((k, 2))

        self.decoder = nn.Sequential(
            nn.Linear((h) * hidden_sizes[2], 512),
            nn.ReLU(inplace=True),
            nn.Linear(512, 1),
        )  # 48
        self.decoder_reg = nn.Sequential(
            nn.Linear((h) * hidden_sizes[2], 512),
            nn.Tanh(),
            nn.Linear(512, 6),
        )

    def forward(self, x_drug, x_info, x_ts, x_ts2, x_ts_flag):
        x_drug_ = self.lin1_drug(x_drug.unsqueeze(2))
        x_drug = self.relu(x_drug_ + self.lin1_drug_skip(x_drug.unsqueeze(2)))

        x_info_ = self.lin1_info(x_info.unsqueeze(1).unsqueeze(2))
        x_info = self.relu(
            x_info_ + self.lin1_info_skip(x_info.unsqueeze(1).unsqueeze(2))
        )

        x_ts2_ = self.lin1_d(x_ts2.unsqueeze(2))
        x_ts2 = self.tanh(x_ts2_ + self.lin1_d_skip(x_ts2.unsqueeze(2)))

        x_ts_ = self.lin1_d_mma(x_ts)
        x_ts_origin = self.tanh(x_ts_ + self.lin1_d_mma_skip(x_ts))

        x_ts_flag_ = self.lin1_d_flag(x_ts_flag[:, :, : 2 * self.num, :])
        x_ts_flag_origin = self.relu(
            x_ts_flag_ + self.lin1_d_flag_skip(x_ts_flag[:, :, : 2 * self.num, :])
        )

        x_ts_ratio_ = self.lin1_d_ratio(x_ts_flag[:, :, 2 * self.num: 3 * self.num, :])
        x_ts_ratio = self.tanh(
            x_ts_ratio_
            + self.lin1_d_ratio_skip(x_ts_flag[:, :, 2 * self.num: 3 * self.num, :])
        )

        x_ts_grad_ = self.lin1_d_grad(x_ts_flag[:, :, 3 * self.num:, :])
        x_ts_grad = self.relu(
            x_ts_grad_ + self.lin1_d_grad_skip(x_ts_flag[:, :, 3 * self.num:, :])
        )

        x = torch.cat((x_drug, x_info, x_ts2), dim=-1)
        x = scaled_dot_product_attention(x, x, x)
        x_ts = scaled_dot_product_attention(x_ts_origin, x_ts_origin, x_ts_origin)

        x_ts_flag1 = scaled_dot_product_attention(
            x_ts_origin, x_ts_flag_origin[:, :, : 1 * self.num, :], x_ts_origin
        )
        x_ts_flag2 = scaled_dot_product_attention(
            x_ts_origin,
            x_ts_flag_origin[:, :, 1 * self.num: 2 * self.num, :],
            x_ts_origin,
        )
        x_ts_flag3 = scaled_dot_product_attention(
            x_ts_origin, x_ts_ratio[:, :, : 1 * self.num, :], x_ts_origin
        )

        x_ts_flag4 = scaled_dot_product_attention(x_ts_origin, x_ts_grad, x_ts_origin)
        x_ts = torch.cat((x_ts, x_ts_flag3, x_ts_flag4, x_ts_flag1, x_ts_flag2), dim=-1)

        h = self.GAP(self.res3(self.res2(self.res1(x))))
        h2 = self.GAP2(self.res3_2(self.res2_2(self.res1_2(x_ts))))

        h = torch.cat((h, h2), dim=-1)
        h = scaled_dot_product_attention(h, h, h)

        out = self.decoder(h.view(h.shape[0], -1))
        reg = self.decoder_reg(h.view(h.shape[0], -1))

        return out, reg


def get_daily_columns(columns: list) -> list:
    return [
        type_ + s
        for s in columns
        for type_ in ["d1_1_", "d1_2_", "d1_3_", "d2_1_", "d2_2_", "d2_3_"]
    ]

def lrp(device, model, result_folder, test_loader):
    checkpoint = torch.load(
        os.path.join(result_folder, f"CNN-best-aki.pt"), map_location=device
    )
    model.load_state_dict(checkpoint["model_state_dict"])
    model = model.eval()

    lrp_model = construct_lrp(model, device)

    def compute_lrp(
            lrp_model, x_drug, x_info, x_ts, x_ts2, x_ts_flag, y, class_specific
    ):
        output = lrp_model.forward(x_drug, x_info, x_ts, x_ts2, x_ts_flag, y, False)
        drug_relevnace = output["R_drug"]
        info_relevance = output["R_info"]
        ts_relevance = output["R_ts"]
        aki_relevance = output["R_aki"]

        flag_relevance = output["R_flag"]
        ratio_relevance = output["R_ratio"]
        return (
            drug_relevnace,
            info_relevance,
            ts_relevance,
            aki_relevance,
            flag_relevance,
            ratio_relevance,
        )

    lrp_list1 = []
    lrp_list2 = []
    lrp_list3 = []
    lrp_list4 = []

    lrp_list5 = []
    lrp_list6 = []
    answers = []
    predictions = []
    logits = []
    for i, batch in enumerate(test_loader):
        drug, info, ts, ts2, flag, labels, thresholds = (
            batch["drug"].to(device),
            batch["info"].to(device),
            batch["timeseries"].to(device),
            batch["dynamic2"].to(device),
            batch["flag"].to(device),
            batch["labels"].to(device),
            batch["thresholds"].to(device),
        )
        answers.extend(labels[:, 0].detach().cpu().numpy())

        outputs = model(drug, info, ts, ts2, flag)

        answers.extend(labels[:, 0].detach().cpu().numpy())

        cur_logits = torch.sigmoid(outputs[0])
        logits.extend(cur_logits.detach().cpu().numpy())

        preds_tmp = []
        preds_tmp.extend((cur_logits > thresholds[..., None]).detach().cpu().numpy())
        predictions.extend(preds_tmp)

        lrp1, lrp2, lrp3, lrp4, lrp5, lrp6 = compute_lrp(
            lrp_model, drug, info, ts, ts2, flag, labels, class_specific=False
        )  # [::-1]

        lrp_list1.extend(lrp1.squeeze(-2).detach().cpu())
        lrp_list2.extend(lrp2.squeeze((-2, -3)).detach().cpu())
        lrp_list3.extend(lrp3.detach().cpu())
        lrp_list4.extend(lrp4.squeeze(-2).detach().cpu())
        lrp_list5.extend(lrp5.detach().cpu())
        lrp_list6.extend(lrp6.detach().cpu())

    logits = np.array(logits)
    predictions = np.array(predictions)

    lrp_list1 = abs(np.array(lrp_list1)).transpose(1, 2, 0)
    attributions_list = np.vstack(lrp_list1).T

    drug_name_ = get_daily_columns(drug_name)
    drug_df = pd.DataFrame(attributions_list, columns=drug_name_)

    lrp_list2 = abs(np.array(lrp_list2))
    p_info_df = pd.DataFrame(lrp_list2, columns=others)

    lrp_list3 = abs(np.array(lrp_list3))[:, :, 0, :].transpose(1, 2, 0)
    attributions_list = np.vstack(lrp_list3).T
    ts_name_ = get_daily_columns(ts_name)
    ts_df = pd.DataFrame(attributions_list, columns=ts_name_)

    lrp_list4 = abs(np.array(lrp_list4)).transpose(1, 2, 0)
    attributions_list = np.vstack(lrp_list4).T
    dyothers_name_ = get_daily_columns(dy_others)
    ts2_df = pd.DataFrame(attributions_list, columns=dyothers_name_)

    attributions = pd.concat((drug_df, p_info_df, ts2_df, ts_df), axis=1)
    return logits, predictions, attributions


def predict(device, model, result_folder, test_loader) -> Tuple[np.ndarray, np.ndarray, pd.DataFrame]:
    checkpoint = torch.load(
        os.path.join(result_folder, f"CNN-best-aki.pt"), map_location=device
    )
    model.load_state_dict(checkpoint["model_state_dict"])
    model = model.eval()

    predictions = []
    logits = []
    for i, batch in enumerate(test_loader):
        drug, info, ts, ts2, flag, labels, thresholds = (
            batch["drug"].to(device),
            batch["info"].to(device),
            batch["timeseries"].to(device),
            batch["dynamic2"].to(device),
            batch["flag"].to(device),
            batch["labels"].to(device),
            batch["thresholds"].to(device),
        )

        outputs = model(drug, info, ts, ts2, flag)

        cur_logits = torch.sigmoid(outputs[0])
        logits.extend(cur_logits.detach().cpu().numpy())

        preds_tmp = []
        preds_tmp.extend((cur_logits > thresholds[..., None]).detach().cpu().numpy())
        predictions.extend(preds_tmp)

    logits = np.array(logits)
    predictions = np.array(predictions)

    all_exp_columns = get_daily_columns(drug_name) + others + get_daily_columns(ts_name) + get_daily_columns(dy_others)
    attributions = np.empty((len(predictions), len(all_exp_columns)), dtype=float)
    attributions.fill(np.nan)
    explanations = pd.DataFrame(attributions, columns=all_exp_columns)

    return logits, predictions, explanations
