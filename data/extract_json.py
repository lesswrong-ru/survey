#!/usr/bin/env python3
import json
import pandas as pd
import numpy as np
import math

def main():
    df = pd.read_csv('data.txt', sep='\t')

    data = {}
    russian_columns = df.ix[0]
    columns = [
        column
        for column in df.columns
        if column not in ('timestamp', 'privacy', 'contacts', 'comments2')
    ]

    for column in columns:
        data[column] = {
            'title': russian_columns[column],
            'values': [],
        }


    for i in range(1, df.index.size):
        for column in columns:
            value = df.ix[i][column]
            if type(value) == float and math.isnan(value):
                value = None
            data[column]['values'].append(value)

    # important for anonimization of our data!
    for column in data.keys():
        data[column]['values'] = sorted(data[column]['values'], key=lambda x: x or '')

    with open('../data.js', mode='w') as js:
        print('export const data = ' + json.dumps(data) + ';', file=js)
        print('export const columns = ' + json.dumps(list(columns)) + ';', file=js)

if __name__ == '__main__':
    main()
