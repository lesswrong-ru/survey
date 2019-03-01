# SEMANTICS:
# key:
# - alphanumerical key for data.js
#
# type:
# - defaults to 'str'
# - can be 'int'
#
# sort:
# - defaults to 'top'
# - can be 'numerical', 'lexical' or 'last_int'
#
# limit:
# - defaults to 5
# - can be overriden to any number

# 2018 column changes:
# - REFACTOR: compass_freeform => compass_identity
# - NEW: feminism
# - NEW: relationship_type
# - REFACTOR: income => income_currency + income_amount
# - NEW: slang_80k
# - NEW: online_telegram
# - NEW: previous_surveys

from collections import namedtuple
import json

class SurveyField(namedtuple(
        'SurveyField',
        ['key', 'title', 'type', 'limit', 'sort', 'multiple', 'text_tail', 'show', 'shortcuts', 'private', 'extract_other', 'note'],
        defaults=['str', 10, 'top', False, False, 'histogram', {}, False, False, None],
)):
    __slots__ = ()

    def to_dict(self):
        return self._asdict()


class SurveyForm:
    def __init__(self, fields):
        self.fields = fields

    def field_by_key(self, key):
        return next(f for f in self.fields if f.key == key)

    def field_by_title(self, title):
        return next(f for f in self.fields if f.title == title)

    def public_fields(self):
        return [field for field in self.fields if not field.private]

    def to_dict(self):
        return {
            field.key: field.to_dict()
            for field in self.public_fields()
        }

