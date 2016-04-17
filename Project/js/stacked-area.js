
/*
 *  Stacked - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Array with all stations of the bike-sharing network
 */


// Date parser to convert strings to date objects
var parseDate = d3.time.format("%Y").parse;

// Set ordinal color scale
var colorScale = d3.scale.category20();

var duration = 2000
var delay = 500


Stacked = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = []; // see data wrangling

    this.initVis();
}


/*
 *  Initialize area chart 
 */

Stacked.prototype.initVis = function() {
    var vis = this;

    vis.margin = { top: 40, right: 0, bottom: 60, left: 60 };
    vis.width = 800 - vis.margin.left - vis.margin.right,
    vis.height = 400 - vis.margin.top - vis.margin.bottom;

    var colorScale = d3.scale.category20();
    colorScale.domain(d3.keys(vis.data))
    var dataCategories = colorScale.domain();



    // Caculates year-by-year total for each year, to be used in percentage
    // caculations below 
    var year_maxes = {}; 
    var years =  dataCategories.map(function(name) {
        vis.data[name].values.map(function(d){
                if (d.year in year_maxes){
                    year_maxes[d.year] = year_maxes[d.year] + d.value; 
                } else {year_maxes[d.year] =  d.value;}})});

  
    var stack = d3.layout.stack()
    .values(function(d) { return d.values; });

    // Build area layout datastructure for given data key 
    function stackDataForKey(key){
        return stack(
                dataCategories.map(function(name) {
                    return {
                        name: name,
                        values: vis.data[name].values.map(function(d) {
                        return {
                            year: parseDate(d.year.toString()), y: d[key]};
                })};}))}; 

    vis.inflateAdjusted = stackDataForKey("adjustedValue");
    vis.rawData = stackDataForKey("value");
    vis.percentIncome = stackDataForKey("valuePercentIncome");
    
    
    // Calculating percentages is dependent on the totals from the submitted dataset, 
    // and needs to be calculated a little differently 
    vis.percent = stack(dataCategories.map(function(name) {
                    return {
                        name: name,
                        values: vis.data[name].values.map(function(d) {
                        return {
                            year: parseDate(d.year.toString()), y: d["value"]/(year_maxes[d.year])};
                })};})); 
    
  // SVG drawing area (Adapted from lab 7)
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
      .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // Scales and axes
    // Currently makes x scale based on first layer min/max 
    vis.x = d3.time.scale()
        .range([0, vis.width])
        .domain(d3.extent(vis.inflateAdjusted[0].values, function(d) {return d.year; }));

    vis.y = d3.scale.linear()
        .range([vis.height, 0]);

    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom");

    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .orient("left");

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
            .attr("class", "y-axis axis");

    vis.area = d3.svg.area()
        .interpolate("cardinal")
        .x(function(d) { return vis.x(d.year); })
        .y0(function(d) { return vis.y(d.y0); })
        .y1(function(d) { return vis.y(d.y0 + d.y); });
    
   vis.svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", vis.width)
        .attr("height", vis.height);

    vis.svg.append("text")
    .attr("id", "category-name")
    .attr("x","10")
    .attr("y","10");

    vis.wrangleData();
}


/*
 *  Data wrangling
 */

Stacked.prototype.wrangleData = function() {
    var vis = this;

    var TYPE = d3.select("#area-chart-type").property("value");
    vis.displayData = vis[TYPE]; 

    // Update the visualization
    vis.updateVis();

}


/*
 *  The drawing function (Heavly adabted from Lab  7)
 */

Stacked.prototype.updateVis = function() {

    var vis = this;

    // Get the maximum of the multi-dimensional array or in other words, get the highest peak of the uppermost layer
    vis.y.domain([0, d3.max(vis.displayData, function(d) {
            return d3.max(d.values, function(e) {
                return e.y0 + e.y;
            });
        })
    ]);

    // Draw the layers
    var categories = vis.svg.selectAll(".area")
      .data(vis.displayData);
  
  categories.enter().append("path")
    .attr("class", "area");

  categories
    .style("fill", function(d) { return colorScale(d.name);})
    .transition().duration(duration).delay(delay)
    .attr("d", function(d) {return vis.area(d.values);})

    categories
        .on("mouseover", function(d) 
            {vis.svg.select("#category-name").text(d.name);})
    categories  
        .on("mouseout",function(d)
            {vis.svg.select("#category-name").text("");})

    categories.exit().remove();

    // Call axis functions with the new domain 
    vis.svg.select(".x-axis").call(vis.xAxis);
    vis.svg.select(".y-axis").call(vis.yAxis);
}
