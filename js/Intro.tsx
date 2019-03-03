import * as React from 'react';

import * as GlobalData from './data';

const Stats = () => {
  return <div className="stats">Всего: {GlobalData.total} участников.</div>;
};

export default () => (
  <div id="intro">
    <p>Перепись проходила в конце декабря 2018.</p>
    <p>
      То, как выглядел оригинальный опрос, можно посмотреть{' '}
      <a href="original-survey.pdf">тут (pdf)</a>.
    </p>
    <p>
      Некоторые подробности об том, как обрабатывались результаты, можно
      узнать <a href="#outro">в конце этой страницы</a>.
    </p>
    <p>
      Прошлые переписи:{' '}
      <a href="https://lesswrong.ru/survey/2015/">2015</a>,{' '}
  <a href="https://lesswrong.ru/survey/2016/">2016</a>.
    </p>
    <Stats />
  </div>
);
