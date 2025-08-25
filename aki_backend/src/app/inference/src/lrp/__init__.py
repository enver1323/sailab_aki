import torch.nn.functional as F
from multiprocessing.sharedctypes import Value
import torch
import torch.nn as nn
from torch.autograd import Variable
from .modules import *
from .modules.attn import AttnLrp
import math


LookUpTable = {
    "Input": InputLrp,
    "Linear": LinearLrp,
    "ReLU": ReluLrp,
    "Tanh": TanhLrp,
    "Conv2d": Conv2dLrp,
    "MaxPool2d": MaxPoolLrp,  # treat Max pool as Avg Pooling
    "AvgPool2d": AvgPoolLrp,
    "AdaptiveAvgPool2d": AdaptiveAvgPoolLrp,
    # "Flatten":FlattenLrp,
    # "BatchNorm2d" : BatchNorm2dLrp,
    "Dropout": DropoutLrp,
}


def scaled_dot_product_attention(
    query, key, value, attn_mask=None, dropout_p=0.0, is_causal=False, scale=None
) -> torch.Tensor:
    device = query.device
    L, S = query.size(-2), key.size(-2)
    scale_factor = 1 / math.sqrt(query.size(-1)) if scale is None else scale
    attn_bias = torch.zeros(L, S, dtype=query.dtype).to(device)
    if is_causal:
        assert attn_mask is None
        temp_mask = torch.ones(L, S, dtype=torch.bool).tril(diagonal=0).to(device)
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
    return attn_weight @ value, attn_weight


