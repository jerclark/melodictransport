TreePlot = function(_parentElement, _options) {
  var vis = this;
  vis.parentElement = _parentElement;

  //Create the grid layout with the controls, legend and the trees
  // vis.container = d3.select(vis.parentElement).append("div")
  //   .attr("class", "row");

  // vis.controlDiv = vis.container
  //   .append("div")
  //   .attr("class", "row")
  //   .attr("id", "tree-controls");

  // vis.gridDiv = vis.container
  //   .append("div")
  //   .attr("class", "row")
  //   .append("div")
  //   .attr("class", "col-md-8")
  //   .attr("id", "tree-grid");

  /************
   * CONTROLS
   * **********/

  //Demographic picker. Remove some.
  vis.demoPicker = new DemographicPicker("tree-demo-picker");
  $(".tree-demo-picker").html(this.demoPicker.html());
  $('#tree-demo-picker option:contains("Income before taxes")').remove();
  $('#tree-demo-picker option:contains("Highest education level of any member")').remove();

  vis.charPicker = new CharacteristicPicker("tree-char-picker", $("#tree-demo-picker").val());
  $(".tree-char-picker").html(this.charPicker.html());

  //Events
  $("#tree-demo-picker").on("change", function(e){
    vis.charPicker.updatePicker($(this).val());
    $("#tree-char-picker").html(vis.charPicker.html());
  });
  $("#tree-char-picker").on("change", function(e){
    vis.wrangleData();
  });

  /************
   * WRANGLE PLOT DATA
   * **********/
  vis.wrangleData();

}

TreePlot.prototype.wrangleData = function(){
  var vis = this;

  //Get the years to display in the multi-plot
  var selectedYears = timeline.brush.empty() ? timeline.xContext.domain() : timeline.brush.extent()
  vis.years = selectedYears.map(function(v){return v.getFullYear()});

  //Get the criteria from the menu selections
  var expenditureCriteria = ds.expenditures().map(function(v){
    return {
      name: v.subcategory,
      item: v.subcategory,
      demographic: $("#tree-demo-picker").val(),
      characteristic: $("#tree-char-picker").val()
    }
  });

  //Get the expenditure data for those years, and merge in the all item CPI
  var allItemCPIData = ds.cpiValues("CU0000SA0");
  var expenditureList = ds.expenditures();
  var expenditureData = ds.query(expenditureCriteria);
  var itemsToOmit = ["TOTALEXP", "CASHCONT", "INSPENSN", "READING"];
  var plotData = vis.plotData = [];
  _.each(vis.years, function(_year){
    var yearData = {chartTitle: _year, chartData: []};
    _.values(expenditureData).forEach(function(expendData){
      if (_.contains(itemsToOmit, expendData.name)) {
        return;
      }
      var preparedData = _.clone(expendData);
      var yearValues = _.findWhere(preparedData.values, {year: _year});
      for (var a in yearValues) {
        preparedData[a] = yearValues[a];
      }
      preparedData.treeIcon = _.findWhere(expenditureList, {subcategory: expendData.name}).treeIcon;
      preparedData.allItemCPIValue = _.findWhere(allItemCPIData, {year: _year}).value;
      yearData.chartData.push(preparedData);
    });
    plotData.push(yearData);
  });


  vis.updatePlot();


}


TreePlot.prototype.updatePlot = function(){
  var vis = this;

  //Clear out tree plots and tree tooltips
  $("#tree-plot").remove();
  $(".d3-tip.tree-tip").remove();

  vis.plot = new MultiplePlot(
    Tree.prototype.constructor,
    "tree-plot"
  );
  $("#tree-grid").append(vis.plot.html());

  var chartOptions = {
    width: 600,
    height: 800,
    margin: {top: 40, right: 75, bottom: 40, left: 75}
  };

  vis.plot.draw(vis.plotData, chartOptions);

}




/*
 *  Tree - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _options            -- Array with all stations of the bike-sharing network
 */

