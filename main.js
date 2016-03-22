import d3 from 'd3';
import React from 'react';
import ReactDOM from 'react-dom';

import {data, structure} from './data';

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

  var sorters = {
    top: (a, b) => grouped[b] - grouped[a],
    numerical: (a, b) => parseInt(a) - parseInt(b),
    lexical: (a, b) => b < a,
  };

  var sortedItems = Object.keys(grouped).sort(sorters[src.sort]);

  var data = sortedItems.map(function(item, i) {
    return {
      count: grouped[item],
      name: item,
      id: i,
    };
  });

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

  var margin = {top: 10, bottom: 10, left: 260, right: 40};
  var width = 860;
  var barHeight = 20;
  var height = barHeight * data.length + margin.top + margin.bottom;
  var barMargin = 2;
  var maxCount = 305;

  var x = d3.scale.linear()
    .domain([
      0, maxCount
      //d3.max(data, function(d) { return d.count })
    ])
    .range([0, width - margin.left - margin.right]);

  var y = d3.scale.linear()
    .domain([0, data.length])
    .range([0, height - margin.top - margin.bottom]);

  var svg;
  if (initial) {
    var container = d3.select(target).append('div')
      .attr('class', 'container');

    svg = container.append('div')
        .attr('class', 'histogram')
        .attr('xmlns:xlink', "http://www.w3.org/1999/xlink")
      .append('svg')
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
  console.log(svg);

  var bar = svg.selectAll('.bar')
    .data(data, d => d.name);

  bar.exit().remove(); // not really necessary

  var barEnter = bar.enter().append('g')
      .attr('class', 'bar');

  var rect = barEnter.append('rect')
      .attr('width', function(d) { return x(d.count) })
      .attr('height', barHeight - barMargin * 2);

  barEnter.append('text')
      .attr('dy', barHeight / 2 + barMargin)
      .attr('x', function(d) { return x(d.count) + 2 })
      .attr('class', 'number');

  barEnter.append('text')
      .attr('dy', barHeight / 2 + barMargin)
      .attr('x', -3)
      .attr('class', 'label')
      .text(function(d) {
        return src.shortcuts[d.name] || d.name
      });

  bar.transition().attr('transform', function(d, i) { return 'translate(0,' + (y(i) + barMargin) + ')' })
  bar.select('.number')
      .text(function(d) { return d.count });

  barEnter.filter(d => d.special)
    .attr('class', function(d) { return d3.select(this).attr('class') + ' bar__' + d.special });

  barEnter.filter(d => d.id == 'tail')
    .on('click', context.expandTail);
};

const Block = React.createClass({
  render () {
    return (
      <section>
        <h3>{this.props.data.title}</h3>
        {this.renderText()}
      </section>
    );
  },

  renderText() {
    if (this.props.data.show != 'text') {
      return;
    }

    return (
      <div className='text-data'>
      {
        this.props.data.values.map(
          value => (<div className='text-data--item'>{value}</div>)
        )
      }
      </div>
    );
  },

  getInitialState () {
    return {
      limit: null,
    };
  },

  expandTail () {
    this.setState({
      limit: (this.state.limit || this.props.data.limit) + 10,
    });
  },

  renderD3 (initial) {
    if (this.props.data.show == 'histogram') {
      drawData(
        this.props.data,
        ReactDOM.findDOMNode(this),
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
      <h2>{props.title}</h2>
      {
        React.Children.map(
          props.children,
          child => child
        )
      }
    </div>
  );
};


const Main = React.createClass({
  render () {
    return (
      <div>
        <h1>Итоги переписи русскоговорящего LessWrong 2015</h1>
        {
          structure.map(
            group => (
              <Group title={group.title}>
                {
                  group.columns.map(
                    (column) =>
                    <Block data={data[column]} key={column} />
                  )
                }
              </Group>
            )
          )
        }
      </div>
    );
  }
});

ReactDOM.render(<Main/>, document.getElementById('main'));