class LRP:
    def __init__(
        self,
        layers,
        rule_descriptions,
        skip_layers,
        skip_rules,
        device,
        mean=None,
        std=None,
    ):
        super().__init__()
        self.device = device

        self.rule_description = rule_descriptions
        self.original_layers = layers

        self.skip_layers = skip_layers
        self.skip_rules = skip_rules

        self.mean = mean
        self.std = std
        self.kernel_sizes = [(1, 2), (1, 1), (1, 1)]
        self.kernel_sizes2 = [(2, 2), (1, 1), (1, 1)]
        self.routings = 3
        self.lrp_modules, self.skip_modules = self.construct_lrp_modules(
            self.original_layers,
            self.rule_description,
            self.skip_layers,
            self.skip_rules,
            device,
        )

        assert len(layers) == len(rule_descriptions)

    def forward(
        self, x_drug, x_info, x_ts, x_ts2, x_ts_flag, y=None, class_specific=True
    ):
        # store activations
        cnt = 0
        binary_activations = []
        ts_activations = []
        decoder_activations = []
        attn_activations = []
        skip_activations = []

        acti_drug = [torch.ones_like(x_drug)]
        acti_info = [torch.ones_like(x_info)]
        acti_ts = [torch.ones_like(x_ts)]
        acti_ts2 = [torch.ones_like(x_ts2)]

        acti_ts_ratio = [torch.ones_like(x_ts_flag[:, :, :3, :])]
        acti_ts_flag = [torch.ones_like(x_ts_flag[:, :, :6, :])]
        acti_ts_grad = [torch.ones_like(x_ts_flag[:, :, :3, :])]

        final_attn_acti = []
        ts_attn_acti = []
        flag1_attn_acti = []
        flag2_attn_acti = []
        ratio_attn_acti = []
        grad_attn_acti = []
        binary_attn_acti = []

        j = 14
        for i, layer in enumerate(self.original_layers):
            try:
                if i < 5:
                    if i == 0:
                        a1 = layer(x_drug.unsqueeze(2))
                        acti_drug.append(a1)
                    elif i == 4:
                        a1 = layer(a1)
                        a1_s = self.skip_layers[0](x_drug.unsqueeze(2))
                        a1 = self.skip_layers[1](a1 + a1_s)
                        skip_activations.append(a1_s)
                        acti_drug.append(a1)
                    else:
                        a1 = layer(a1)
                        acti_drug.append(a1)
                elif 4 < i and i < 10:
                    if i == 5:
                        a2 = layer(x_info.unsqueeze(1).unsqueeze(2))
                        acti_info.append(a2)
                    elif i == 9:
                        a2 = layer(a2)
                        a2_s = self.skip_layers[2](x_info.unsqueeze(1).unsqueeze(2))
                        skip_activations.append(a2_s)
                        a2 = self.skip_layers[3](a2 + a2_s)
                        acti_info.append(a2)
                    else:
                        a2 = layer(a2)
                        acti_info.append(a2)
                elif 9 < i and i < 15:
                    if i == 10:
                        a3 = layer(x_ts2.unsqueeze(2))
                        acti_ts2.append(a3)
                    elif i == 14:
                        a3 = layer(a3)
                        a3_s = self.skip_layers[4](x_ts2.unsqueeze(2))
                        a3 = self.skip_layers[5](a3 + a3_s)
                        skip_activations.append(a3_s)
                        acti_ts2.append(a3)
                    else:
                        a3 = layer(a3)
                        acti_ts2.append(a3)
                elif 14 < i and i < 20:
                    if i == 15:
                        a4 = layer(x_ts_flag[:, :, 6:9, :])
                        acti_ts_ratio.append(a4)
                    elif i == 19:
                        a4 = layer(a4)
                        a4_s = self.skip_layers[6](x_ts_flag[:, :, 6:9, :])
                        a4 = self.skip_layers[7](a4 + a4_s)
                        skip_activations.append(a4_s)
                        acti_ts_ratio.append(a4)
                    else:
                        a4 = layer(a4)
                        acti_ts_ratio.append(a4)
                elif 19 < i and i < 25:
                    if i == 20:
                        a5 = layer(x_ts)
                        acti_ts.append(a5)
                    elif i == 24:
                        a5 = layer(a5)
                        a5_s = self.skip_layers[8](x_ts)
                        a5 = self.skip_layers[9](a5 + a5_s)
                        skip_activations.append(a5_s)
                        acti_ts.append(a5)
                    else:
                        a5 = layer(a5)
                        acti_ts.append(a5)
                elif 24 < i and i < 30:
                    if i == 25:
                        a6 = layer(x_ts_flag[:, :, :6, :])
                        acti_ts_flag.append(a6)
                    elif i == 29:
                        a6 = layer(a6)
                        a6_s = self.skip_layers[10](x_ts_flag[:, :, :6, :])
                        a6 = self.skip_layers[11](a6 + a6_s)
                        skip_activations.append(a6_s)
                        acti_ts_flag.append(a6)
                    else:
                        a6 = layer(a6)
                        acti_ts_flag.append(a6)
                elif 29 < i and i < 35:
                    if i == 30:
                        a7 = layer(x_ts_flag[:, :, 9:, :])
                        acti_ts_grad.append(a7)
                    elif i == 34:
                        a7 = layer(a7)
                        a7_s = self.skip_layers[12](x_ts_flag[:, :, 9:, :])
                        a7 = self.skip_layers[13](a7 + a7_s)
                        skip_activations.append(a7_s)
                        acti_ts_grad.append(a7)

                        a_binary = torch.cat((a1, a2, a3), dim=-1)
                        binary_attn_acti.append(a_binary)  # Q
                        binary_attn_acti.append(a_binary)  # K
                        a_binary, attn_weight = scaled_dot_product_attention(
                            a_binary, a_binary, a_binary
                        )
                        binary_attn_acti.append(a_binary)  # V
                        attn_activations.append(attn_weight)  # attn

                        ts_attn_acti.append(a5)  # Q
                        ts_attn_acti.append(a5)  # K
                        a_ts, attn_weight = scaled_dot_product_attention(a5, a5, a5)
                        ts_attn_acti.append(a_ts)  # V
                        attn_activations.append(attn_weight)

                        flag1_attn_acti.append(a5)
                        flag1_attn_acti.append(a6[:, :, :3, :])
                        a_flag1, attn_weight = scaled_dot_product_attention(
                            a5, a6[:, :, :3, :], a5
                        )
                        flag1_attn_acti.append(a_flag1)
                        attn_activations.append(attn_weight)

                        flag2_attn_acti.append(a5)
                        flag2_attn_acti.append(a6[:, :, 3:6, :])
                        a_flag2, attn_weight = scaled_dot_product_attention(
                            a5, a6[:, :, 3:6, :], a5
                        )
                        flag2_attn_acti.append(a_flag2)
                        attn_activations.append(attn_weight)

                        ratio_attn_acti.append(a5)
                        ratio_attn_acti.append(a4)
                        a_flag3, attn_weight = scaled_dot_product_attention(a5, a4, a5)
                        ratio_attn_acti.append(a_flag3)
                        attn_activations.append(attn_weight)

                        grad_attn_acti.append(a5)
                        grad_attn_acti.append(a7)
                        a_flag4, attn_weight = scaled_dot_product_attention(a5, a7, a5)
                        grad_attn_acti.append(a_flag4)
                        attn_activations.append(attn_weight)

                        a_ts = torch.cat(
                            (a_ts, a_flag3, a_flag4, a_flag1, a_flag2), dim=-1
                        )
                        ts_activations.append(a_ts)

                    else:
                        a7 = layer(a7)
                        acti_ts_grad.append(a7)

                elif 34 < i and i < 50:
                    if i == 35 or i == 40 or i == 45:
                        a_binary = F.pad(
                            a_binary,
                            (int(self.kernel_sizes[0][1] // 2), 0),
                            "constant",
                            0,
                        )
                    a_binary = layer(a_binary)
                    if i == 39 or i == 44 or i == 49:
                        a_s = self.skip_layers[j](a_binary)
                        a = self.skip_layers[j + 1](a_binary + a_s)
                        binary_activations.append(a_binary)
                        skip_activations.append(a_s)
                        j += 2
                    else:
                        binary_activations.append(a_binary)

                elif 49 < i and i < 65:
                    if i == 50 or i == 55 or i == 60:
                        a_ts = F.pad(
                            a_ts, (int(self.kernel_sizes2[0][1] // 2), 0), "constant", 0
                        )
                        a_ts = F.pad(
                            a_ts.permute(0, 1, 3, 2),
                            (int(self.kernel_sizes2[0][1] // 2), 0),
                            "constant",
                            0,
                        ).permute(0, 1, 3, 2)
                    a_ts = layer(a_ts)
                    if i == 54 or i == 59 or i == 64:
                        a_s = self.skip_layers[j](a_ts)
                        a_ts = self.skip_layers[j + 1](a_ts + a_s)
                        skip_activations.append(a_s)
                        ts_activations.append(a_ts)
                        j += 2
                    else:
                        ts_activations.append(a_ts)
                elif i == 65:
                    a_binary = layer(a_binary)
                    binary_activations.append(a_binary)
                elif i == 66:
                    a_ts = layer(a_ts)
                    ts_activations.append(a_ts)

                    a = torch.cat([a_binary, a_ts], dim=-1)
                    final_attn_acti.append(a)  # Q
                    final_attn_acti.append(a)  # K
                    a, attn_weight = scaled_dot_product_attention(a, a, a)
                    final_attn_acti.append(a)  # V
                    attn_activations.append(attn_weight)
                    a = a.view(a.shape[0], -1)
                    decoder_activations.append(a)
                else:
                    a = layer(a)
                    decoder_activations.append(a)
            except Exception as e:
                print("Error:", layer)
                print("Error:", e)
                exit()

        decoder_activations = decoder_activations[::-1]
        ts_activations = ts_activations[::-1]
        binary_activations = binary_activations[::-1]
        attn_activations = attn_activations[::-1]
        skip_activations = skip_activations[::-1]

        acti_drug = acti_drug[::-1]
        acti_info = acti_info[::-1]
        acti_ts = acti_ts[::-1]
        acti_ts2 = acti_ts2[::-1]

        acti_ts_ratio = acti_ts_ratio[::-1]
        acti_ts_flag = acti_ts_flag[::-1]
        acti_ts_grad = acti_ts_grad[::-1]

        decoder_activations = [a.data.requires_grad_(True) for a in decoder_activations]
        ts_activations = [a.data.requires_grad_(True) for a in ts_activations]
        binary_activations = [a.data.requires_grad_(True) for a in binary_activations]
        attn_activations = [a.data.requires_grad_(True) for a in attn_activations]
        skip_activations = [a.data.requires_grad_(True) for a in skip_activations]

        acti_drug = [a.data.requires_grad_(True) for a in acti_drug]
        acti_info = [a.data.requires_grad_(True) for a in acti_info]
        acti_ts = [a.data.requires_grad_(True) for a in acti_ts]
        acti_ts2 = [a.data.requires_grad_(True) for a in acti_ts2]

        acti_ts_ratio = [a.data.requires_grad_(True) for a in acti_ts_ratio]
        acti_ts_flag = [a.data.requires_grad_(True) for a in acti_ts_flag]
        acti_ts_grad = [a.data.requires_grad_(True) for a in acti_ts_grad]

        # compute LRP
        prediction_outcome = decoder_activations.pop(0)
        score = torch.sigmoid(prediction_outcome)
        if class_specific:
            if y is None:
                class_index = score.argmax(axis=-1)
            else:
                class_index = y.int()
            class_score = (
                torch.FloatTensor(a.size(0), score.size()[-1]).zero_().to(self.device)
            )
            class_score[:, class_index] = score[:, class_index]
        else:
            class_score = score
        class_score = class_score.data.fill_(1.0 / class_score.shape[0])

        cnt = 0
        modules = []
        relevances = [class_score]
        for i, (Ai, module) in enumerate(
            zip(decoder_activations, self.lrp_modules[:3])
        ):
            Rj = relevances[-1]
            Ri = module.forward(Rj, Ai)
            relevances.append(Ri)

        a = Ai.reshape(Ai.shape[0], 64, 1, -1)
        relevances[-1] = relevances[-1].reshape(Ai.shape[0], 64, 1, -1)
        relevances[-1] = AttnLrp().lrp(
            relevances[-1],
            final_attn_acti[0],
            final_attn_acti[1],
            final_attn_acti[2],
            attn_activations[-1],
        )[-1]

        # Split the relevance tensor
        relevance_part1 = relevances[-1][:, :, :, :15]
        relevance_part2 = relevances[-1][:, :, :, 15:]

        Ri = relevance_part1
        relevance_ts = [Ri]
        Ri = self.lrp_modules[3].forward(relevance_ts[0], ts_activations[1])
        relevance_ts.append(Ri)

        j = 0
        cnt = 0
        for i, (Ai, module) in enumerate(
            zip(ts_activations[2:], self.lrp_modules[5:21])
        ):
            Rj = relevance_ts[-1]
            if i == 4 or i == 9 or i == 14:
                Ai_2 = torch.empty_like(Ai).copy_(Ai)
                Ai = F.pad(Ai, (int(self.kernel_sizes2[0][1] // 2), 0), "constant", 0)
                Ai = F.pad(
                    Ai.permute(0, 1, 3, 2),
                    (int(self.kernel_sizes2[0][1] // 2), 0),
                    "constant",
                    0,
                ).permute(0, 1, 3, 2)
                Ri = module.forward(Rj, Ai, Ai_2=Ai_2)
                relevance_ts.append(Ri[:, :, 1:, 1:] * 0.5 + Ri_s * 0.5)
            elif i == 0 or i == 5 or i == 10:
                Ri = module.forward(Rj, Ai)
                relevance_ts.append(Ri)
                Ri_s = self.skip_modules[j + 1].forward(Rj, skip_activations[cnt])
                j += 2
                cnt += 1
            else:
                Ri = module.forward(Rj, Ai)
                relevance_ts.append(Ri)

        Ri = relevance_ts[-1][:, :, :, 6 * 2 : 6 * 3]
        relevance_grad = [Ri]
        relevance_grad = [
            AttnLrp().lrp(
                relevance_grad[-1],
                grad_attn_acti[0],
                grad_attn_acti[1],
                grad_attn_acti[2],
                attn_activations[-2],
            )[-1]
        ]

        Ri = relevance_ts[-1][:, :, :, 6 * 3 : 6 * 4]
        relevance_flag1 = [Ri]
        relevance_flag1 = AttnLrp().lrp(
            relevance_flag1[-1],
            flag1_attn_acti[0],
            flag1_attn_acti[1],
            flag1_attn_acti[2],
            attn_activations[-5],
        )[-1]

        Ri = relevance_ts[-1][:, :, :, 6 * 4 :]
        relevance_flag2 = [Ri]
        relevance_flag2 = AttnLrp().lrp(
            relevance_flag2[-1],
            flag2_attn_acti[0],
            flag2_attn_acti[1],
            flag2_attn_acti[2],
            attn_activations[-4],
        )[-1]
        relevance_flag = [torch.cat([relevance_flag1, relevance_flag2], dim=2)]

        Ri = relevance_ts[-1][:, :, :, :6]
        relevance_ts_d = [Ri]
        relevance_ts_d = [
            AttnLrp().lrp(
                relevance_ts_d[-1],
                ts_attn_acti[0],
                ts_attn_acti[1],
                ts_attn_acti[2],
                attn_activations[-6],
            )[-1]
        ]

        Ri = relevance_ts[-1][:, :, :, 6 : 6 * 2]
        relevance_ratio = [Ri]
        relevance_ratio = [
            AttnLrp().lrp(
                relevance_ratio[-1],
                ratio_attn_acti[0],
                ratio_attn_acti[1],
                ratio_attn_acti[2],
                attn_activations[-3],
            )[-1]
        ]

        Ri = relevance_part2
        relevance_binary = [Ri]
        Ri = self.lrp_modules[4].forward(relevance_binary[0], binary_activations[1])
        relevance_binary.append(Ri)
        relevance_binary[-1] = AttnLrp().lrp(
            relevance_binary[-1],
            binary_attn_acti[0],
            binary_attn_acti[1],
            binary_attn_acti[2],
            attn_activations[-7],
        )[-1]

        for i, (Ai, module) in enumerate(
            zip(binary_activations[2:], self.lrp_modules[20:36])
        ):
            Rj = relevance_binary[-1]
            if i == 4 or i == 9 or i == 14:
                Ai_2 = torch.empty_like(Ai).copy_(Ai)
                Ai = F.pad(Ai, (int(self.kernel_sizes2[0][1] // 2), 0), "constant", 0)
                Ai = F.pad(
                    Ai.permute(0, 1, 3, 2),
                    (int(self.kernel_sizes2[0][1] // 2), 0),
                    "constant",
                    0,
                ).permute(0, 1, 3, 2)
                Ri = module.forward(Rj, Ai, Ai_2=Ai_2)
                relevance_binary.append(Ri[:, :, 1:, 1:] * 0.5 + Ri_s * 0.5)
            elif i == 0 or i == 5 or i == 10:
                Ri = module.forward(Rj, Ai)
                relevance_binary.append(Ri)
                Ri_s = self.skip_modules[j + 1].forward(Rj, skip_activations[cnt])
                j += 2
                cnt += 1
            else:
                Ri = module.forward(Rj, Ai)
                relevance_binary.append(Ri)

        for i, (Ai, module) in enumerate(
            zip(acti_ts_grad[1:], self.lrp_modules[35:40])
        ):
            Rj = relevance_grad[-1]
            if i == 4:
                Ri = module.forward(Rj, Ai)
                relevance_grad.append(Ri * 0.5 + Ri_s * 0.5)
            elif i == 0:
                Ri = module.forward(Rj, Ai)
                relevance_grad.append(Ri)
                Ri_s = self.skip_modules[j + 1].forward(Rj, acti_ts_grad[-1])
                j += 2
                cnt += 1
            else:
                Ri = module.forward(Rj, Ai)
                relevance_grad.append(Ri)

        for i, (Ai, module) in enumerate(
            zip(acti_ts_flag[1:], self.lrp_modules[40:45])
        ):
            Rj = relevance_flag[-1]
            if i == 4:
                Ri = module.forward(Rj, Ai)
                relevance_flag.append(Ri * 0.5 + Ri_s * 0.5)
            elif i == 0:
                Ri = module.forward(Rj, Ai)
                relevance_flag.append(Ri)
                Ri_s = self.skip_modules[j + 1].forward(Rj, acti_ts_flag[-1])
                j += 2
                cnt += 1
            else:
                Ri = module.forward(Rj, Ai)
                relevance_flag.append(Ri)

        for i, (Ai, module) in enumerate(zip(acti_ts[1:], self.lrp_modules[45:50])):
            Rj = relevance_ts_d[-1]
            if i == 4:
                Ri = module.forward(Rj, Ai)
                relevance_ts_d.append(Ri * 0.5 + Ri_s * 0.5)
            elif i == 0:
                Ri = module.forward(Rj, Ai)
                relevance_ts_d.append(Ri)
                Ri_s = self.skip_modules[j + 1].forward(Rj, acti_ts[-1])
                j += 2
                cnt += 1
            else:
                Ri = module.forward(Rj, Ai)
                relevance_ts_d.append(Ri)

        for i, (Ai, module) in enumerate(
            zip(acti_ts_ratio[1:], self.lrp_modules[50:55])
        ):
            Rj = relevance_ratio[-1]
            if i == 4:
                Ri = module.forward(Rj, Ai)
                relevance_ratio.append(Ri * 0.5 + Ri_s * 0.5)
            elif i == 0:
                Ri = module.forward(Rj, Ai)
                relevance_ratio.append(Ri)
                Ri_s = self.skip_modules[j + 1].forward(Rj, acti_ts_ratio[-1])
                j += 2
                cnt += 1
            else:
                Ri = module.forward(Rj, Ai)
                relevance_ratio.append(Ri)

        Ri = relevance_binary[-1][:, :, :, -6:]
        relevance_AKI = [Ri]
        for i, (Ai, module) in enumerate(zip(acti_ts2[1:], self.lrp_modules[55:60])):
            Rj = relevance_AKI[-1]
            if i == 4:
                Ri = module.forward(Rj, Ai.unsqueeze(2))
                relevance_AKI.append(Ri * 0.5 + Ri_s * 0.5)
            elif i == 0:
                Ri = module.forward(Rj, Ai)
                relevance_AKI.append(Ri)
                Ri_s = self.skip_modules[j + 1].forward(Rj, acti_ts2[-1].unsqueeze(2))
                j += 2
                cnt += 1
            else:
                Ri = module.forward(Rj, Ai)
                relevance_AKI.append(Ri)

        Ri = relevance_binary[-1][:, :, :, 6:-6]
        relevance_info = [Ri]
        for i, (Ai, module) in enumerate(zip(acti_info[1:], self.lrp_modules[60:65])):
            Rj = relevance_info[-1]
            if i == 4:
                Ri = module.forward(Rj, Ai.unsqueeze(1).unsqueeze(2))
                relevance_info.append(Ri * 0.5 + Ri_s * 0.5)
            elif i == 0:
                Ri = module.forward(Rj, Ai)
                relevance_info.append(Ri)
                Ri_s = self.skip_modules[j + 1].forward(
                    Rj, acti_info[-1].unsqueeze(1).unsqueeze(2)
                )
                j += 2
                cnt += 1
            else:
                Ri = module.forward(Rj, Ai)
                relevance_info.append(Ri)

        Ri = relevance_binary[-1][:, :, :, :6]
        relevance_drug = [Ri]
        for i, (Ai, module) in enumerate(zip(acti_drug[1:], self.lrp_modules[65:70])):
            Rj = relevance_drug[-1]
            if i == 4:
                Ri = module.forward(Rj, Ai.unsqueeze(2))
                relevance_drug.append(Ri * 0.5 + Ri_s * 0.5)
            elif i == 0:
                Ri = module.forward(Rj, Ai)
                relevance_drug.append(Ri)
                Ri_s = self.skip_modules[j + 1].forward(Rj, acti_drug[-1].unsqueeze(2))
                j += 2
                cnt += 1
            else:
                Ri = module.forward(Rj, Ai)
                relevance_drug.append(Ri)

        output = {
            "R_drug": relevance_drug[-1],
            "R_info": relevance_info[-1],
            "R_ts": relevance_ts_d[-1],
            "R_aki": relevance_AKI[-1],
            "R_flag": relevance_flag[-1],
            "R_ratio": relevance_ratio[-1],
        }

        return output

    def construct_lrp_modules(
        self, original_layers, rule_descriptions, skip_layers, skip_rules, device
    ):
        used_names = []
        modules = []
        skip_modules = []

        j = 0
        for i, layer in enumerate(original_layers):
            rule = rule_descriptions[i]
            for k in rule:
                if k not in ["epsilon", "gamma", "z_plus"]:
                    raise ValueError(f"Invalid LRP rule {k}")

            name = layer.__class__.__name__
            assert name in LookUpTable, f"{name} is not in the LookupTable "
            lrp_module = LookUpTable[name](layer, rule)
            lrp_module.layer.to(device)
            modules.append(lrp_module)
            used_names.append(name)

            if (
                i == 4
                or i == 9
                or i == 14
                or i == 19
                or i == 24
                or i == 29
                or i == 34
                or i == 39
                or i == 44
                or i == 49
                or i == 54
                or i == 59
                or i == 64
            ):
                layer = skip_layers[j]
                rule = skip_rules[j]
                name = layer.__class__.__name__
                lrp_module = LookUpTable[name](layer, rule)
                lrp_module.layer.to(device)
                skip_modules.append(lrp_module)

                layer = skip_layers[j + 1]
                rule = skip_rules[j + 1]
                name = layer.__class__.__name__
                lrp_module = LookUpTable[name](layer, rule)
                lrp_module.layer.to(device)
                skip_modules.append(lrp_module)
                # used_names.append(name)
                j += 2

        self.kind_warning(used_names)
        return modules[::-1], skip_modules[::-1]

    def kind_warning(self, used_names):
        if "ReLU" not in used_names:
            print(
                f"[Kind Warning] : ReLU is not in the layers. You should manually add activations."
            )
            print(
                f"[Kind Warning] : Are you sure your model structure excludes ReLU : <{used_names}>?"
            )


import numpy as np
from matplotlib.colors import ListedColormap
import matplotlib.pyplot as plt


def process_lrp_before_imshow(R):
    power = 1.0
    b = 10 * ((np.abs(R) ** power).mean() ** (1.0 / power))

    my_cmap = plt.cm.seismic(np.arange(plt.cm.seismic.N))
    my_cmap[:, 0:3] *= 0.85
    my_cmap = ListedColormap(my_cmap)
    return (R, {"cmap": my_cmap, "vmin": -b, "vmax": b, "interpolation": "nearest"})
