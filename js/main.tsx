import * as d3 from 'd3';
import React from 'react';
import ReactDOM from 'react-dom';

import * as GlobalData from './data';

import Intro from './Intro';
import Outro from './Outro';

interface GroupedData {
  count: number;
  id: string;
  name: string;
  special?: string;
}

interface Data {
  title: string;
  limit: number;
  values: { value: string; count: number }[];
  custom_sort?: string[];
  sort: string;
  multiple: boolean;
  shortcuts: { [k: string]: string };
  show: string;
  note?: string;
  other_values?: string[];
}

interface Context {
  expandTail: () => void;
  limit?: number;
}

const groupItems = (src: Data, context: Context): GroupedData[] => {
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

  const extractInt = (str: string) => parseInt(str.match(/\d+/g).slice(-1)[0]);

  const sorters = {
    top: (a: string, b: string) => grouped[b] - grouped[a],
    numerical: (a: string, b: string) => parseInt(a) - parseInt(b),
    lexical: (a: string, b: string) => b < a,
    last_int: (a: string, b: string) => extractInt(a) - extractInt(b),
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

  let data: GroupedData[] = sortedItems.map((item, i) => {
    return {
      count: grouped[item],
      name: item,
      id: i.toString(),
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

const drawData = (
  src: Data,
  target: Element,
  context: Context,
  initial = false
) => {
  const data = groupItems(src, context);

  const margin = { top: 10, bottom: 0, left: 360, right: 20 };
  const width = 860;
  const itemHeight = 20;
  const height = itemHeight * data.length + margin.top + margin.bottom;
  const itemMargin = 2;

  const x = d3
    .scaleLinear()
    .domain([0, GlobalData.total])
    .range([0, width - margin.left - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([0, data.length])
    .range([0, height - margin.top - margin.bottom]);

  let svg = d3.select(target);
  if (initial) {
    svg = svg
      .append('svg')
      .attr('class', 'svg-main')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  } else {
    svg = svg
      .select('svg')
      .attr('height', height)
      .select('g');
  }

  let item = (svg.selectAll('.item') as d3.Selection<
    SVGGElement,
    GroupedData,
    Element,
    undefined
  >).data(data, d => (d ? d.name : this.id));

  item.exit().remove(); // not really necessary

  const itemEnter = item
    .enter()
    .append('g')
    .attr('class', 'item');

  itemEnter
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

  const itemMerge = itemEnter.merge(item);
  itemMerge
    .transition()
    .attr('transform', (_, i) => `translate(0,${y(i) + itemMargin})`)
    .select('rect')
    .attr('width', d => x(d.count));

  itemMerge
    .select('.number')
    .attr('dy', itemHeight / 2 + itemMargin)
    .attr('x', d => x(d.count) + 3)
    .text(d => d.count);

  itemMerge
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

  itemEnter.filter(d => !!d.special).attr('class', function(d) {
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

interface BlockProps {
  name: string;
  data: Data;
}

class Block extends React.Component<BlockProps> {
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

  showOther = (e: React.MouseEvent) => {
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

  renderD3(initial: boolean) {
    if (this.props.data.show === 'histogram') {
      drawData(
        this.props.data,
        (ReactDOM.findDOMNode(this) as Element).getElementsByClassName('d3')[0],
        {
          expandTail: this.expandTail,
          limit: this.state.limit,
        },
        initial
      );
    } else if (this.props.data.show === 'text') {
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

const Group = (props: {
  id: number;
  title: string;
  children: React.ReactNode;
}) => {
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

const AllGroups = () => (
  <>
    {GlobalData.structure.map((group, i) => (
      <Group title={group.title} id={i} key={i}>
        {group.columns.map(column => (
          <Block name={column} data={GlobalData.data[column]} key={column} />
        ))}
      </Group>
    ))}
  </>
);

class Main extends React.Component {
  render() {
    return (
      <div>
        <h1>Итоги переписи русскоговорящего LessWrong 2018</h1>
        <Intro />
        <Menu />
        <AllGroups />
        <Outro />
      </div>
    );
  }
}

ReactDOM.render(<Main />, document.getElementById('main'));
