import React from 'react';
import fetch from 'node-fetch';
import parse from 'csv-parse/lib/sync';
import $ from 'jquery';
import flot from 'flot-for-node'; // eslint-disable-line no-unused-vars
import symbol from 'flot-for-node/jquery.flot.symbol';
import { Matrix } from 'ml-matrix';
import LogisticRegression from 'ml-logistic-regression';

class PlotComponent extends React.Component {
    constructor() {
        super();
        this.state = { };
    }
    componentDidMount() {
        fetch('/titanic.csv')
            .then(data => data.text())
            .then(data => this.onData(data))
            .catch(e => console.log(`error reading ${e}`));
    }
    columnFactory(row) {
        return row;
    }
    renderPlot(passData, failData, weights, dataX) {
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

        // Prepare two series for plotting
        const survivorPlotData = csv
            .filter(row => row.Survived === "1")
            .map(row => [row.Age, row.Pclass]);
        const nonSurvivorPlotData = csv
            .filter(row => row.Survived === "0")
            .map(row => [row.Age, row.Pclass]);

        // Prepare training data
        const x = csv.map(row => [1, row.Age * 1.0, row.Pclass * 1.0]);
        const y = csv.map(row => row.Survived * 1.0);


        const weights = this.calculate(x, y);
        this.renderPlot(
            survivorPlotData,
            nonSurvivorPlotData,
            weights, x);
    }
    calculate(dataX, dataY) {
        // our training set (X,Y)
        var X = new Matrix(dataX.filter((v, index) => index < dataY.length * 0.8));
        var Y = Matrix.columnVector(dataY.filter((v, index) => index < dataY.length * 0.8));

        // the test set (Xtest, Ytest)
        var Xtest = new Matrix(dataX.filter((v, index) => index >= dataY.length * 0.8));
        var Ytest = Matrix.columnVector(dataY.filter((v, index) => index >= dataY.length * 0.8));
        
        // we will train our model
        var logreg = new LogisticRegression({
            numSteps: 1000,
            learningRate: 5e-5
        });
        logreg.train(X,Y);
        
        // we try to predict the test set and the training set
        var trainResults = logreg.predict(X);
        var finalResults = logreg.predict(Xtest);

        var trainCorrect = trainResults.filter((result, index) => result === Y[index][0]).length;
        var correct = finalResults.filter((result, index) => result === Ytest[index][0]).length;
        var correctSurvivors = finalResults.filter((result, index) => result === Ytest[index][0] && result === 1).length;
        var correctNonSurvivors = finalResults.filter((result, index) => result === Ytest[index][0] && result === 0).length;
        var incorrectSurvivors = finalResults.filter((result, index) => result !== Ytest[index][0] && result === 1).length;
        var incorrectNonSurvivors = finalResults.filter((result, index) => result !== Ytest[index][0] && result === 0).length;

        console.log(`training got ${trainCorrect} out of ${trainResults.length}`);
        console.log(`got ${correct} out of ${finalResults.length} == ${Math.round(correct * 100 / finalResults.length)}%`);
        console.log(`correct were ${correctSurvivors} survivors and ${correctNonSurvivors} non-survivors`);
        console.log(`wrong were ${incorrectSurvivors} survivors and ${incorrectNonSurvivors} non-survivors`);

        this.setState({
            trainCorrect,
            trainCount: trainResults.length,
            correct,
            count: finalResults.length,
            correctSurvivors,
            correctNonSurvivors,
            incorrectSurvivors,
            incorrectNonSurvivors,
        });

        const weights = logreg.classifiers[0].weights[0];

        return weights;
    }
    render() {
        return (
            <div>
                <div className="plotContainer" ref="plotContainer"/>
                
                <div className="stats">
                    Training set: {this.state.trainCorrect} out of {this.state.trainCount} correct
                        ({Math.round(this.state.trainCorrect * 100 / this.state.trainCount)} %)<br />
                    Test set: {this.state.correct} out of {this.state.count} correct 
                        ({Math.round(this.state.correct * 100 / this.state.count)} %)<br />
                    Correct were {this.state.correctSurvivors} survivors and {this.state.correctNonSurvivors} non-survivors<br />
                    Wrong were {this.state.incorrectSurvivors} survivors and {this.state.incorrectNonSurvivors} non-survivors
                </div>
            </div>
        )
    }
}

export default PlotComponent;
