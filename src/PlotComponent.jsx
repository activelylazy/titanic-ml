import React from 'react';
import fetch from 'node-fetch';
import parse from 'csv-parse/lib/sync';
import $ from 'jquery';
import flot from 'flot-for-node'; // eslint-disable-line no-unused-vars
import symbol from 'flot-for-node/jquery.flot.symbol';

class PlotComponent extends React.Component {
    componentDidMount() {
        fetch('/testdata.txt')
            .then(data => data.text())
            .then(data => this.onData(data))
            .catch(e => console.log(`error reading ${e}`));
        this.renderPlot();
    }
    columnFactory(row) {
        console.log(`columnFactory got row ${JSON.stringify(row)}`);
        return row;
    }
    renderPlot(passData, failData) {
        const chartData = [];
        chartData.push({
            data: passData,
            color: '#00FF00',
            points: {
                show: true,
                symbol: 'circle',
                size: 2,
            },
            lines: {
                show: false,
            },
        });
        chartData.push({
            data: failData,
            color: '#FF0000',
            points: {
                show: true,
                symbol: 'cross',
                size: 2,
            },
            lines: {
                show: false,
            },
        });
        const chartOptions = {};

        this.plot = $.plot(this.refs.plotContainer, chartData, chartOptions);
    }
    onData(text) {
        const csv = parse(text, { columns: this.columnFactory });
        console.log(`got ${JSON.stringify(csv[0])}`);
        const passData = csv
            .filter(row => row.Pass === "1")
            .map(row => [row.Exam1, row.Exam2]);
        const failData = csv
            .filter(row => row.Pass === "0")
            .map(row => [row.Exam1, row.Exam2]);
        this.renderPlot(passData, failData);
    }
    render() {
        return (
            <div className="plotContainer" ref="plotContainer"/>
        )
    }
}

export default PlotComponent;
