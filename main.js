import d3 from 'd3';
import React from 'react';
import ReactDOM from 'react-dom';

import * as GlobalData from './data';

const groupItems = (src, context) => {
  const grouped = {};
  let empty = 0;
  const limit = context.limit || src.limit;
  src.values.forEach(value => {
    if (value.value === null) {
      empty = value.count;
      return;
    } else {
      grouped[value.value] = value.count;
    }
  });

  const extractInt = str => parseInt(str.match(/\d+/g).slice(-1)[0]);

  const sorters = {
    top: (a, b) => grouped[b] - grouped[a],
    numerical: (a, b) => parseInt(a) - parseInt(b),
    lexical: (a, b) => b < a,
    last_int: (a, b) => extractInt(a) - extractInt(b),
  };

  const sortedItems = Object.keys(grouped).sort((a, b) => {
    if (src.custom_sort) {
      const a_i = src.custom_sort.indexOf(a);
      const b_i = src.custom_sort.indexOf(b);
      if (a_i >= 0 && b_i >= 0) {
        return a_i - b_i;
      } else if (a_i < 0 && b_i >= 0) {
        return 1;
      } else if (a_i >= 0 && b_i < 0) {
        return -1;
      }
    }
    return sorters[src.sort](a, b);
  });

  let data = sortedItems.map((item, i) => {
    return {
      count: grouped[item],
      name: item,
      id: i,
    };
  });

  if (data.length > limit) {
    // collapse tail into "other"
    const tail = data.slice(limit);
    const collapsed = {
      id: 'tail',
      special: 'tail',
      name: 'Прочее',
      count: tail.map(item => item.count).reduce((prev, cur) => prev + cur),
    };

    data = data.slice(0, limit);
    data.push(collapsed);
  }

  data.push({
    count: empty,
    name: 'Не указано',
    id: 'empty',
    special: 'empty',
  });

  return data;
};

const drawData = (src, target, context, initial = false) => {
  const data = groupItems(src, context);

  const margin = { top: 10, bottom: 0, left: 360, right: 20 };
  const width = 860;
  const itemHeight = 20;
  const height = itemHeight * data.length + margin.top + margin.bottom;
  const itemMargin = 2;

  const x = d3.scale
    .linear()
    .domain([0, GlobalData.total])
    .range([0, width - margin.left - margin.right]);

  const y = d3.scale
    .linear()
    .domain([0, data.length])
    .range([0, height - margin.top - margin.bottom]);

  let svg;
  if (initial) {
    svg = d3
      .select(target)
      .append('svg')
      .attr('class', 'svg-main')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  } else {
    svg = d3
      .select(target)
      .select('svg')
      .attr('height', height)
      .select('g');
  }

  const item = svg.selectAll('.item').data(data, d => d.name);

  item.exit().remove(); // not really necessary

  const itemEnter = item
    .enter()
    .append('g')
    .attr('class', 'item');

  const rect = itemEnter
    .append('rect')
    .attr('width', d => x(d.count))
    .attr('height', itemHeight - itemMargin * 2);

  itemEnter.append('text').attr('class', 'number');

  itemEnter.append('text').attr('class', 'percent-number');

  itemEnter
    .append('text')
    .attr('dy', itemHeight / 2 + itemMargin)
    .attr('x', -3)
    .attr('class', 'label')
    .text(d => src.shortcuts[d.name] || d.name);

  item
    .transition()
    .attr('transform', (d, i) => `translate(0,${y(i) + itemMargin})`)
    .select('rect')
    .attr('width', d => x(d.count));

  item
    .select('.number')
    .attr('dy', itemHeight / 2 + itemMargin)
    .attr('x', d => x(d.count) + 3)
    .text(d => d.count);

  item
    .select('.percent-number')
    .attr('dy', itemHeight / 2 + itemMargin)
    .attr('x', d => x(d.count) - 3)
    .text(d => {
      if (x(d.count) <= 20) {
        return ''; // the bar is too short, the number won't fit
      }
      if (src.multiple && d.id === 'tail') {
        return ''; // percentage is meaningless for tails
      }
      return Math.round(100 * (d.count / GlobalData.total)) + '%';
    });

  itemEnter.filter(d => d.special).attr('class', function(d) {
    return d3.select(this).attr('class') + ' item__' + d.special;
  });

  itemEnter.filter(d => d.id === 'tail').on('click', context.expandTail);
};

