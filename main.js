import d3 from 'd3';
import React from 'react';
import ReactDOM from 'react-dom';

import {data, columns} from './data';

var width = 600;
var height = 400;

var groupItems = function (items) {
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

  var sortedItems = Object.keys(grouped).sort(
    (a, b) => grouped[b] - grouped[a]
  );

  var data = sortedItems.map(function(item, i) {
    return {
      count: grouped[item],
      name: item,
      id: i,
    };
  });

  if (data.length > 5) {
    // collapse tail into "other"
    var tail = data.slice(5);
    var collapsed = {
      id: 'tail',
      name: 'Прочее',
      count: tail.map(item => item.count).reduce((prev, cur) => prev + cur),
    };

    data = data.slice(0, 5);
    data.push(collapsed);
  }
  console.log(data);

  data.push({
    count: empty,
    name: 'Не указано',
    id: 'empty',
  });


  return data;
};

var drawData = function(items, target) {
  var data = groupItems(items);

  var x = d3.scale.linear()
    .domain([0, data.length])
    .range([0, width]);

  var y = d3.scale.linear()
    .domain([
      0,
      d3.max(data, function(d) { return d.count })
    ])
    .range([0, height - 10]); // leaving an offset for captions

  var container = d3.select(target).append('div')
    .attr('class', 'container');

  var svg = container.append('div')
      .attr('class', 'histogram')
    .append('svg')
      .attr('width', width)
      .attr('height', height)
    .append('g');

  var bar = svg.selectAll('.bar')
    .data(data)
    .enter().append('g')
      .attr('class', 'bar')
      .attr('transform', function(d, i) { return 'translate(' + x(i) + ',' + (height - y(d.count)) + ')' })

  var rect = bar.append('rect')
      .attr('width', function(d, i) { return x(1) - x(0) - 3 })
      .attr('height', function(d) { return y(d.count) });

  bar.append('text')
    .attr('dy', '-0.1em')
    .attr('x', function() { return (x(1) - x(0) - 3) / 2 })
    .text(function(d) { return d.count });

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

  var legend = container.append('div');

  legend.selectAll('.legend-item')
    .data(data)
    .enter().append('div')
      .classed('legend-item', true)
      .attr('data-item', function(d) { return d.id })
      .text(function(d) { return d.name + ': ' + d.count });

};

const Block = React.createClass({
  render () {
    return (
      <section>
        <h3>{this.props.title}</h3>
        <div className='d3-placeholder'></div>
      </section>
    );
  },

  renderD3 () {
    drawData(
      this.props.data,
      ReactDOM.findDOMNode(this)
    );
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
              <Block title={data[column].title} data={data[column].values} />
            )
          }
        </Group>
      </div>
    );
  }
});

ReactDOM.render(<Main/>, document.getElementById('main'));
