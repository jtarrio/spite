#!/usr/bin/python3

# Separate the original surround soundtrack into three front speakers and a back speaker.
# Examples: Scenes 17 and 53 in https://archive.org/details/dolby-explore-our-world/

from scipy.io import wavfile
import numpy as np
import sys

file_in = sys.argv[1]
file_out = sys.argv[2]

sr,data=wavfile.read(file_in)
samples = data.transpose() / 32768.0
c=np.zeros(int((len(data)+63)/64))
for i in range(int(len(data)/64)):
    first = i*64
    last = (i+1)*64
    a = samples[0][first:last]
    b = samples[1][first:last]
    c[i] = np.corrcoef(a,b)[0][1]
    if np.isnan(c[i]):
        c[i] = 0

out = np.array([np.zeros(len(data)), np.zeros(len(data)), np.zeros(len(data)), np.zeros(len(data))])

s2 = 1 / np.sqrt(2)

mix = 0
for i in range(int(len(data)/64)):
    first = i*64
    last = (i+1)*64
    a = samples[0][first:last]
    b = samples[1][first:last]
    mix = 0.95 * mix + 0.05 * np.abs(c[i])
    front = a + b
    back = a - b
    out[0][first:last] = a * (1 - mix)
    out[1][first:last] = b * (1 - mix)
    out[2][first:last] = s2 * front * mix
    out[3][first:last] = s2 * back * mix


wavfile.write(file_out, sr, out.transpose())
