import numpy as np
import os
import json
import partitura as pt
import partitura.score
import partitura.score as spt
import torch


def process_score(score_path, json_path, max_velocity=0.8):
    """
    Create a performance from a score and a json file with the explanation graph

    Parameters
    ----------
    score_path : str
        Path to the score
    json_path : str
        Path to the json file with the explanation graph
    noise_amount : float
        Amount of noise to add to the performance, default is 0.1
    max_velocity : float
        Maximum velocity value, default is 0.8. When using a disklavier be careful with the velocity values
    mean_velocity : float
        Mean velocity value, default is 0.3
    graph_smooth : bool
        If True, the performance is smoothed using the input graph, default is True
    add_noise : bool
        If True, noise is added to the performance, default is True
    skewness_of_tempo : float
        Skewness of the tempo curve, default is 0.0. If the value is positive the tempo curve is skewed to the right, if the value is negative the tempo curve is skewed to the left.
        A value of 0.0 means that the tempo curve is a normal distribution, a value of 4.0 would be a very skewed distribution.

    Returns
    -------
    performance : partitura.performance.Performance
        Performance object

    """
    score = pt.load_score(score_path)
    note_array = score.note_array(include_staff=True, include_pitch_spelling=True)
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
            note_idx = np.where(np.logical_or(note_array["id"] == f"P01_{k}", note_array["id"] == f"P00_{k}"))[0]
            if note_idx:
                cadence_points.append(note_array[note_idx[0]]["onset_div"])
                n_idxs.append(note_idx[0])
    cadence_points = np.array(cadence_points)
    cadence_points = np.unique(cadence_points)
    n_idxs = np.array(n_idxs)
    performance_array["velocity"][n_idxs] = max_velocity
    # sort the cadences by the start time
    cadence_points = cadence_points[np.argsort(cadence_points)]

    onset_edges = np.array(jfile.pop("onset"), dtype=int)
    during_edges = np.array(jfile.pop("during"), dtype=int)
    consecutive_edges = np.array(jfile.pop("consecutive"), dtype=int)
    rest_edges = np.array(jfile.pop("rest"), dtype=int)
    all_edges = np.hstack((onset_edges, during_edges, consecutive_edges, rest_edges))
    all_edges = torch.from_numpy(all_edges).long()

    velocity = torch.from_numpy(performance_array["velocity"])
    for k in id_keys:
        d = jfile[k]
        o_exp = np.array(d["onset"], dtype=int)
        d_exp = np.array(d["during"], dtype=int)
        c_exp = np.array(d["consecutive"], dtype=int)
        r_exp = np.array(d["rest"], dtype=int)
        exp_edges = np.hstack((o_exp, d_exp, c_exp, r_exp))
        exp_edges = torch.from_numpy(exp_edges).long()
        exp_idxs = torch.unique(torch.cat((exp_edges[0], exp_edges[1])))
        # increase the velocity of the notes that are part of the explanation
        velocity[exp_idxs] = max_velocity
    performance_array["velocity"] = velocity.numpy()

    # limit velocity to the maximum value
    performance_array["velocity"] = np.clip(performance_array["velocity"], 0, max_velocity)

    # Create new part for the reduction
    quarter_duration = score[0]._quarter_durations[0]
    new_part = spt.Part(id="Reduction", part_name="Explanation Reduction", part_abbreviation="ER", quarter_duration=quarter_duration)
    # initialize clef, key and time signature
    for p in score.parts:
        for el in p.iter_all(start=0, end=1):
            if isinstance(el, spt.Clef):
                new_part.add(el, 0)
            elif isinstance(el, spt.KeySignature):
                new_part.add(el, 0)
            elif isinstance(el, spt.TimeSignature):
                new_part.add(el, 0)
            else:
                pass

    new_notes = np.unique(np.hstack((n_idxs, exp_idxs.numpy())))
    new_note_array = note_array[new_notes]
    # fix onset beats to start from zero and not to be spaced more than 2 beats apart.
    new_note_array["onset_beat"] = new_note_array["onset_beat"] - new_note_array["onset_beat"].min()
    onset_beats = new_note_array["onset_beat"]
    offset_beats = new_note_array["onset_beat"] + new_note_array["duration_beat"]
    par = []
    child = []
    categorized = np.zeros(new_note_array.shape[0], dtype=bool)
    for i, note in enumerate(new_note_array):
        if categorized[i]:
            continue
        n_onset = note["onset_beat"]
        n_offset = note["onset_beat"] + note["duration_beat"]
        pot_idx = np.where(np.logical_and(onset_beats < n_offset, onset_beats >= n_onset))
        if pot_idx[0].shape[0] == 1:
            par.append(i)
            child.append([])
        elif len(pot_idx[0]) == len(np.where(onset_beats == n_onset)[0]):
            continue
        else:
            c = []
            par.append(i)
            for idx in pot_idx[0]:
                if idx != i:
                    c.append(idx)
                    categorized[i] = True
                    categorized[idx] = True
            child.append(c)
    # Now you found pedal notes and their children let's restructure them so that they left alighned
    # Set minimum duration of 1 beat
    new_note_array[new_note_array["duration_beat"] < 1]["duration_beat"] = 1
    for i, p in enumerate(par):
        if len(child[i]) == 0:
            continue
        p_note = new_note_array[p]
        p_offset = p_note["onset_beat"] + p_note["duration_beat"]
        # find unique onset values for the children
        children_onset = new_note_array[child[i]]["onset_beat"]
        un_ch_onset = np.unique(children_onset)
        new_onset = p_note["onset_beat"]
        for on_v in un_ch_onset:
            ch_idx = np.array(child[i])[children_onset == on_v]
            new_note_array[ch_idx]["onset_beat"] = new_onset
            dur = np.maximum(new_note_array[ch_idx]["duration_beat"], 1).max()
            new_note_array[ch_idx]["duration_beat"] = dur
            new_onset = new_onset + dur

    offset_times = new_note_array["onset_beat"] + new_note_array["duration_beat"]
    onset_times = new_note_array["onset_beat"]
    unique_onset_times = np.unique(onset_times)
    diff_times = onset_times[1:] - offset_times[:-1] > 4
    for i, diff in enumerate(diff_times):
        if diff:
            onset_times[i+1:] = onset_times[i+1:] - onset_times[i+1] + offset_times[i]
            new_note_array["onset_beat"] = onset_times
            offset_times = new_note_array["onset_beat"] + new_note_array["duration_beat"]
            onset_times = new_note_array["onset_beat"]

    start = score[0].inv_beat_map(new_note_array["onset_beat"]).astype(int)
    end = score[0].inv_beat_map(new_note_array["onset_beat"] + new_note_array["duration_beat"]).astype(int)
    for i, note in enumerate(new_note_array):
        el = spt.Note(
            step=note["step"],
            octave=note["octave"],
            alter=note["alter"],
            id=note["id"],
            staff=note["staff"],
            voice=note["voice"],
            symbolic_duration=pt.utils.music.estimate_symbolic_duration(note["duration_beat"]*quarter_duration, quarter_duration),
        )
        new_part.add(el, start=start[i], end=end[i])

    pt.save_score_midi(new_part, os.path.join(os.path.dirname(__file__), "reduction.mid"), part_voice_assign_mode=2)
    spt.add_measures(new_part)
    pt.score.tie_notes(new_part)
    pt.save_musicxml(new_part, os.path.join(os.path.dirname(__file__), "reduction.musicxml"))



if __name__ == "__main__":
    static_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
    score_path = os.path.join(static_folder, "K280-2_explained.mei")
    json_path = os.path.join(static_folder, "K280-2_model_IG.json")
    process_score(score_path, json_path)