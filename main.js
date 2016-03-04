import d3 from 'd3';
import React from 'react';
import ReactDOM from 'react-dom';

import {data, columns} from './data';

var groupItems = function (src) {
  var items = src.values;
  var grouped = {};
  var empty = 0;
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

  if (data.length > src.limit) {
    // collapse tail into "other"
    var tail = data.slice(src.limit);
    var collapsed = {
      id: 'tail',
      name: 'Прочее',
      count: tail.map(item => item.count).reduce((prev, cur) => prev + cur),
    };

    data = data.slice(0, src.limit);
    data.push(collapsed);
  }

  data.push({
    count: empty,
    name: 'Не указано',
    id: 'empty',
  });


  return data;
};

var drawData = function(src, target) {
  var data = groupItems(src);

  var margin = {top: 10, bottom: 10, left: 260, right: 40};
  var width = 860;
  var barHeight = 20;
  var height = barHeight * data.length + margin.top + margin.bottom;
  var barMargin = 2;

  var x = d3.scale.linear()
    .domain([
      0,
      d3.max(data, function(d) { return d.count })
    ])
    .range([0, width - margin.left - margin.right]);

  var y = d3.scale.linear()
    .domain([0, data.length])
    .range([0, height - margin.top - margin.bottom]);

  var container = d3.select(target).append('div')
    .attr('class', 'container');

  var svg = container.append('div')
      .attr('class', 'histogram')
    .append('svg')
      .attr('width', width)
      .attr('height', height)
    .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var bar = svg.selectAll('.bar')
    .data(data)
    .enter().append('g')
      .attr('class', 'bar')
      .attr('transform', function(d, i) { return 'translate(0,' + (y(i) + barMargin) + ')' })

  var rect = bar.append('rect')
      .attr('width', function(d) { return x(d.count) })
      .attr('height', barHeight - barMargin * 2);

  bar.append('text')
    .attr('dy', barHeight / 2 + barMargin)
    .attr('x', function(d) { return x(d.count) + 2 })
    .attr('class', 'number')
    .text(function(d) { return d.count });

  bar.append('text')
    .attr('dy', barHeight / 2 + barMargin)
    .attr('x', -3)
    .attr('class', 'label')
    .text(function(d) {
      return src.shortcuts[d.name] || d.name
    });

  rect.on('mouseover', function(d) {
    container.selectAll('.legend-item')
      .classed('legend-item--highlight', false);
    container.selectAll('.legend-item[data-item="' + d.id + '"]')
      .classed('legend-item--highlight', true);
  });
  rect.on('mouseout', function(d) {
    container.selectAll('.legend-item')
      .classed('legend-item--highlight', false);
  });
};

const Block = React.createClass({
  render () {
    return (
      <section>
        <h3>{this.props.data.title}</h3>
        <div className='d3-placeholder'></div>
      </section>
    );
  },

  renderD3 () {
    if (this.props.data.show == 'histogram') {
      drawData(
        this.props.data,
        ReactDOM.findDOMNode(this)
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

  componentDidMount () { this.renderD3() },
  componentDidUpdate () { this.renderD3() },
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
        <Group title='Всё подряд'>
          {
            columns.map(
              (column) =>
              <Block data={data[column]} />
            )
          }
        </Group>
      </div>
    );
  }
});

ReactDOM.render(<Main/>, document.getElementById('main'));
