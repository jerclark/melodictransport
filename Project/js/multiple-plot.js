/*
 *  Small Multiple Plot - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _years           -- Array desired years for small multiples
 */

MultiplePlot = function(_yearRange, _plotConstructor, _plotId){

  this.yearRange = _yearRange;
  this.plotConstructor = _plotConstructor;
  this.plotId = _plotId;

  var plotOptions = {
    plotClass:"multiple-plot",
    plotId:_plotId,
    rowCount:3,
    colWidth:1
  };
  this._html = _.template($("#multiple-plot-template").text())(plotOptions);

}


MultiplePlot.prototype.html = function(){
  return this._html;
}



MultiplePlot.prototype.plotConstructor = function(){
  return this.plotConstructor;
}


MultiplePlot.prototype.draw = function(){

  for (var i = 0; i <= (this.yearRange[1] - this.yearRange[0]); i++) {
    new this.plotConstructor("#" + this.plotId + "-" + (i + 1), {
      width: 200,
      height: 200,
      margin: {top: 10, bottom: 10, left: 10, right: 10},
      showLabels: false
    });
  }


}