const Note = ({ children }) => <small className="note">{children}</small>;

const MultipleNote = () => (
  <Note>
    (Этот вопрос допускал несколько ответов, сумма может превышать 100%.)
  </Note>
);

class Block extends React.Component {
  state = {
    limit: null,
    showOther: false,
  };

  render() {
    return (
      <section id={'question-' + this.props.name} className="block">
        {this.renderTitle()}
        {this.props.data.note && <Note>{this.props.data.note}</Note>}
        {this.props.data.multiple && <MultipleNote />}
        <div className="d3" />
        {this.renderOther()}
        {this.renderText()}
      </section>
    );
  }

  renderTitleSimple() {
    return <h3>{this.props.data.title}</h3>;
  }

  renderTitle() {
    if (!this.props.name.match(/^(psy|slang|online)_/)) {
      return this.renderTitleSimple();
    }

    const match = this.props.data.title.match(/^(.*) \[(.*)\]$/);
    if (!match) {
      return this.renderTitleSimple();
    }
    const cat_title = match[1];
    const item_title = match[2];
    return (
      <h3 className="dual">
        <span className="dual--cat">{cat_title}:</span>
        <br />
        <span className="dual--item">{item_title}</span>
      </h3>
    );
  }

  renderOther() {
    if (!this.props.data.other_values) {
      return;
    }
    if (this.state.showOther) {
      return (
        <div className="text-data">
          {this.props.data.other_values.map((value, i) => (
            <div className="text-data--item" key={i}>
              {value}
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div className="text-data">
          <a className="show-other-link" href="#" onClick={this.showOther}>
            Показать другие ответы ({this.props.data.other_values.length})
          </a>
        </div>
      );
    }
  }

  renderText() {
    if (this.props.data.show != 'text') {
      return;
    }

    return (
      <div className="text-data">
        {this.props.data.values.map((value, i) => (
          <div className="text-data--item" key={i}>
            {value.value}
          </div>
        ))}
      </div>
    );
  }

  showOther = e => {
    e.preventDefault();
    this.setState({
      showOther: true,
    });
  };

  expandTail = () => {
    let expandCount = 10;
    if (this.props.name === 'hobby') {
      expandCount = 30;
    }
    this.setState({
      limit: (this.state.limit || this.props.data.limit) + expandCount,
    });
  };

  renderD3(initial) {
    if (this.props.data.show === 'histogram') {
      drawData(
        this.props.data,
        ReactDOM.findDOMNode(this).getElementsByClassName('d3')[0],
        {
          expandTail: this.expandTail,
          limit: this.state.limit,
        },
        initial
      );
    } else if (this.props.data.show === 'text') {
      const x = 5;
      // do nothing
    } else {
      console.log('WARNING: unknown show type');
    }
  }

  componentDidMount() {
    this.renderD3(true);
  }
  componentDidUpdate() {
    this.renderD3(false);
  }
}

const Group = props => {
  return (
    <div>
      <hr />
      <h2 id={'group-' + props.id}>{props.title}</h2>
      {React.Children.map(props.children, child => child)}
    </div>
  );
};

const Menu = () => (
  <nav className="menu">
    <ul className="menu--outer">
      {GlobalData.structure.map((group, i) => (
        <li key={i}>
          <a href={'#group-' + i}>{group.title}</a>
          <ul className="menu--inner">
            {group.columns.map(column => (
              <li key={column}>
                <a href={'#question-' + column}>
                  {GlobalData.data[column].title}
                </a>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  </nav>
);

const Stats = () => {
  return <div className="stats">Всего: {GlobalData.total} участников.</div>;
};

const AllGroups = () =>
  GlobalData.structure.map((group, i) => (
    <Group title={group.title} id={i} key={i}>
      {group.columns.map(column => (
        <Block name={column} data={GlobalData.data[column]} key={column} />
      ))}
    </Group>
  ));

class Main extends React.Component {
  render() {
    return (
      <div>
        <h1>Итоги переписи русскоговорящего LessWrong 2018</h1>
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
        <Menu />
        <AllGroups />
        <div id="outro">
          <h4>Подробности об обработке данных и технологиях</h4>
          <div>
            Перепись продолжалась с 12 декабря 2018 по 31 декабря 2018.<br />
            Ссылка на опрос была опубликована, в частности:
            <ul>
              <li>
                В <a href="https://lesswrong.ru/slack">slack-чате</a>
              </li>
              <li>
                В вк-группе <a href="https://vk.com/less_wrong">LessWrong</a>
              </li>
              <li>
                В telegram-канале{' '}
                <a href="https://t.me/lesswrong_ru_news">
                  Новости сообщества LessWrong
                </a>
              </li>
              <li>
                На{' '}
                <a href="https://lesswrong.ru/forum/index.php?topic=1239.0">
                  форуме LessWrong.ru
                </a>
              </li>
              <li>
                В{' '}
                <a href="https://www.facebook.com/groups/lesswrong.moscow/permalink/2208259519428511/">
                  facebook-группе московского lesswrong'а
                </a>
              </li>
            </ul>
          </div>
          <div>***</div>
          <div>
            Форму заполнили <strong>727</strong> раз. В итоговые данные вошли
            725 анкет, ещё 2 отсеялись как очевидные дубли (полностью или почти
            полностью совпадающие поля, либо подписанные одинаковым именем, либо
            отправленные несколько раз за несколько секунд).
          </div>
          <div>***</div>
          <div>
            Участники опроса могли отметить чекбокс "Разрешаю опубликовать
            полные данные моей анкеты". Его отметили 340 участников из 725.
          </div>
          <div>
            Прочитать их ответы и скачать их для дальнейшего анализа можно{' '}
            <a href="https://docs.google.com/spreadsheets/d/15vwFS5YyKLmu6UdssK-ph8lSeyXsYvufDpUwXO_AUA0/edit#gid=0">
              по этой ссылке
            </a>.
          </div>
          <div>
            (Зачем нужна опция про приватность? Учитывая количество вопросов,
            некоторых людей можно было бы однозначно опознать по их
            демографическим данным.)
          </div>
          <div>
            Доступ к полным ответам на анкету был:
            <ul>
              <li>
                у меня (<a href="https://berekuk.ru">Вячеслав Матюхин</a>,
                организатор опроса)
              </li>
              <li>у компании Google</li>
            </ul>
          </div>
          <div>***</div>
          <div>
            Некоторые ответы (не очень многие) были нормализованы. Скрипты для
            обработки данных можно увидеть{' '}
            <a href="https://github.com/lesswrong-ru/survey/tree/2018/data">
              тут
            </a>.
          </div>
          <div>
            Ответы на вопрос про IQ округлён до десятков, на вопрос про доход -
            до категорий, которые вы можете видеть выше.
          </div>
          <div>***</div>
          <div>
            Страница результатов написана на{' '}
            <a href="https://d3js.org/">D3.js</a> и{' '}
            <a href="https://reactjs.org/">React</a>.
          </div>
          <div>
            Исходный код{' '}
            <a href="https://github.com/lesswrong-ru/survey">
              доступен на Github'е
            </a>.
          </div>
          <div>
            Данные, из которых верстается страница итогов переписи, лежат в{' '}
            <a href="data.js">отдельном файле</a>. Ответы отсортированы по
            каждому вопросу отдельно для сохранения приватности участников.
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Main />, document.getElementById('main'));
