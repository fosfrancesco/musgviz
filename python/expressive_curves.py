import numpy as np
import os
import json
import partitura as pt
from torch_scatter import scatter_mean
import torch


def process_score(score_path, json_path, noise_amount=0.1):
    score = pt.load_score(score_path)
    note_array = score.note_array()
    # initialize the performance array with 0s
    performance_array = np.zeros(note_array.shape[0], dtype=[("beat_period", "f4"), ("velocity", "f4"), ("articulation_log", "f4"), ("timing", "f4")])
    jfile = json.load(json_path)
    cadences = score.cadences
    sort_idx = np.argsort(list(map(lambda x: x.start.t, cadences)))
    cadence_points = np.array(list(map(lambda x: x.start.t, cadences)))
    # add 0 on the beginning of the array
    # A tempo curve for a phrase is a "gaussian" distribution
    mu = 0.6
    sig = 3
    tempo_curve = np.linspace(0, 1, num=1000)
    tempo_curve = np.exp(-0.5 * ((tempo_curve - mu) / sig) ** 2)
    # for ranges between cadences we apply the distribution model and scale the x axis
    start_t = 0
    for i in range(len(cadence_points)):
        end_t = cadence_points[i]
        note_mask = (note_array["onset_div"] >= start_t) & (note_array["onset_div"] <= end_t)
        onset_div = note_array["onset_div"][note_mask] - start_t
        range = end_t - start_t
        tc = tempo_curve * range
        # we select the points corresponding to the notes and add noise
        performance_array["beat_period"][note_mask] = tc[onset_div] + np.random.normal(0, noise_amount, len(onset_div))
        start_t = end_t

    onset_edges = np.array(jfile["onset"], dtype=int)
    during_edges = np.array(jfile["during"], dtype=int)
    consecutive_edges = np.array(jfile["consecutive"], dtype=int)
    rest_edges = np.array(jfile["rest"], dtype=int)
    all_edges = np.concatenate((onset_edges, during_edges, consecutive_edges, rest_edges))
    all_edges = torch.from_numpy(all_edges, dtype=torch.long)

    timing_mask = np.unique(onset_edges[0])
    # we add noise to the timing values
    performance_array["timing"][timing_mask] = np.random.normal(0, noise_amount, len(timing_mask))
    # we add noise to the velocity values around the value of 0.5 (velocity is strictly between 0 and 1)
    performance_array["velocity"] = 0.5 + np.random.normal(0, noise_amount, len(performance_array))
    # articulation_log should be between -5 and 5
    performance_array["articulation_log"] = np.random.normal(0, noise_amount, len(performance_array)) * 5
    # smooth the articulation values via the graph
    articulation = scatter_mean(torch.from_numpy(performance_array["articulation"])[all_edges[0]], all_edges[1], dim=0, dim_size=len(performance_array))
    performance_array["articulation_log"] = articulation.numpy()
    # smooth the tempo values via the graph
    beat_period = scatter_mean(torch.from_numpy(performance_array["beat_period"])[all_edges[0]], all_edges[1], dim=0, dim_size=len(performance_array))
    # prime the velocity values of the explanation graph
