# import torch.nn.functional as F
import torch.nn as nn
import torch
import numpy as np
from app.inference.src.lrp import LRP


def construct_lrp(model: nn.Module, device: torch.device):
    mean = [0.485, 0.456, 0.406]
    std = [0.229, 0.224, 0.225]
    mean = torch.FloatTensor(mean).reshape(1, -1, 1, 1).to(device)
    std = torch.FloatTensor(std).reshape(1, -1, 1, 1).to(device)

    model.to(device)
    layers, rules, skip_layers, skip_rules = construct_lrp_layers_and_rules_for_CNN(
        model
    )

    lrp_model = LRP(
        layers, rules, skip_layers, skip_rules, device=device, mean=None, std=None
    )
    return lrp_model


def construct_lrp_layers_and_rules_for_CNN(model):
    layers = []
    skip_layers = []
    rules = []
    skip_rules = []
    # Rule is z_plus

    # drug input linear
    layers.append(model.lin1_drug[0])  # conv #0
    rules.append({"z_plus": True, "epsilon": 2.5e-7})
    layers.append(model.lin1_drug[1])  # relu #1
    rules.append({"z_plus": True, "epsilon": 2.5e-7})
    layers.append(model.lin1_drug[2])  # conv #2
    rules.append({"z_plus": True, "epsilon": 2.5e-7})
    layers.append(model.lin1_drug[3])  # relu #3
    rules.append({"z_plus": True, "epsilon": 2.5e-7})
    layers.append(model.lin1_drug[4])  # conv #4
    rules.append({"z_plus": True, "epsilon": 2.5e-7})

    skip_layers.append(model.lin1_drug_skip)  # 0
    skip_rules.append({"z_plus": True, "epsilon": 2.5e-7})
    skip_layers.append(model.relu)  # relu #1
    skip_rules.append({"z_plus": True, "epsilon": 2.5e-7})

    # patient info input linear
    layers.append(model.lin1_info[0])  # conv #5
    rules.append({"z_plus": True, "epsilon": 2.5e-7})
    layers.append(model.lin1_info[1])  # relu #6
    rules.append({"z_plus": True, "epsilon": 2.5e-7})
    layers.append(model.lin1_info[2])  # conv #7
    rules.append({"z_plus": True, "epsilon": 2.5e-7})
    layers.append(model.lin1_info[3])  # relu #8
    rules.append({"z_plus": True, "epsilon": 2.5e-7})
    layers.append(model.lin1_info[4])  # conv #9
    rules.append({"z_plus": True, "epsilon": 2.5e-7})

    skip_layers.append(model.lin1_info_skip)  # 2
    skip_rules.append({"z_plus": True, "epsilon": 2.5e-7})
    skip_layers.append(model.relu)  # relu #3
    skip_rules.append({"z_plus": True, "epsilon": 2.5e-7})

    # Dynamic input linear
    layers.append(model.lin1_d[0])  # conv #10
    rules.append({"z_plus": True, "epsilon": 2.5e-7})
    layers.append(model.lin1_d[1])  # relu #11
    rules.append({"z_plus": True, "epsilon": 2.5e-7})
    layers.append(model.lin1_d[2])  # conv #12
    rules.append({"z_plus": True, "epsilon": 2.5e-7})
    layers.append(model.lin1_d[3])  # relu #13
    rules.append({"z_plus": True, "epsilon": 2.5e-7})
    layers.append(model.lin1_d[4])  # conv #14
    rules.append({"z_plus": True, "epsilon": 2.5e-7})

    skip_layers.append(model.lin1_d_skip)  # 4
    skip_rules.append({"z_plus": True, "epsilon": 2.5e-7})
    skip_layers.append(model.tanh)  # relu #5
    skip_rules.append({"z_plus": True, "epsilon": 2.5e-7})

    # Ratio input linear
    layers.append(model.lin1_d_ratio[0])  # conv #15
    rules.append({"z_plus": True, "epsilon": 2.5e-7})
    layers.append(model.lin1_d_ratio[1])  # relu #16
    rules.append({"z_plus": True, "epsilon": 2.5e-7})
    layers.append(model.lin1_d_ratio[2])  # conv #17
    rules.append({"z_plus": True, "epsilon": 2.5e-7})
    layers.append(model.lin1_d_ratio[3])  # relu #118
    rules.append({"z_plus": True, "epsilon": 2.5e-7})
    layers.append(model.lin1_d_ratio[4])  # conv #19
    rules.append({"z_plus": True, "epsilon": 2.5e-7})

    skip_layers.append(model.lin1_d_ratio_skip)  # 6
    skip_rules.append({"z_plus": True, "epsilon": 2.5e-7})
    skip_layers.append(model.tanh)  # relu #7
    skip_rules.append({"z_plus": True, "epsilon": 2.5e-7})

    # Dynamic ts input linear
    layers.append(model.lin1_d_mma[0])  # conv #20
    rules.append({"z_plus": True, "epsilon": 2.5e-10})
    layers.append(model.lin1_d_mma[1])  # relu #21
    rules.append({"z_plus": True, "epsilon": 2.5e-10})
    layers.append(model.lin1_d_mma[2])  # conv #22
    rules.append({"z_plus": True, "epsilon": 2.5e-10})
    layers.append(model.lin1_d_mma[3])  # relu #23
    rules.append({"z_plus": True, "epsilon": 2.5e-10})
    layers.append(model.lin1_d_mma[4])  # conv #24
    rules.append({"z_plus": True, "epsilon": 2.5e-10})

    skip_layers.append(model.lin1_d_mma_skip)  # 8
    skip_rules.append({"z_plus": True, "epsilon": 2.5e-10})
    skip_layers.append(model.tanh)  # relu #9
    skip_rules.append({"z_plus": True, "epsilon": 2.5e-10})

    # Flag input linear
    layers.append(model.lin1_d_flag[0])  # conv #25
    rules.append({"z_plus": True, "epsilon": 2.5e-7})
    layers.append(model.lin1_d_flag[1])  # relu #26
    rules.append({"z_plus": True, "epsilon": 2.5e-7})
    layers.append(model.lin1_d_flag[2])  # conv #27
    rules.append({"z_plus": True, "epsilon": 2.5e-7})
    layers.append(model.lin1_d_flag[1])  # relu #28
    rules.append({"z_plus": True, "epsilon": 2.5e-7})
    layers.append(model.lin1_d_flag[4])  # conv #29
    rules.append({"z_plus": True, "epsilon": 2.5e-7})

    skip_layers.append(model.lin1_d_flag_skip)  # 10
    skip_rules.append({"z_plus": True, "epsilon": 2.5e-7})
    skip_layers.append(model.relu)  # relu #11
    skip_rules.append({"z_plus": True, "epsilon": 2.5e-7})

    # Grad input linear
    layers.append(model.lin1_d_grad[0])  # conv #30
    rules.append({"z_plus": True, "epsilon": 2.5e-7})
    layers.append(model.lin1_d_grad[1])  # relu #31
    rules.append({"z_plus": True, "epsilon": 2.5e-7})
    layers.append(model.lin1_d_grad[2])  # conv #32
    rules.append({"z_plus": True, "epsilon": 2.5e-7})
    layers.append(model.lin1_d_grad[3])  # relu #33
    rules.append({"z_plus": True, "epsilon": 2.5e-7})
    layers.append(model.lin1_d_grad[4])  # conv #34
    rules.append({"z_plus": True, "epsilon": 2.5e-7})

    skip_layers.append(model.lin1_d_grad_skip)  # 12
    skip_rules.append({"z_plus": True, "epsilon": 2.5e-7})
    skip_layers.append(model.relu)  # relu #13
    skip_rules.append({"z_plus": True, "epsilon": 2.5e-7})

    # ResBlock1
    layers.append(model.res1.conv1)  # 35
    rules.append({"z_plus": True, "epsilon": 1e-6})
    layers.append(model.res1.relu)  # relu #36
    rules.append({"z_plus": True, "epsilon": 1e-6})
    layers.append(model.res1.conv2)  # 37
    rules.append({"z_plus": True, "epsilon": 1e-6})
    layers.append(model.res1.relu)  # relu #38
    rules.append({"z_plus": True, "epsilon": 1e-6})
    layers.append(model.res1.conv3)  # 39
    rules.append({"z_plus": True, "epsilon": 1e-6})

    skip_layers.append(model.res1.conv_skip1)  # 14
    skip_rules.append({"z_plus": True, "epsilon": 1e-6})
    skip_layers.append(model.res1.relu)  # relu #15
    skip_rules.append({"z_plus": True, "epsilon": 1e-6})

    # ResBlock2
    layers.append(model.res2.conv1)  # 40
    rules.append({"z_plus": True, "epsilon": 1e-6})
    layers.append(model.res2.relu)  # relu #41
    rules.append({"z_plus": True, "epsilon": 1e-6})
    layers.append(model.res2.conv2)  # 42
    rules.append({"z_plus": True, "epsilon": 1e-6})
    layers.append(model.res2.relu)  # relu #43
    rules.append({"z_plus": True, "epsilon": 1e-6})
    layers.append(model.res2.conv3)  # 44
    rules.append({"z_plus": True, "epsilon": 1e-6})

    skip_layers.append(model.res2.conv_skip1)  # 16
    skip_rules.append({"z_plus": True, "epsilon": 1e-6})
    skip_layers.append(model.res2.relu)  # relu #17
    skip_rules.append({"z_plus": True, "epsilon": 1e-6})

    # ResBlock3
    layers.append(model.res3.conv1)  # 45
    rules.append({"z_plus": True, "epsilon": 1e-6})
    layers.append(model.res3.relu)  # relu #46
    rules.append({"z_plus": True, "epsilon": 1e-6})
    layers.append(model.res3.conv2)  # 47
    rules.append({"z_plus": True, "epsilon": 1e-6})
    layers.append(model.res3.relu)  # relu #48
    rules.append({"z_plus": True, "epsilon": 1e-6})
    layers.append(model.res3.conv3)  # 49
    rules.append({"z_plus": True, "epsilon": 1e-6})

    skip_layers.append(model.res3.conv_skip1)  # 18
    skip_rules.append({"z_plus": True, "epsilon": 1e-6})
    skip_layers.append(model.res3.relu)  # relu #19
    skip_rules.append({"z_plus": True, "epsilon": 1e-6})

    # ResBlock1_2
    layers.append(model.res1_2.conv1)  # 50 #19
    rules.append({"z_plus": True, "epsilon": 1e-6})
    layers.append(model.res1_2.relu)  # relu #51
    rules.append({"z_plus": True, "epsilon": 1e-6})
    layers.append(model.res1_2.conv2)  # 52
    rules.append({"z_plus": True, "epsilon": 1e-6})
    layers.append(model.res1_2.relu)  # relu #53
    rules.append({"z_plus": True, "epsilon": 1e-6})
    layers.append(model.res1_2.conv3)  # 54
    rules.append({"z_plus": True, "epsilon": 1e-6})

    skip_layers.append(model.res1_2.conv_skip1)  # 20
    skip_rules.append({"z_plus": True, "epsilon": 1e-6})
    skip_layers.append(model.res1_2.relu)  # relu #21
    skip_rules.append({"z_plus": True, "epsilon": 1e-6})

    # ResBlock2_2
    layers.append(model.res2_2.conv1)  # 55 #14
    rules.append({"z_plus": True, "epsilon": 1e-6})
    layers.append(model.res2_2.relu)  # relu #56
    rules.append({"z_plus": True, "epsilon": 1e-6})
    layers.append(model.res2_2.conv2)  # 57
    rules.append({"z_plus": True, "epsilon": 1e-6})
    layers.append(model.res2_2.relu)  # relu #58
    rules.append({"z_plus": True, "epsilon": 1e-6})
    layers.append(model.res2_2.conv3)  # 59
    rules.append({"z_plus": True, "epsilon": 1e-6})

    skip_layers.append(model.res2_2.conv_skip1)  # 22
    skip_rules.append({"z_plus": True, "epsilon": 1e-6})
    skip_layers.append(model.res2_2.relu)  # relu #23
    skip_rules.append({"z_plus": True, "epsilon": 1e-6})

    # ResBlock3_2
    layers.append(model.res3_2.conv1)  # 60 #9
    rules.append({"z_plus": True, "epsilon": 1e-6})
    layers.append(model.res3_2.relu)  # relu #61 #8
    rules.append({"z_plus": True, "epsilon": 1e-6})
    layers.append(model.res3_2.conv2)  # 62 #7
    rules.append({"z_plus": True, "epsilon": 1e-6})
    layers.append(model.res3_2.relu)  # relu #63 #6
    rules.append({"z_plus": True, "epsilon": 1e-6})
    layers.append(model.res3_2.conv3)  # 64 #5
    rules.append({"z_plus": True, "epsilon": 1e-6})

    skip_layers.append(model.res3_2.conv_skip1)  # 24
    skip_rules.append({"z_plus": True, "epsilon": 1e-6})
    skip_layers.append(model.res3_2.relu)  # relu #25 #
    skip_rules.append({"z_plus": True, "epsilon": 1e-6})

    # Pooling
    layers.append(model.GAP)  # 65
    rules.append({"z_plus": True, "epsilon": 2.5e-7})

    # Pooling2
    layers.append(model.GAP2)  # 66
    rules.append({"z_plus": True, "epsilon": 2.5e-7})

    # decoder linears
    layers.append(model.decoder[0])
    rules.append({"z_plus": False, "epsilon": 2.5e-7})
    layers.append(model.decoder[1])
    rules.append({"z_plus": False, "epsilon": 2.5e-7})
    layers.append(model.decoder[2])
    rules.append({"z_plus": False, "epsilon": 2.5e-7})

    return layers, rules, skip_layers, skip_rules
