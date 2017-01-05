#!/usr/bin/env python3
import pandas as pd
import math

df = pd.read_csv('data.txt', sep='\t')
columns = [
    column
    for column in df.columns
    if column not in ('timestamp', 'privacy', 'contacts', 'comments2')
]

print('Total columns: {}'.format(len(columns)))
print('Total rows: {}'.format(df.index.size))

def is_empty(value):
    return (type(value) == float and math.isnan(value))

for i in range(0, df.index.size):
    for j in range(i+1, df.index.size):
        x = df.ix[i]
        y = df.ix[j]

        equal = 0
        different = 0
        empty_both = 0
        empty_x = 0
        empty_y = 0

        for column in columns:
            vx = x[column]
            vy = y[column]
            if is_empty(vx):
                if is_empty(vy):
                    empty_both += 1
                else:
                    empty_x += 1
            else:
                if is_empty(vy):
                    empty_y += 1
                else:
                    if vx == vy:
                        equal += 1
                    else:
                        different += 1

        if different > 10:
            continue
        if equal < 15:
            continue
        print(
            '[{} vs {}] [{} vs {}] {}\t{}\t{}\t{}\t{}'.format(
                i, j,
                x['timestamp'], y['timestamp'],
                equal,
                different,
                empty_both,
                empty_x,
                empty_y,
            )
        )
