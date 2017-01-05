#!/usr/bin/env python3
import json
import pandas as pd
import numpy as np
import math
import re

# some data was already normalized manually before we apply these fixes
column_specific_fixes = {
    'speciality': {
        'it': 'IT',
        'ит': 'IT',
        'информационные технологии': 'IT',
        'экономист': 'Экономика',
        'математик': 'Математика',
        'программист': 'Программирование',
        'психолог': 'Психология',
        'журналист': 'Журналистика',
        'юрист': 'Юриспруденция',
    },
    'country': {
        'сша': 'США',
        'germany': 'Германия',
        'singapore': 'Сингапур',
    },
    'city': {
        'росто-на-дону': 'Ростов-на-Дону',
        'мінск': 'Минск',
        'singapore': 'Сингапур',
        '{vtkmybwrbq': 'Хмельницкий',
    },
    'hobby': {
        'видеоигры': 'Компьютерные игры',
        'videogames': 'Компьютерные игры',
        'комп. игры': 'Компьютерные игры',
        'чгк': 'Что? Где? Когда?',
        'что?где?когда?': 'Что? Где? Когда?',
    },
}
def normalize_one(column, value):
    value = re.sub(':\)$', '', value)
    if column != 'income':
        value = re.sub('\.$', '', value)
    value = value.strip()
    if value == '':
        return None
    value = value[0].upper() + value[1:]

    if column in column_specific_fixes:
        value = column_specific_fixes[column].get(value.lower(), value)

    if column == 'source' and 'gipsy' in value.lower():
        value = 'Покерный форум GipsyTeam.ru'

    return value

def split_meetup_reasons(value):
    # this is hard because some answers included commas, but in some cases commas were a separator of multiple answers
    presets = [
        'Обсудить интересные темы',
        'Узнать что-то новое',
        'Пообщаться с единомышленниками',
        'Социализироваться',
        'Найти друзей',
        'Помочь сообществу и людям',
        'Попрактиковаться в чтении докладов и организационной деятельности',
        'В моем городе нет встреч',
        'Не получается по расписанию',
        'Собираюсь, но откладываю',
        'Не люблю людей и тусовки',
        'Боюсь незнакомых людей',
        'Люди на встречах занимаются не тем, чем мне хотелось бы',
        'Считаю это неоправданной тратой времени',
        'Мне не нравятся люди на встречах',
    ]

    values = []
    for preset in presets:
        if preset in value:
            value = re.sub(re.escape(preset), 'PRESET', value)
            values.append(preset)

    values.append(
        ', '.join(
            part
            for part in value.split(', ')
            if part != 'PRESET'
        )
    )
    return values

def normalize(column, value):
    if not value:
        return [value]

    if column == 'income':
        value = str(int(float(value)))

        def group_n(n):
            group_id = int(int(value) / (100 * n))
            return '${}00 - ${}99'.format(n * group_id, n * group_id + n - 1)

        if int(value) < 100:
            value = 'до $100'
        elif int(value) < 500:
            value = '$100 - $499'
        elif int(value) < 5000:
            value = group_n(5)
        else:
            value = '> $5000'

    if column == 'iq':
        value = int((value - 1) / 10) * 10
        return ['{}-{}'.format(value + 1, value + 10)]

    if type(value) == int:
        return [value] # nothing to normalize

    if column in ('meetups_why', 'meetups_why_not'):
        values = split_meetup_reasons(value)
    elif column in ('hobby', 'job', 'speciality'):
        value = re.sub('\(.*?\)', '', value) # get rid of (...), they are messing up with splitting-by-comma
        values = re.split(r',\s*', value)
    else:
        values = [value]

    return [normalize_one(column, v) for v in values]


def extract_other_values(data):
    value2count = {}
    for value in data['values']:
        if value == None:
            continue
        value2count[value] = value2count.get(value, 0) + 1

    single_values = set([
        value for value in value2count
        if value2count[value] == 1
    ])

    if single_values:
        data['other_values'] = sorted(list(single_values))
    data['values'] = [value for value in data['values'] if value not in single_values]


