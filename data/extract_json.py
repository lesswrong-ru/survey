#!/usr/bin/env python3
import json
import pandas as pd
import numpy as np
import math
import re

def normalize_one(column, value):
    value = re.sub(':\)$', '', value)
    if column != 'income':
        value = re.sub('\.$', '', value)
    value = value.strip()
    if value == '':
        return None
    value = value[0].upper() + value[1:]
    return value

def normalize(column, value):
    if not value:
        return [value]

    column_specific_fixes = {
        'speciality': {
            'ит': 'IT',
            'экономист': 'Экономика',
            'математик': 'Математика',
            'программист': 'Программирование',
            'информационные технологии': 'IT',
        },
    }
    if column in column_specific_fixes:
        value = column_specific_fixes[column].get(value.lower(), value)

    if column == 'income':
        value = re.sub(',', '.', value)
        value = str(int(float(value)))
        if 0 < int(float(value)) < 300:
            value = str(1000 * int(float(value)))

        def group_n(n):
            group_id = int(int(value) / (1000 * n))
            return '{}-{} тыс. р.'.format(n * group_id, (n-1) + n * group_id)

        if int(value) < 5000:
            value = 'до 5 тыс. р.'
        elif int(value) < 10000:
            value = '5-9 тыс. р.'
        elif int(value) < 150000:
            value = group_n(10)
        else:
            value = group_n(50)

    if column == 'iq':
        value = int((int(value) - 1) / 10) * 10
        return ['{}-{}'.format(value + 1, value + 10)]

    if column in ('meetups_why', 'meetups_why_not'):
        values = re.split(r', (?=[А-Я])', value)
    elif column in ('hobby', 'job'):
        value = re.sub('\(.*?\)', '', value) # get rid of (...), they are messing up with splitting-by-comma
        values = re.split(r',\s*', value)
    else:
        values = [value]

    return [normalize_one(column, v) for v in values]


def extract_other_values(data):
    value2count = {}
    for value in data['values']:
        value2count[value] = value2count.get(value, 0) + 1

    single_values = set([
        value for value in value2count
        if value2count[value] == 1
    ])

    data['other_values'] = sorted(list(single_values))
    data['values'] = [value for value in data['values'] if value not in single_values]


def main():
    df = pd.read_csv('data.txt', sep='\t')

    data = {}
    russian_columns = df.ix[0]
    columns = [
        column
        for column in df.columns
        if column not in ('timestamp', 'privacy', 'contacts', 'comments2')
    ]

    # listing columns manually for the sake of the correct order
    structure = [
        {
            'title': 'Общие данные',
            'columns': [
                'country',
                'city',
                'age',
                'gender',
            ],
        },
        {
            'title': 'Образование',
            'columns': [
                'education',
                'higher_education',
                'speciality',
            ],
        },
        {
            'title': 'Политическая позиция',
            'columns': [
                'compass_economics',
                'compass_social',
                'compass_freeform',
            ],
        },
        {
            'title': 'Личные сведения',
            'columns': [
                'iq',
                'english',
                'english_cefr',
                'religion',
                'hand',
                'family',
                'kids',
                'kids_preference',
                'income',
                'job',
                'hobby',
            ],
        },
        {
            'title': 'Психика',
            'columns': [
                'happiness',
                'psy_depression',
                'psy_ocd',
                'psy_autism',
                'psy_bipolar',
                'psy_anxiety',
                'psy_borderline',
                'psy_schizo',
            ],
        },
        {
            'title': 'Знакомство с LessWrong',
            'columns': [
                'referer',
                'identity',
                'sequences_knows',
                'sequences_language',
                'sequences_russian',
                'sequences_english',
                'sequences_book',
                'slang_bias',
                'slang_bayes',
                'slang_epistemology',
                'slang_two_systems',
                'slang_solstice',
                'slang_fallacymania',
                'slang_ea',
                'slang_miri',
                'slang_ssc',
                'slang_hpmor',
                'slang_cfar',
                'slang_kocherga',
                'slang_transhumanism',
                'slang_rtd',
            ],
        },
        {
            'title': 'Участие в сообществе',
            'columns': [
                'online_lwru',
                'online_slack',
                'online_vk',
                'online_lwcom',
                'online_diaspora',
                'online_reddit',
                'online_other',
                'meetups',
                'meetups_city',
                'meetups_why',
                'meetups_why_not',
            ],
        },
        {
            'title': 'Текстовый отзыв',
            'columns': [
                'comments',
            ],
        },
    ]

    for column in columns:
        data[column] = {
            'title': russian_columns[column],
            'values': [],
            'shortcuts': {},
            'sort': 'top',
            'limit': 5,
            'multiple': False,
            'text_tail': False,
            'show': 'histogram',
        }

    data['referer']['shortcuts']['Через книгу "Гарри Поттер и методы рационального мышления"'] = 'Через ГПиМРМ'
    data['meetups_why']['shortcuts']['Попрактиковаться в чтении докладов и организационной деятельности'] = 'Попрактиковаться в чтении докладов и орг.деятельности'

    data['age']['sort'] = 'numerical'
    data['compass_economics']['sort'] = 'numerical'
    data['compass_social']['sort'] = 'numerical'
    data['identity']['sort'] = 'numerical'
    data['happiness']['sort'] = 'numerical'
    data['iq']['sort'] = 'last_int'
    data['income']['sort'] = 'last_int'
    data['sequences_russian']['sort'] = 'numerical'
    data['sequences_english']['sort'] = 'numerical'
    data['sequences_book']['sort'] = 'numerical'
    data['english_cefr']['sort'] = 'lexical'

    for field in ('age', 'education', 'english_cefr', 'iq', 'compass_social', 'compass_economics', 'happiness', 'online_lwru', 'online_slack', 'online_vk', 'online_lwcom', 'online_diaspora', 'online_reddit'):
        data[field]['limit'] = 1000

    for field in ('meetups_why', 'meetups_why_not', 'hobby', 'job'):
        data[field]['multiple'] = True

    for field in ('online_other', 'comments'):
        data[field]['show'] = 'text'

    for field in ('meetups_why', 'meetups_why_not'):
        data[field]['text_tail'] = True


    for i in range(1, df.index.size):
        for column in columns:
            value = df.ix[i][column]
            if type(value) == float and math.isnan(value):
                value = None
            data[column]['values'].extend(normalize(column, value))

    # important for anonimization of our data!
    for column in data.keys():
        data[column]['values'] = sorted(data[column]['values'], key=lambda x: x or '')

    for column in ('gender', 'religion', 'family', 'referer', 'meetups_city', 'meetups_why', 'meetups_why_not'):
        extract_other_values(data[column])

    with open('../data.js', mode='w') as js:
        print('export const data = ' + json.dumps(data) + ';', file=js)
        print('export const columns = ' + json.dumps(columns) + ';', file=js)
        print('export const structure = ' + json.dumps(structure) + ';', file=js)
        print('export const total = 305;', file=js) # FIXME - count the items in data

if __name__ == '__main__':
    main()