Tree = function(_parentElement, _data, _options) {

  this.parentElement = _parentElement;
  this.options = _.defaults(_options, {
    width: 500,
    height:500,
    margin:{top: 40, right: 75, bottom: 40, left: 75}
  });

  this.data = _data;

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
    .attr("style", "overflow: visible")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


  //Check for income, return if there is none
  if (_.isUndefined(vis.data[0].income)){
    svg.append("text")
      .text("NO DATA");
    return;
  }else{
    vis.income = window.cs171.$adjusted (vis.data[0].year, vis.data[0].income);
  }


  /************
   * Ground
   * **********/
  vis.ground = (height);
  //vis.svg.append("path")
  //  .datum([[0, vis.ground], [width, vis.ground]])
  //  .attr("id", "ground-line")
  //  .attr("d", d3.svg.line());

  vis.svg.append("ellipse")
    .attr("id", "ground")
    .attr("cx", width/2)
    .attr("cy", height)
    .attr("rx", 90)
    .attr("ry", 35);




  /************
   * SCALES
   * **********/
  vis.trunk = d3.scale.linear()
    .range([(vis.height - vis.ground) + (vis.height / 4), vis.height])
    .domain([5000, 100000])
    .clamp(true);

  vis.branchHeight = d3.scale.ordinal();

  vis.branchLength = d3.scale.linear();

  vis.flower = d3.scale.log().domain([1,20]).range([3,15]);

  vis.chlorophyll = d3.scale.log().domain([-1,-20]).range([0,1]);


  /************
   * TOOTIP
   * **********/
  vis.tip = d3.tip().attr('class', 'd3-tip tree-tip').html(function(d) {
    return d;
  });


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
  vis.leafRadius = 18;

  var trunkHeight = vis.trunk(vis.income);
  var healthyBranchSlope = .2;
  var trunkBase = vis.ground;
  var trunkTop = vis.ground - trunkHeight;

  vis.trunk = vis.svg.append("g")
    .attr("id", "trunk");

  vis.trunk.append("path")
    .datum([[vis.trunkX, vis.ground], [vis.trunkX, trunkTop]])
    .attr("id", "trunk-line")
    .attr("d", d3.svg.line());

  vis.trunk
    .append("circle")
    .attr("class", "tree-top-bulb")
    .attr("cx", vis.trunkX) //function(d, i){return (d.branchTipX);}) // + (branchDirection(i) * (vis.leafRadius + 10)));})
    .attr("cy", trunkTop) //function(d){return (d.branchTipY + 7.5);})
    .attr("r", 10);

  vis.trunk
    .append("text")
    .attr("class", "tree-top-label")
    .attr("x", vis.trunkX) //function(d, i){return (d.branchTipX);}) // + (branchDirection(i) * (vis.leafRadius + 10)));})
    .attr("dy", trunkTop - 20) //function(d){return (d.branchTipY + 7.5);})
    .attr("text-anchor", "middle")
    .text("$" + Math.round(vis.income) + " (income in 2014 dollars)");
    //.on("mouseenter", function(e){
    //  vis.tip.show("Average Income (in 2014 dollars): $" + Math.round(vis.income));
    //})
    //.on("mouseout", function(e){
    //  vis.tip.hide();
    //})
    //.call(vis.tip);




  /************
   * Branches
   * **********/
  vis.branchHeight
    .domain(vis.data.map(function(v){return v.itemText;}))
    .rangeRoundPoints([trunkBase, trunkTop], 1.0);

  var lengthDomain = [0,100];
  var lengthRange = [0,vis.width/2];
  vis.branchLength
      .domain([.01,100])
      .range([1,vis.width/2]);

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
      var branchTipX = d.branchTipX = vis.trunkX  + (branchDirection(i) * (trunkHeight * (d.valuePercentIncome * .02))); //vis.trunkX + (vis.branchLength(d.valuePercentIncome) * branchDirection(i));
      var branchTipY = d.branchTipY = ((-healthyBranchSlope) * Math.abs(branchTipX - branchTrunkX)) + branchTrunkY;
      var branchMidX = d.branchMidX = branchTrunkX - ((branchTrunkX - branchTipX) / 2);
      var branchMidY = d.branchMidY =((-healthyBranchSlope) * Math.abs(branchTipX - branchTrunkX)) + branchTrunkY;
      d.flowerX = (d.branchTipX + (branchDirection(i) * 15));
      d.flowerY = (d.branchTipY - 20);
      var lineData = [[branchTrunkX, branchTrunkY], [branchMidX, branchMidY], [branchTipX, branchTipY]];
      return d3.svg.line().interpolate("basis")(lineData);
    });


  //Add Leaves (green font awesome icons)
  branches
    .append("text")
    .attr("class", "leaf-label")
    .attr("x", function(d, i){return (d.branchTipX);}) // + (branchDirection(i) * (vis.leafRadius + 10)));})
    .attr("dy", function(d){return (d.branchTipY + 7.5);})
    .attr("text-anchor", function(d,i){
      return (i % 2 == 0) ? "end" : "start";
    })
    .text(function(d){
      var charCode =  (d.treeIcon) ? ('0x' + d.treeIcon) : '0xf042';
      return String.fromCharCode(charCode);
    })
    .on("mouseenter", function(e){
      vis.tip.show(e.itemText + "<br>" + Math.round(e.valuePercentIncome) + "% of income");
    })
    .on("mouseout", function(e){
      vis.tip.hide();
    })
    .call(vis.tip);


  //Add chlorophyll blocker (brown font awesome icons)
  branches
    .append("text")
    .attr("class", "dead-leaf-label")
    .attr("x", function(d, i){return (d.branchTipX);}) // + (branchDirection(i) * (vis.leafRadius + 10)));})
    .attr("dy", function(d){return (d.branchTipY + 7.5);})
    .attr("text-anchor", function(d,i){
      return (i % 2 == 0) ? "end" : "start";
    })
    .text(function(d){
      var charCode =  (d.treeIcon) ? ('0x' + d.treeIcon) : '0xf042';
      return String.fromCharCode(charCode);
    })
    .style("opacity", function(d) {
      var cpiDelta = (d.allItemCPIValue - d.cpi) < 0 ? (d.allItemCPIValue - d.cpi) : 0;
      return vis.chlorophyll(cpiDelta);
    })
    .on("mouseenter", function(e){
      var itemText = e.itemText;
      var percentOfIncomeSpent = "Spent " + Math.round(e.valuePercentIncome) + "% of income";
      var _cpiPace = ((e.allItemCPIValue - e.cpi) < 0) ? "FASTER" : "SLOWER";
      var _cpiDelta = ((Math.abs(e.allItemCPIValue - e.cpi) / e.allItemCPIValue) * 100).toFixed(1);
      var cpiTracking = "Cost increasing " + _cpiPace + " than inflation by " + _cpiDelta + "%";
      vis.tip.show(e.itemText + "<br>" + percentOfIncomeSpent + "<br>" + cpiTracking);
    })
    .on("mouseout", function(e){
      vis.tip.hide();
    })
    .call(vis.tip);


  //Add Flowers (pink font awesome icons)
  branches
    .append("text")
    .attr("class", "flower-label")
    .attr("x", function(d, i){return d.flowerX;})
    .attr("dy", function(d){return d.flowerY;})
    .attr("text-anchor", "middle")
    .style("font-size", function(d) {
      var cpiDelta = (d.allItemCPIValue - d.cpi) > 0 ? (d.allItemCPIValue - d.cpi) : 0;
      return vis.flower(cpiDelta) + "px";
    })
    .text(function(d){
      var charCode =  (d.treeIcon) ? ('0x' + d.treeIcon) : '0xf042';
      return String.fromCharCode(charCode);
    })
    .on("mouseenter", function(e){

    })
    .on("mouseout", function(e){
      vis.tip.hide();
    })
    .call(vis.tip);


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
      .attr("r", vis.leafRadius)
      .on("mouseenter", function(e){
        vis.tip.show(e.itemText + "<br>" + Math.round(e.valuePercentIncome) + "% of income");
      })
      .on("mouseout", function(e){
        vis.tip.hide();
      })
      .call(vis.tip);


}


function branchDirection(branchIndex){
  return ((branchIndex % 2) == 0) ? -1 : 1;
}