METADATA = SurveyForm([
    SurveyField(
        key='timestamp',
        title='Timestamp',
        private=True,
    ),
    SurveyField(
        key='privacy',
        title='Приватность',
        private=True,
    ),
    SurveyField(
        key='country',
        title='Страна проживания',
    ),
    SurveyField(
        key='city',
        title='Город',
    ),
    SurveyField(
        key='age',
        title='Возраст',
        type='int',
        limit=1000,
        sort='numerical',
    ),
    SurveyField(
        key='gender',
        title='Пол/гендер',
        extract_other=True,
    ),
    SurveyField(
        key='education',
        title='Образование',
        limit=1000,
        note='"Неоконченное" включает как продолжающийся процесс, так и прерванный в прошлом.',
    ),
    SurveyField(
        key='higher_education',
        title='Высшая степень образования / академической степени',
    ),
    SurveyField(
        key='speciality',
        title='Специальность в высшем образовании',
        multiple=True,
    ),
    SurveyField(
        key='compass_economics',
        title='Экономическая шкала',
        type='int',
        limit=1000,
        sort='numerical',
        note='См. https://www.politicalcompass.org/analysis2 для пояснений по этому и следующему вопросу.',
    ),
    SurveyField(
        key='compass_social',
        title='Социальная шкала',
        type='int',
        limit=1000,
        sort='numerical',
        note='См. https://www.politicalcompass.org/analysis2 для пояснений по этому и следующему вопросу.',
    ),
    SurveyField(
        key='compass_identity',
        title='Выберите пункты, к которым вы готовы себя отнести',
        multiple=True,
        extract_other=True,
    ),
    SurveyField(
        key='iq',
        title='IQ',
        type='int',
        limit=1000,
        sort='last_int',
        note='Ваша честная оценка по итогам тестов, если вы проходили их в прошлом.',
    ),
    SurveyField(
        key='english',
        title='Английский язык',
    ),
    SurveyField(
        key='english_cefr',
        title='Английский язык по шкале CEFR',
        limit=1000,
        sort='lexical',
        note='См. https://en.wikipedia.org/wiki/Common_European_Framework_of_Reference_for_Languages',
    ),
    SurveyField(
        key='religion',
        title='Отношение к религии',
        extract_other=True,
    ),
    SurveyField(
        key='feminism',
        title='Отношение к феминизму',
        type='int',
        sort='numerical',
    ),
    SurveyField(
        key='hand',
        title='Активная рука',
    ),
    SurveyField(
        key='family',
        title='Семейное положение',
        extract_other=True,
    ),
    SurveyField(
        key='relationship_type',
        title='Предпочитаемый тип отношений',
        extract_other=True,
    ),
    SurveyField(
        key='kids',
        title='Количество детей',
        type='int',
        sort='numerical',
    ),
    SurveyField(
        key='kids_preference',
        title='Предпочтения про количество детей',
    ),
    SurveyField(
        key='income_currency',
        title='Доход - основная валюта',
    ),
    SurveyField(
        key='income_amount',
        title='Уровень дохода в выбранной валюте, в месяц',
        type='int',
        sort='last_int',
    ),
    SurveyField(
        key='job',
        title='Текущий род занятий',
        multiple=True,
    ),
    SurveyField(
        key='hobby',
        title='Хобби',
        multiple=True,
    ),
    SurveyField(
        key='happiness',
        title='Насколько вы довольны своей жизнью?',
        type='int',
        limit=1000,
        sort='numerical',
    ),
    SurveyField(
        key='psy_depression',
        title='Психические расстройства [Депрессия]',
    ),
    SurveyField(
        key='psy_ocd',
        title='Психические расстройства [Обсессивно-компульсивное расстройство]',
    ),
    SurveyField(
        key='psy_autism',
        title='Психические расстройства [Расстройства аутистического спектра]',
    ),
    SurveyField(
        key='psy_bipolar',
        title='Психические расстройства [Биполярное расстройство]',
    ),
    SurveyField(
        key='psy_anxiety',
        title='Психические расстройства [Тревожный невроз]',
    ),
    SurveyField(
        key='psy_borderline',
        title='Психические расстройства [Пограничное расстройство личности]',
    ),
    SurveyField(
        key='psy_schizo',
        title='Психические расстройства [Шизофрения]',
    ),
    SurveyField(
        key='referer',
        title='Откуда вы узнали про LessWrong?',
        shortcuts={
            'Через книгу "Гарри Поттер и методы рационального мышления"': 'Через ГПиМРМ',
        },
        extract_other=True,
    ),
    SurveyField(
        key='identity',
        title='Насколько вы самоидентифицируетесь как рационалист?',
        type='int',
        sort='numerical',
        note='(то есть как человек, разделяющий рациональное мировоззрение, не обязательно как человек, который сам по себе идеально рационален)',
    ),
    SurveyField(
        key='sequences_knows',
        title='Знаете ли вы, что такое цепочки (sequences) Элиезера Юдковского?',
    ),
    SurveyField(
        key='sequences_language',
        title='На каком языке вы преимущественно читали цепочки?',
        extract_other=True,
    ),
    SurveyField(
        key='sequences_russian',
        title='Какой, приблизительно, процент переводов цепочек (на русском языке) вы читали?',
        sort='numerical',
    ),
    SurveyField(
        key='sequences_english',
        title='Какой, приблизительно, процент оригиналов цепочек или книги Rationality: From AI to Zombies (на английском языке) вы читали?',
        sort='numerical',
    ),
    SurveyField(
        key='slang_bias',
        title='Знакомство с терминологией и культурой [Когнитивное искажение]',
    ),
    SurveyField(
        key='slang_bayes',
        title='Знакомство с терминологией и культурой [Теорема Байеса]',
    ),
    SurveyField(
        key='slang_epistemology',
        title='Знакомство с терминологией и культурой [Эпистемология]',
    ),
    SurveyField(
        key='slang_two_systems',
        title='Знакомство с терминологией и культурой [Две системы мышления]',
    ),
    SurveyField(
        key='slang_solstice',
        title='Знакомство с терминологией и культурой [Rational Solstice]',
    ),
    SurveyField(
        key='slang_fallacymania',
        title='Знакомство с терминологией и культурой [Fallacymania]',
    ),
    SurveyField(
        key='slang_ea',
        title='Знакомство с терминологией и культурой [Эффективный альтруизм]',
    ),
    SurveyField(
        key='slang_80k',
        title='Знакомство с терминологией и культурой [80000 часов]',
    ),
    SurveyField(
        key='slang_miri',
        title='Знакомство с терминологией и культурой [MIRI]',
    ),
    SurveyField(
        key='slang_ssc',
        title='Знакомство с терминологией и культурой [Slate Star Codex]',
    ),
    SurveyField(
        key='slang_hpmor',
        title='Знакомство с терминологией и культурой [Гарри Поттер и методы рационального мышления]',
    ),
    SurveyField(
        key='slang_cfar',
        title='Знакомство с терминологией и культурой [CFAR]',
    ),
    SurveyField(
        key='slang_kocherga',
        title='Знакомство с терминологией и культурой [Кочерга (антикафе)]',
    ),
    SurveyField(
        key='slang_transhumanism',
        title='Знакомство с терминологией и культурой [Трансгуманизм]',
    ),
    SurveyField(
        key='slang_rtd',
        title='Знакомство с терминологией и культурой [РТД (движение)]',
    ),
    SurveyField(
        key='online_lwru',
        title='Онлайн-сообщества [Форум lesswrong.ru]',
        limit=1000,
    ),
    SurveyField(
        key='online_slack',
        title='Онлайн-сообщества [Slack-чат lesswrong.ru]',
        limit=1000,
    ),
    SurveyField(
        key='online_vk',
        title='Онлайн-сообщества [Вк-паблик "LessWrong по-русски"]',
        limit=1000,
    ),
    SurveyField(
        key='online_lwcom',
        title='Онлайн-сообщества [lesswrong.com]',
        limit=1000,
    ),
    SurveyField(
        key='online_diaspora',
        title='Онлайн-сообщества [Прочая англоязычная блогосфера (slatestarcodex и его блогролл)]',
        limit=1000,
    ),
    SurveyField(
        key='online_reddit',
        title='Онлайн-сообщества [Reddit (/r/slatestarcodex, /r/rational)]',
        limit=1000,
    ),
    SurveyField(
        key='online_telegram',
        title='Онлайн-сообщества [Telegram-чаты]',
        limit=1000,
    ),
    SurveyField(
        key='online_other',
        title='В каких еще околорациональных сообществах в онлайне вы участвуете (в качестве читателя, комментатора или писателя)?',
        show='text',
    ),
    SurveyField(
        key='meetups',
        title='Участие в офлайновых встречах',
    ),
    SurveyField(
        key='meetups_city',
        title='Если вы были на встречах (часто или один раз), в каком городе это было?',
        extract_other=True,
    ),
    SurveyField(
        key='meetups_why',
        title='Если вы ходите или ходили на встречи, то почему?',
        limit=1000,
        multiple=True,
        text_tail=True,
        shortcuts={
            'Попрактиковаться в чтении докладов и организационной деятельности': 'Попрактиковаться в чтении докладов и орг.деятельности',
        },
        extract_other=True,
    ),
    SurveyField(
        key='meetups_why_not',
        title='Если вы не ходите на встречи, то почему?',
        limit=1000,
        multiple=True,
        text_tail=True,
        extract_other=True,
    ),
    SurveyField(
        key='previous_surveys',
        title='Участие в прошлых опросах',
    ),
    SurveyField(
        key='comments',
        title='Любые комментарии, которые вам хотелось бы добавить',
        show='text',
    ),
    SurveyField(
        key='comments2',
        title='Любые комментарии, которые вам хотелось бы добавить.1',
        private=True,
    ),
    SurveyField(
        key='contacts',
        title='E-mail, адрес в соцсетях, ник в slack-чате, прочие опознавательные признаки',
        private=True,
    ),
    SurveyField(
        key='source',
        title='Где вы увидели ссылку на этот опрос?',
    ),
])
