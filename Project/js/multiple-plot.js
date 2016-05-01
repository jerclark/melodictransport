/*
 *  Small Multiple Plot - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _years           -- Array desired years for small multiples
 */

MultiplePlot = function(_plotConstructor, _plotId) {
    this.plotConstructor = _plotConstructor;
    this.plotId = _plotId;

    var plotOptions = {
        plotClass: "multiple-plot",
        plotId: _plotId,
        rowCount: 1,
        colCount: 2
    };
    this._html = _.template($("#multiple-plot-template").text())(plotOptions);
}

MultiplePlot.prototype.html = function() {
    return this._html;
}

MultiplePlot.prototype.plotConstructor = function() {
    return this.plotConstructor;
}

MultiplePlot.prototype.draw = function(multiData, chartOptions) {
    var vis = this;
    _.each(multiData, function(data, i) {
        $("#" + vis.plotId + "-" + (i + 1))
            .append("<h3 class='multi-chart-title'>" + data.chartTitle + "</h3>");


        new vis.plotConstructor("#" + vis.plotId + "-" + (i + 1), data.chartData, chartOptions);
    });
}