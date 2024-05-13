import numpy as np
import os
import json
import partitura as pt
from torch_scatter import scatter_mean
import torch


def process_score(score_path, json_path, noise_amount=0.1, max_velocity=1.0):
    score = pt.load_score(score_path)
    note_array = score.note_array()
    # initialize the performance array with 0s
    performance_array = np.zeros(note_array.shape[0], dtype=[("beat_period", "f4"), ("velocity", "f4"), ("articulation_log", "f4"), ("timing", "f4")])
    with open(json_path) as json_path:
        jfile = json.load(json_path)
    # cadences = [] # score[-1].cadences
    cadence_points = []
    # find all id keys:
    id_keys = []
    n_idxs = []
    for k in jfile.keys():
        if k.startswith("p"):
            id_keys.append(k)
            note_idx = np.where(note_array["id"] == f"P01_{k}")[0]
            if note_idx:
                cadence_points.append(note_array[note_idx[0]]["onset_div"])
                n_idxs.append(note_idx[0])
    cadence_points = np.array(cadence_points)
    cadence_points = np.unique(cadence_points)
    n_idxs = np.array(n_idxs)
    # sort the cadences by the start time
    cadence_points = cadence_points[np.argsort(cadence_points)]
    # sort_idx = np.argsort(list(map(lambda x: x.start.t, cadences)))
    # cadence_points = np.array(list(map(lambda x: x.start.t, cadences)))
    # add 0 on the beginning of the array
    # A tempo curve for a phrase is a "gaussian" distribution
    mu = 0
    sig = 1
    tempo_curve = np.linspace(-1, 1, num=10000)
    tempo_curve = np.exp(-0.5 * ((tempo_curve - mu) / sig) ** 2)
    # for ranges between cadences we apply the distribution model and scale the x axis
    start_t = 0
    for i in range(len(cadence_points)):
        end_t = cadence_points[i]
        note_mask = (note_array["onset_div"] >= start_t) & (note_array["onset_div"] <= end_t)
        onset_div = note_array["onset_div"][note_mask] - start_t
        range_t = end_t - start_t
        # tc = tempo_curve * range_t
        idx_onset = onset_div * (tempo_curve.shape[0]/ range_t) - 1
        idx_onset = np.round(idx_onset).astype(int)
        # we select the points corresponding to the notes and add noise
        performance_array["beat_period"][note_mask] = tempo_curve[idx_onset] + np.random.normal(0, noise_amount, len(onset_div))
        start_t = end_t

    onset_edges = np.array(jfile.pop("onset"), dtype=int)
    during_edges = np.array(jfile.pop("during"), dtype=int)
    consecutive_edges = np.array(jfile.pop("consecutive"), dtype=int)
    rest_edges = np.array(jfile.pop("rest"), dtype=int)
    all_edges = np.hstack((onset_edges, during_edges, consecutive_edges, rest_edges))
    all_edges = torch.from_numpy(all_edges).long()
    timing_mask = np.unique(onset_edges[0])
    # we add noise to the timing values
    performance_array["timing"][timing_mask] = np.random.normal(0, noise_amount*0.1, len(timing_mask))
    # we add noise to the velocity values around the value of 0.5 (velocity is strictly between 0 and 1)
    performance_array["velocity"] = 0.5 + np.random.normal(0, noise_amount, len(performance_array))
    # articulation_log should be between -5 and 5
    performance_array["articulation_log"] = np.random.normal(0, noise_amount, len(performance_array)) * 5
    # smooth the articulation values via the graph
    articulation = torch.from_numpy(performance_array["articulation_log"])
    articulation = scatter_mean(torch.from_numpy(performance_array["articulation_log"])[all_edges[0]], all_edges[1], dim=0, out=articulation)
    performance_array["articulation_log"] = articulation.numpy()
    # smooth the tempo values via the graph
    beat_period = torch.from_numpy(performance_array["beat_period"])
    beat_period = scatter_mean(torch.from_numpy(performance_array["beat_period"])[all_edges[0]], all_edges[1], dim=0, out=beat_period)
    performance_array["beat_period"] = beat_period.numpy()
    # prime the velocity values of the explanation graph
    performance_array["velocity"][n_idxs] = max_velocity
    velocity = torch.from_numpy(performance_array["velocity"])
    for k in id_keys:
        d = jfile[k]
        o_exp = np.array(d["onset"], dtype=int)
        d_exp = np.array(d["during"], dtype=int)
        c_exp = np.array(d["consecutive"], dtype=int)
        r_exp = np.array(d["rest"], dtype=int)
        exp_edges = np.hstack((o_exp, d_exp, c_exp, r_exp))
        exp_edges = torch.from_numpy(exp_edges).long()
        # increase the velocity of the notes that are part of the explanation
        velocity[n_idxs] += 0.1
        # smooth the velocity values via the explanation graph
        velocity = scatter_mean(velocity[exp_edges[0]], exp_edges[1], dim=0, out=velocity)
    performance_array["velocity"] = velocity.numpy()

    # save the performance midi
    performance = pt.musicanalysis.performance_codec.decode_performance(score, performance_array=performance_array)
    pt.save_performance_midi(performance, os.path.join(os.path.dirname(__file__), os.path.splitext(os.path.basename(score_path))[0] + "-perf.mid"), )




if __name__ == "__main__":
    static_folder = os.path.dirname(os.path.dirname(__file__))
    score_path = os.path.join(static_folder, "Nocturne_in_C_minor_Op.48_No.1_explained.mei")
    json_path = os.path.join(static_folder, "Nocturne_in_C_minor_Op.48_No.1_model_IG.json")
    process_score(score_path, json_path)