structure = [
    {
        'title': 'Общие данные',
        'columns': [
            'country',
            'city',
            'age',
            'gender',
            'source',
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
def main():
    df = pd.read_csv('data.txt', sep='\t')
    russian_columns = pd.read_csv('metadata.txt', sep='\t').ix[0]

    data = {}
    columns = [
        column
        for column in df.columns
        if column not in ('timestamp', 'privacy', 'contacts', 'comments2')
    ]

    # listing columns manually for the sake of the correct order

    for column in columns:
        data[column] = {
            'title': russian_columns[column],
            'values': [],
            'shortcuts': {},
            'type': 'str',
            'sort': 'top',
            'limit': 5,
            'multiple': False,
            'text_tail': False,
            'show': 'histogram',
        }

    data['referer']['shortcuts']['Через книгу "Гарри Поттер и методы рационального мышления"'] = 'Через ГПиМРМ'
    data['meetups_why']['shortcuts']['Попрактиковаться в чтении докладов и организационной деятельности'] = 'Попрактиковаться в чтении докладов и орг.деятельности'

    for column in ('age', 'compass_economics', 'compass_social', 'identity', 'happiness', 'iq', 'income', 'kids'):
        data[column]['type'] = 'int'
    for column in ('age', 'compass_economics', 'compass_social', 'identity', 'happiness', 'kids', 'sequences_english', 'sequences_russian'):
        data[column]['sort'] = 'numerical'
    for column in ('iq', 'income'):
        data[column]['sort'] = 'last_int'

    for column in columns:
        if column not in ('income', 'iq'): # income and iq are converted to intervals
            data[column]['output_type'] = data[column]['type']
        else:
            data[column]['output_type'] = 'str'

    data['english_cefr']['sort'] = 'lexical'

    for field in (
            'age', 'education', 'english_cefr', 'iq',
            'compass_social', 'compass_economics',
            'happiness',
            'online_lwru', 'online_slack', 'online_vk', 'online_lwcom', 'online_diaspora', 'online_reddit',
            'meetups_why', 'meetups_why_not',
        ):
        data[field]['limit'] = 1000

    for field in ('meetups_why', 'meetups_why_not', 'hobby', 'job', 'speciality'):
        data[field]['multiple'] = True

    for field in ('online_other', 'comments'):
        data[field]['show'] = 'text'

    for field in ('meetups_why', 'meetups_why_not'):
        data[field]['text_tail'] = True


    for i in range(df.index.size):
        for column in columns:
            value = df.ix[i][column]
            if type(value) in (float, np.float64) and math.isnan(value):
                value = None
            if type(value) == np.float64:
                value = float(value)
            if data[column]['type'] == 'int' and value:
                value = int(value)
            data[column]['values'].extend(normalize(column, value))

    # important for anonimization of our data!
    for column in data.keys():
        default = 0 if data[column]['type'] == 'int' and column not in ('income', 'iq') else ''
        data[column]['values'] = sorted(data[column]['values'], key=lambda x: x or default)

    for column in ('gender', 'religion', 'family', 'referer', 'meetups_city', 'meetups_why', 'meetups_why_not', 'compass_freeform'):
        extract_other_values(data[column])

    data['education']['note'] = '"Неоконченное" включает как продолжающийся процесс, так и прерванный в прошлом.'
    data['compass_economics']['note'] = 'См. https://www.politicalcompass.org/analysis2 для пояснений по этому и следующему вопросу.'
    data['compass_social']['note'] = 'См. https://www.politicalcompass.org/analysis2 для пояснений по этому и предыдущему вопросу.'
    data['iq']['note'] = 'Ваша честная оценка по итогам тестов, если вы проходили их в прошлом.'
    data['english_cefr']['note'] = 'См. https://en.wikipedia.org/wiki/Common_European_Framework_of_Reference_for_Languages'
    data['identity']['note'] = '(то есть как человек, разделяющий рациональное мировоззрение, не обязательно как человек, который сам по себе идеально рационален)'

    for column in data.keys():
        if column.startswith('online_') and column != 'online_other':
            data[column]['custom_sort'] = [
                'Не знаю, что это',
                'Знаю, что это, но не читаю',
                'Редко читаю',
                'Часто читаю',
                'Часто читаю и иногда пишу',
                'Часто читаю и пишу',
            ]
        if column.startswith('slang_'):
            data[column]['custom_sort'] = [
                'Знаю, что это',
                'Слышал(а) эти слова, но не могу объяснить другому их значение',
                'Мне это незнакомо',
            ]

    with open('../data.js', mode='w') as js:
        print('export const data = ' + json.dumps(data) + ';', file=js)
        print('export const columns = ' + json.dumps(columns) + ';', file=js)
        print('export const structure = ' + json.dumps(structure) + ';', file=js)
        print('export const total = {};'.format(df.index.size), file=js)

if __name__ == '__main__':
    main()
