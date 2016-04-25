TreePlot = function(_parentElement, _options) {
  var vis = this;
  vis.parentElement = _parentElement;
  vis.demoPicker = new DemographicPicker("tree-demo-picker");
  $(_parentElement).append(this.demoPicker.html());
  vis.charPicker = new CharacteristicPicker("tree-char-picker", $("#tree-demo-picker").val());
  $("#vis-tree").append(this.charPicker.html());
  $("#tree-demo-picker").on("change", function(e){
    vis.charPicker.updatePicker($(this).val());
    $("#tree-char-picker").html(vis.charPicker.html());
  });
  $("#tree-char-picker").on("change", function(e){
    vis.wrangleData();
  });

  vis.wrangleData();

}

TreePlot.prototype.wrangleData = function(){
  var vis = this;

  var selectedYears = timeline.brush.empty() ? timeline.xContext.domain() : timeline.brush.extent()
  vis.years = selectedYears.map(function(v){return v.getFullYear()});

  var expenditureCriteria = ds.expenditures().map(function(v){
    return {
      name: v.subcategory,
      item: v.subcategory,
      demographic: $("#tree-demo-picker").val(),
      characteristic: $("#tree-char-picker").val()
    }
  });

  var expenditureData = ds.query(expenditureCriteria);
  var plotData = vis.plotData = [];
  _.each(vis.years, function(_year){
    var yearData = [];
    _.values(expenditureData).forEach(function(expendData){
      if (expendData.name !== "TOTALEXP") {
        var preparedData = _.clone(expendData);
        var yearValues = _.findWhere(preparedData.values, {year: _year});
        for (var a in yearValues) {
          preparedData[a] = yearValues[a];
        }
        yearData.push(preparedData);
      }
    });
    plotData.push(yearData);
  });


  vis.updatePlot();


}


TreePlot.prototype.updatePlot = function(){
  var vis = this;

  $("#tree-plot").remove();

  vis.plot = new MultiplePlot(
    Tree.prototype.constructor,
    "tree-plot"
  );
  $(vis.parentElement).append(vis.plot.html());

  vis.plot.draw(vis.plotData);

}




/*
 *  Tree - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _options            -- Array with all stations of the bike-sharing network
 */

Tree = function(_parentElement, _data, _options) {

  this.parentElement = _parentElement;
  this.options = _.defaults(_options, {
    width: 800,
    height:800,
    margin:{top: 40, right: 40, bottom: 40, left: 40}
  });

  this.data = _data;
  this.income = window.cs171.$adjusted (this.data[0].year, this.data[0].income);



  this.initVis();

}


/*
 *  Initialize tree chart
 */

Tree.prototype.initVis = function() {
  var vis = this;

  /************
   * Create SVG
   * **********/
  var margin = vis.options.margin;
  var width = vis.width = vis.options.width - margin.left - margin.right;
  var height = vis.height = vis.options.height - margin.top - margin.bottom;
  var svg = vis.svg = d3.select(vis.parentElement).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("class", "center-block")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


  /************
   * Ground
   * **********/
  vis.ground = (height);
  vis.svg.append("path")
    .datum([[0, vis.ground], [width, vis.ground]])
    .attr("id", "ground-line")
    .attr("d", d3.svg.line());



  /************
   * SCALES
   * **********/
  vis.trunk = d3.scale.linear().range([vis.ground, (vis.height - vis.ground)]).domain([0, 200000]);

  vis.branchHeight = d3.scale.ordinal();

  vis.branchLength = d3.scale.linear();

  vis.berries = d3.scale.ordinal();

  vis.leaves = d3.scale.linear();

  vis.wrangleData();

}



Tree.prototype.wrangleData= function() {
  var vis = this;

  //Sort the data by category.percentIncome descending
  vis.data.sort(function(a, b){
    return (b.valuePercentIncome - a.valuePercentIncome);
  });

  vis.updateVis();

}


Tree.prototype.updateVis = function(){
  var vis = this;

  /************
   * Trunk
   * **********/
  vis.trunkX = vis.width/2;
  vis.leafRadius = 10;
  var trunkHeight = vis.trunk(vis.income);
  var healthyBranchSlope = .2;

  var trunkBase = vis.ground;
  var trunkTop = vis.ground - trunkHeight;
  vis.svg.append("path")
    .datum([[vis.trunkX, vis.ground], [vis.trunkX, vis.ground - vis.trunk(vis.income)]])
    .attr("id", "trunk-line")
    .attr("d", d3.svg.line());


  /************
   * Branches
   * **********/
  vis.branchHeight
    .domain(vis.data.map(function(v){return v.itemText;}))
    .rangeRoundPoints([trunkBase, trunkTop], 1.0);

  var branches = vis.svg.selectAll(".branch")
    .data(vis.data);

  branches.enter()
    .append('g')
    .attr('class', 'branch');

  //branch
  branches
    .append("path")
    .attr("class", "branch-line")
    .attr("d", function(d, i){
      var branchTrunkX = d.branchTrunkX = vis.trunkX;
      var branchTrunkY = d.branchTrunkY = vis.branchHeight(d.itemText);
      var branchTipX = d.branchTipX = vis.trunkX  + (branchDirection(i) * (trunkHeight * (d.valuePercentIncome * .02)));
      var branchTipY = d.branchTipY = ((-healthyBranchSlope) * Math.abs(branchTipX - branchTrunkX)) + branchTrunkY;
      var branchMidX = d.branchMidX = branchTrunkX - ((branchTrunkX - branchTipX) / 2);
      var branchMidY = d.branchMidY =((-healthyBranchSlope) * Math.abs(branchTipX - branchTrunkX)) + branchTrunkY;
      var lineData = [[branchTrunkX, branchTrunkY], [branchMidX, branchMidY], [branchTipX, branchTipY]];
      return d3.svg.line().interpolate("basis")(lineData);
    });

  //berries and leaf
  branches
    .append("circle")
    .attr("class", "branch-leaf")
    .attr("cx", function(d, i){
      return (d.branchTipX);
    })
    .attr("cy", function(d){
      return d.branchTipY;
    })
    .attr("r", vis.leafRadius);

  branches
    .append("text")
    .attr("class", "leaf-label")
    .attr("x", function(d, i){return (d.branchTipX + (branchDirection(i) * (vis.leafRadius + 10)));})
    .attr("dy", function(d){return (d.branchTipY);})
    .attr("text-anchor", function(d,i){
      return (i % 2 == 0) ? "end" : "start";
    })
    .text(function(d){return d.itemText;});


}


function branchDirection(branchIndex){
  return ((branchIndex % 2) == 0) ? -1 : 1;
}

