import numpy as np
import os
import json
import partitura as pt


def process_score(score_path, json_path):
    score = pt.load_score(score_path)
    jfile = json.load(json_path)
    cadences = score.cadences
    sort_idx = np.argsort(list(map(lambda x: x.start.t, cadences)))
    cadence_points = np.arraY(list(map(lambda x: x.start.t, cadences)))
    # add 0 on the beginning of the array
    cumul_points = np.r_[0, cadence_points]


    # A tempo curve for a phrase is a "" distribution
    mu = 0.6
    sig = 3
    tempo_curve = np.linspace(0, 1, num=1000)
    # for ranges between cadences we apply the distribution model and scale the x axis
    # Then we add noise on the tempo values of each note.
    # Then we find the most important notes for which we increase expressive value ...

    # Then we compute the average between neighbors in the score graph

    #