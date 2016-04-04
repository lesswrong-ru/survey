import d3 from 'd3';
import React from 'react';
import ReactDOM from 'react-dom';

import {data, structure, total} from './data';

var groupItems = function (src, context) {
  var items = src.values;
  var grouped = {};
  var empty = 0;
  var limit = context.limit || src.limit;
  items.forEach(
    item => {
      if (item === null) {
        empty += 1;
        return;
      }

      if (!grouped[item]) {
        grouped[item] = 0;
      }
      grouped[item] += 1;
    }
  );

  var extractInt = str => parseInt(str.match(/\d+/g).slice(-1)[0]);

  var sorters = {
    top: (a, b) => grouped[b] - grouped[a],
    numerical: (a, b) => parseInt(a) - parseInt(b),
    lexical: (a, b) => b < a,
    last_int: (a, b) => extractInt(a) - extractInt(b),
  };

  var sortedItems = Object.keys(grouped).sort(function (a, b) {
    if (src.custom_sort) {
      var a_i = src.custom_sort.indexOf(a);
      var b_i = src.custom_sort.indexOf(b);
      if (a_i >= 0 && b_i >= 0) {
        return a_i - b_i;
      }
      else if (a_i < 0 && b_i >= 0) {
        return 1;
      }
      else if (a_i >= 0 && b_i < 0) {
        return -1;
      }
    }
    return sorters[src.sort](a, b);
  });

  var data = sortedItems.map(
    (item, i) => {
      return {
        count: grouped[item],
        name: item,
        id: i,
      };
    }
  );

  if (data.length > limit) {
    // collapse tail into "other"
    var tail = data.slice(limit);
    var collapsed = {
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

var drawData = function(src, target, context, initial=false) {
  var data = groupItems(src, context);

  var margin = {top: 10, bottom: 0, left: 360, right: 20};
  var width = 860;
  var itemHeight = 20;
  var height = itemHeight * data.length + margin.top + margin.bottom;
  var itemMargin = 2;

  var x = d3.scale.linear()
    .domain([
      0, total
    ])
    .range([0, width - margin.left - margin.right]);

  var y = d3.scale.linear()
    .domain([0, data.length])
    .range([0, height - margin.top - margin.bottom]);

  var svg;
  if (initial) {
    svg = d3.select(target).append('svg')
        .attr('class', 'svg-main')
        .attr('width', width)
        .attr('height', height)
      .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  }
  else {
    svg = d3.select(target).select('svg')
        .attr('height', height)
      .select('g');
  }

  var item = svg.selectAll('.item')
    .data(data, d => d.name);

  item.exit().remove(); // not really necessary

  var itemEnter = item.enter().append('g')
      .attr('class', 'item');

  var rect = itemEnter.append('rect')
      .attr('width', function(d) { return x(d.count) })
      .attr('height', itemHeight - itemMargin * 2);

  itemEnter.append('text')
      .attr('class', 'number');

  itemEnter.append('text')
      .attr('class', 'percent-number');

  itemEnter.append('text')
      .attr('dy', itemHeight / 2 + itemMargin)
      .attr('x', -3)
      .attr('class', 'label')
      .text(function(d) {
        return src.shortcuts[d.name] || d.name
      });

  item.transition()
      .attr('transform', function(d, i) { return 'translate(0,' + (y(i) + itemMargin) + ')' })
    .select('rect')
      .attr('width', function(d) { return x(d.count) });
  item.select('.number')
      .attr('dy', itemHeight / 2 + itemMargin)
      .attr('x', function(d) { return x(d.count) + 3 })
      .text(function(d) { return d.count });
  item.select('.percent-number')
      .attr('dy', itemHeight / 2 + itemMargin)
      .attr('x', function(d) { return x(d.count) - 3 })
      .text(function(d) {
        if (x(d.count) <= 20) {
          return ''; // the bar is too short, the number won't fit
        }
        if (src.multiple && d.id == 'tail') {
          return ''; // percentage is meaningless for tails
        }
        return Math.round(100 * (d.count / total)) + '%'
      });

  itemEnter.filter(d => d.special)
    .attr('class', function(d) { return d3.select(this).attr('class') + ' item__' + d.special });

  itemEnter.filter(d => d.id == 'tail')
    .on('click', context.expandTail);
};

const Block = React.createClass({
  render () {
    return (
      <section id={'question-' + this.props.name} className='block'>
        {this.renderTitle()}
        {
          this.props.data.note
          ? <small className='note'>{this.props.data.note}</small>
          : null
        }
        {
          this.props.data.multiple
          ? <small className='note'>(Этот вопрос допускал несколько ответов, сумма может превышать 100%.)</small>
          : null
        }
        <div className='d3'></div>
        {this.renderOther()}
        {this.renderText()}
      </section>
    );
  },

  renderTitleSimple () {
    return <h3>{this.props.data.title}</h3>;
  },

  renderTitle () {
    if (!this.props.name.match(/^(psy|slang|online)_/)) {
      return this.renderTitleSimple();
    }

    var match = this.props.data.title.match(/^(.*) \[(.*)\]$/);
    if (!match) {
      return this.renderTitleSimple();
    }
    var cat_title = match[1];
    var item_title = match[2];
    return (
      <h3 className='dual'>
        <span className='dual--cat'>{cat_title}:</span>
        <br/>
        <span className='dual--item'>{item_title}</span>
      </h3>
    );
  },

  renderOther () {
    if (!this.props.data.other_values) {
      return;
    }
    if (this.state.showOther) {
      return (
        <div className='text-data'>
        {
          this.props.data.other_values.map(
            (value, i) => (<div className='text-data--item' key={i}>{value}</div>)
          )
        }
        </div>
      );
    }
    else {
      return (
        <div className='text-data'>
          <a className='show-other-link' href='#' onClick={this.showOther}>Показать другие ответы ({this.props.data.other_values.length})</a>
        </div>
      );
    }
  },

  renderText () {
    if (this.props.data.show != 'text') {
      return;
    }

    return (
      <div className='text-data'>
      {
        this.props.data.values.map(
          (value, i) => (<div className='text-data--item' key={i}>{value}</div>)
        )
      }
      </div>
    );
  },

  showOther (e) {
    e.preventDefault();
    this.setState({
      showOther: true,
    });
  },

  getInitialState () {
    return {
      limit: null,
      showOther: false,
    };
  },

  expandTail () {
    var expandCount = 10;
    if (this.props.name == 'hobby') {
      expandCount = 30;
    }
    this.setState({
      limit: (this.state.limit || this.props.data.limit) + expandCount,
    });
  },

  renderD3 (initial) {
    if (this.props.data.show == 'histogram') {
      drawData(
        this.props.data,
        ReactDOM.findDOMNode(this).getElementsByClassName('d3')[0],
        {
          expandTail: this.expandTail,
          limit: this.state.limit,
        },
        initial
      );
    }
    else if (this.props.data.show == 'text') {
      var x = 5;
      // do nothing
    }
    else {
      console.log('WARNING: unknown show type');
    }
  },

  componentDidMount () { this.renderD3(true) },
  componentDidUpdate () { this.renderD3(false) },
});

const Group = function (props) {
  return (
    <div>
      <hr/>
      <h2 id={'group-' + props.id}>{props.title}</h2>
      {
        React.Children.map(
          props.children,
          child => child
        )
      }
    </div>
  );
};

const Menu = React.createClass({
  render () {
    return (
      <nav className='menu'>
        <ul className='menu--outer'>
        {
          structure.map(
            (group, i) => (
              <li key={i}>
                <a href={'#group-' + i}>{group.title}</a>
                <ul className='menu--inner'>
                  {
                    group.columns.map(
                      column => (
                        <li key={column}>
                          <a href={'#question-' + column} key={column}>{data[column].title}</a>
                        </li>
                      )
                    )
                  }
                </ul>
              </li>
            )
          )
        }
        </ul>
      </nav>
    );
  },
});

const Stats = () => {
  return (
    <div className='stats'>
      Всего: {total} участника
    </div>
  );
};

const Main = React.createClass({
  render () {
    return (
      <div>
        <h1>Итоги переписи русскоговорящего LessWrong 2015</h1>
        <div id='intro'>
        <p>
        Перепись русскоговорящего LessWrong проходила в конце декабря 2015.
        </p>
        <p>
        То, как выглядел оригинальный опрос, можно посмотреть <a href='original-survey.pdf'>тут (pdf)</a>.
        </p>
        <p>
        Некоторые подробности об том, как обрабатывались результаты, можно узнать <a href='#outro'>в конце этой страницы</a>.
        </p>
        <Stats />
        </div>
        <Menu />
        {
          structure.map(
            (group, i) => (
              <Group title={group.title} id={i} key={i}>
                {
                  group.columns.map(
                    (column) =>
                    <Block name={column} data={data[column]} key={column} />
                  )
                }
              </Group>
            )
          )
        }
        <div id='outro'>
          <h4>Подробности об обработке данных и технологиях</h4>
          <div>
          Перепись продолжалась с 22 декабря 2015 по 5 января 2016.<br/>
          Ссылка на опрос была опубликована:
          <ul>
          <li>В <a href='https://lesswrong-ru.hackpad.com/--UaFxYxI8EMJ'>slack-чате</a></li>
          <li>На <a href='http://lesswrong.ru/forum/index.php/topic,775.msg25554.html'>форуме</a></li>
          <li>В <a href='https://www.facebook.com/groups/lesswrong.moscow/permalink/1666164413638027/'>facebook-группе московского lesswrong'а</a></li>
          </ul>
          </div>
          <div>***</div>
          <div>
          Форму заполнили <strong>313</strong> раз. В итоговые данные вошли 304 анкет, остальные 9 я отсеял по следующим причинам:
          <ul>
          <li>анкету Пион, которая тестировала форму до её финальной версии, и заполнила потом ещё раз</li>
          <li>анкету с приватным комментарием "заполнил дважды"</li>
          <li>анкету с 6 заполненными полями, совпадающую со следующей (20 минут спустя) по всем полям</li>
          <li>анкету с заполненным только лишь политическим компасом (два числа и идентичность "трансгцма") - соответствия не нашёл</li>
          <li>две из трёх недозаполненные копии анкеты с профессией "соммелье"</li>
          <li>и три анкеты, из Казани, Минска и Твери, которые я опознал, сравнивая анкеты с большими последовательностями незаполенных полей и похожим временем, либо с совпадающими полями</li>
          </ul>
          </div>
          <div>***</div>
          <div>
          В первой версии анкеты, которую я распространял, не было чекбокса <i>"Не публиковать мою полную анкету"</i>, но была следующая пометка:<br/><i>Все ответы по умолчанию будут опубликованы (полные анкеты, не только статистика по каждому пункту), кроме последней секции, "приватная информация".</i>
          </div><div>
          Я добавил opt-out чекбокс на следующий день после того, как опубликовал анкету. Его отметили примерно 35% участников, и я решил на всякий случай не публиковать полные данные вообще.
          </div><div>
          (Зачем нужна опция про приватность? Учитывая количество вопросов, некоторых людей можно было бы однозначно опознать по их демографическим данным.)
          </div><div>
          Если бы я делал этот опрос заново, я бы сделал opt-in чекбокс, и сейчас считаю, что отнёсся к этому вопросу недостаточно аккуратно. Если вы хотите узнать какие-то интересные корреляции между двумя вопросами в анкете, напишите мне (<a href='http://vk.com/berekuk'>vk</a>, <a href='mailto:me@berekuk.ru'>email</a>), посчитаем вместе.
          </div><div>
          Доступ к полным ответам на анкету был:
          <ul>
          <li>у меня (Вячеслав Матюхин, организатор опроса, организатор московских lesswrong-встреч, основатель Кочерги)</li>
          <li>у Пион Гайбарян (организатор московских lesswrong-встреч, основатель Кочерги, помогала нормализовывать ответы на текстовые вопросы)</li>
          <li>у компании Google</li>
          </ul>
          </div>
          <div>***</div>
          <div>
          Кстати, если вы по ошибке добавили в поле "текстовый отзыв" то, что хотели добавить в поле "текстовый отзыв" в последней, приватной секции, свяжитесь со мной (<a href='http://vk.com/berekuk'>vk</a>, <a href='mailto:me@berekuk.ru'>email</a>)
          </div>
          <div>***</div>
          <div>
          Вопросы про психическое расстройство вызвали несколько негативных отзывов (в почте, в личной переписке).
          </div><div>
          Я не знаю, что я мог бы сделать иначе, потому что пометка <i>"Все вопросы необязательны. Если формулировка вопроса вызывает у вас замешательство, либо нежелание раскрывать информацию по этому пункту, то пропускайте вопрос."</i> в начале анкеты, и <i>"в очередной раз напоминаем, что все вопросы необязательны"</i> в секции про психические расстройства были.
          </div>
          <div>***</div>
          <div>
          Ответы на вопросы "Образование", "Текущий род занятий" и "Хобби" мы нормализовывали вручную.
          </div><div>
          Ответы на эти вопросы и на вопросы "Если вы ходите [или не ходите] на встречи, то почему?" допускали несколько вариантов, так что суммарное количество ответов превышает число участников.
          </div><div>
          Ответы на вопрос про IQ округлён до десятков, на вопрос про доход - до десятков тысяч рублей.
          </div>
          <div>***</div>
          <div>
          Страница результатов написана на <a href='https://d3js.org/'>D3.js</a> и <a href='https://facebook.github.io/react/'>React</a>.
          </div><div>
          Исходный код <a href='https://github.com/lesswrong-ru/survey'>доступен на Github'е</a>.
          </div><div>
          Данные, из которых верстается страница итогов переписи, лежат в <a href='data.js'>отдельном файле</a>. Ответы отсортированы по каждому вопросу отдельно для сохранения приватности участников.
          </div>
        </div>
      </div>
    );
  }
});

ReactDOM.render(<Main/>, document.getElementById('main'));
