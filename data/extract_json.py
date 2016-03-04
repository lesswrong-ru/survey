#!/usr/bin/env python3
import json
import pandas as pd
import numpy as np
import math

def normalize(column, value):
    if not value:
        return value
    if column in ('speciality', 'compass_freeform'):
        return value.lower()
    return value

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
            'shortcuts': {},
            'sort': 'top',
            'limit': 5,
            'show': 'histogram',
        }

    data['education']['shortcuts']['оконченное высшее (бакалавр, специалист, магистр)'] = 'Неоконченное высшее'
    data['referer']['shortcuts']['Через книгу "Гарри Поттер и методы рационального мышления"'] = 'Через ГПиМРМ'

    data['age']['sort'] = 'numerical'
    data['compass_economics']['sort'] = 'numerical'
    data['compass_social']['sort'] = 'numerical'
    data['identity']['sort'] = 'numerical'
    data['happiness']['sort'] = 'numerical'
    data['iq']['sort'] = 'numerical'
    data['sequences_russian']['sort'] = 'numerical'
    data['sequences_english']['sort'] = 'numerical'
    data['sequences_book']['sort'] = 'numerical'
    data['english_cefr']['sort'] = 'lexical'

    for field in ('age', 'english_cefr', 'iq', 'compass_social', 'compass_economics', 'happiness'):
        data[field]['limit'] = 1000


    for i in range(1, df.index.size):
        for column in columns:
            value = df.ix[i][column]
            if type(value) == float and math.isnan(value):
                value = None
            data[column]['values'].append(normalize(column, value))

    # important for anonimization of our data!
    for column in data.keys():
        data[column]['values'] = sorted(data[column]['values'], key=lambda x: x or '')

    with open('../data.js', mode='w') as js:
        print('export const data = ' + json.dumps(data) + ';', file=js)
        print('export const columns = ' + json.dumps(list(columns)) + ';', file=js)

if __name__ == '__main__':
    main()
