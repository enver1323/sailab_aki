import torch 
import torch.nn as nn 
from .utils import construct_incr, construct_rho, clone_layer, keep_conservative

class ReluLrp(nn.Module):
    def __init__(self, layer, rule):
        super().__init__()
        self.layer = clone_layer(layer)

    def forward(self, Rj, Ai):
        return Rj
    
class TanhLrp(nn.Module):
    def __init__(self, layer, rule):
        super().__init__()
        self.layer = clone_layer(layer)

    def forward(self, Rj, Ai):
        return Rj


