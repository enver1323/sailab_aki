import torch 
import torch.nn as nn
from torch.autograd import Variable
import torch.nn.functional as F
from .utils import construct_incr, clone_layer


class AvgPoolLrp(nn.Module):
    def __init__(self, layer, rule):
        super().__init__()

        rule = {k: v for k, v in rule.items() if k == "epsilon"}  # only epsilon rule is possible
        self.layer = clone_layer(layer)
        self.incr = construct_incr(**rule)

    def forward(self, Rj, Ai):
        Ai = torch.autograd.Variable(Ai, requires_grad=True)
        Ai.retain_grad()
        Z = self.layer.forward(Ai)
        Z = self.incr(Z)
        S = (Rj / Z).data
        (Z * S).sum().backward()
        Ci = Ai.grad

        # Calculate relevance
        Ri = (Ai * Ci).data

        # Normalize to ensure relevance conservation
        total_relevance = Rj.sum()
        Ri = Ri * (total_relevance / (Ri.sum() + 1e-7))

        return Ri


class MaxPoolLrp(nn.Module):
    def __init__(self, layer, rule):
        super().__init__()

        rule = {k: v for k,v in rule.items() if k=="epsilon"}  # only epsilont rule is possible
        self.layer = clone_layer(layer)#torch.nn.AvgPool2d(kernel_size=layer.kernel_size, stride=layer.stride)#
        self.incr = construct_incr(**rule)

    def forward(self, Rj, Ai):
        
        Ai = torch.autograd.Variable(Ai, requires_grad=True)
        Ai.retain_grad()
        Z = self.layer.forward(Ai)
        Z = self.incr(Z)
        S = (Rj / Z).data 
        (Z * S).sum().backward()
        Ci = Ai.grad 

        Ri = (Ai * Ci).data
        #Ri /= (Ri.sum() + 1e-7)
        
        return  Ri

class AdaptiveAvgPoolLrp(nn.Module):
    def __init__(self, layer, rule):
        super().__init__()

        rule = {k: v for k,v in rule.items() if k=="epsilon"}  # only epsilont rule is possible
        self.layer = clone_layer(layer)
        self.incr = construct_incr(**rule)

    def forward(self, Rj, Ai):
        
        Ai = torch.autograd.Variable(Ai, requires_grad=True)
        Ai.retain_grad()
        Z = self.layer.forward(Ai)
        Z = self.incr(Z)
        S = (Rj / Z).data 
        (Z * S).sum().backward()
        Ci = Ai.grad 

        Ri = (Ai * Ci).data
        #Ri /= (Ri.sum() + 1e-7)
        return  Ri
