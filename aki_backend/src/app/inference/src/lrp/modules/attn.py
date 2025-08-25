import torch 
import torch.nn as nn
from .utils import construct_incr, construct_rho, clone_layer, keep_conservative
import math
import torch.nn.functional as F


class AttnLrp(nn.Module):
    def __init__(self, ):
        super().__init__()
        
        self.mask = None  
        
    def forward(self, Q, K, V):
        # Compute attention scores
        d_k = Q.size(-1)
        attention_scores = torch.matmul(Q, K.transpose(-2, -1)) / torch.sqrt(torch.tensor(d_k, dtype=torch.float32))

        # Apply softmax to get attention weights
        attention_weights = F.softmax(attention_scores, dim=-1)

        # Compute the output of the attention mechanism
        output = torch.matmul(attention_weights, V)

        return output, attention_weights

    def lrp(self, R, Q, K, V, attention_weights):
        # Propagate relevance through the value matrix
        R_V = torch.matmul(attention_weights.transpose(-1, -2), R)

        # Propagate relevance through the attention weights
        R_attention_weights = torch.matmul(R, V.transpose(-1, -2))

        # Ensure dimensions are compatible for element-wise multiplication
        if R_attention_weights.shape != attention_weights.shape:
            # Adjust shapes if necessary
            # Example: Use repeat to match dimensions
            R_attention_weights = R_attention_weights.repeat(1, 1, 1, attention_weights.size(-1) // R_attention_weights.size(-1))

        # Propagate relevance through the softmax
        R_attention_scores = R_attention_weights * attention_weights

        # Ensure dimensions are compatible for matmul
        if R_attention_scores.shape[-1] != K.shape[-2]:
            # Adjust K to make dimensions compatible
            K = K.transpose(-1, -2)

        # Propagate relevance through the dot product
        R_Q = torch.matmul(R_attention_scores, K)
        R_K = torch.matmul(R_attention_scores.transpose(-1, -2), Q)

        # Normalize relevance to ensure conservation
        total_relevance = R.sum()
        R_Q = R_Q * (total_relevance / R_Q.sum())
        R_K = R_K * (total_relevance / R_K.sum())
        R_V = R_V * (total_relevance / R_V.sum())

        return R_Q, R_K, R_V