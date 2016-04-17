
/*
 *  Radar - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Array with all stations of the bike-sharing network
 */

Radar = function(_parentElement, _data) {

    this.parentElement = _parentElement;
    this.data = _data;

    this.initVis();
}


/*
 *  Initialize radar chart
 */

Radar.prototype.initVis = function() {
    var vis = this;

    /************
     * SCALES
     * **********/
    var margin = {top: 40, right: 40, bottom: 40, left: 40};
    var fullWidth = 800;
    var fullHeight = 800;
    var width = vis.width = fullWidth - margin.left - margin.right;
    var height = vis.height = fullHeight - margin.top - margin.bottom;
    var threshold = Math.min(vis.width, vis.height);
    vis.radius = threshold / 2 - (.2 * threshold);

    var svg = vis.svg = d3.select(vis.parentElement).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("class", "center-block")
      .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    /************
     * SCALES
     * **********/
    vis.values = d3.scale.linear();

    vis.dimensions = d3.scale.ordinal();

    vis.line = d3.svg.line.radial()
      .radius(function(d) { return (d[0]); })
      .angle(function(d) {
          return (d[1] * Math.PI/180); // + (Math.PI / 2);
      });

    /************
     * TOOLTIPS
     * **********/
    vis.tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
        return d;
    });


    vis.wrangleData();
}


/*
 *  Data wrangling
 */

Radar.prototype.wrangleData = function() {
    var vis = this;

    // Currently no data wrangling/filtering needed
    // vis.displayData = vis.data;

    // Update the visualization
    vis.updateVis();

}


/*
 *  The drawing function
 */

Radar.prototype.updateVis = function() {

    var vis = this;

    var values = vis.data.map(function(v){return v.value});

    vis.values
      .domain([0, d3.max(values)])
      .range([0, vis.radius]);

    vis.dimensions
      .domain(vis.data.map(function(v,a,i){
        return v.dimension;
        }))
      .range(d3.range(0, 360, (360/vis.data.length)));


    var lineData = vis.data.map(function(v,a,i){
        return [vis.values(v.value), vis.dimensions(v.dimension)];
    });
    lineData.push([vis.values(vis.data[0].value), vis.dimensions(vis.data[0].dimension)]);


    /************
     * RINGS
     * **********/
    //group
    var rings = vis.svg.append("g")
      .attr("class", "r axis")
      .selectAll("g")
      .data(vis.values.ticks(5).slice(1))
      .enter().append("g")
      .attr("class", "ring");

    //circles
    rings.append("circle")
      .attr("r", vis.values);

    //labels
    rings.append("text")
      .attr("y", function(d) { return -vis.values(d) - 4; })
      .attr("transform", "rotate(" + (vis.dimensions.range()[1] / 2) + ")") //ring labels halfway btwn noon and 1
      .style("text-anchor", "middle")
      .text(function(d) { return d; });



    /************
     * VALUE LINE
     * **********/
    var plotLine= vis.svg.append("g");
    plotLine.append("path")
      .datum(lineData)
      .attr("class", "line")
      .attr("d", vis.line);


    /************
     * SPOKES
     * **********/
    //Groups
    var spokes = vis.svg.append("g")
      .attr("class", "a axis")
      .selectAll("g")
      .data(vis.data)
      .enter().append("g")
      .attr("transform", function(d) {
          console.log(vis.dimensions(d.dimension));
          return "rotate(" + (vis.dimensions(d.dimension) - 90) + ")"; }
      );

    //Lines
    spokes.append("line")
      .attr("class", "spoke")
      .attr("x2", vis.radius);

    //Value Point - added here because can't attach event handlers to svg 'path markers'
    spokes.append("circle")
      .attr("class", "marker-circle")
      .attr("cx", function(d){return vis.values(d.value);})
      .attr("cy", 0)
      .attr("r", 5)
      .on("mouseenter", function(e){
          vis.tip.show(e.value);
      })
      .on("mouseout", function(e){
          vis.tip.hide();
      })
      .call(vis.tip);

    //Labels
    spokes.append("text")
      .attr("x", vis.radius + 10)
      .attr("dy", ".35em")
      .style("text-anchor", function(d) {
          return vis.dimensions(d.dimension) < 360 && vis.dimensions(d.dimension) > 180 ? "end" : null;
      })
      .attr("transform", function(d) {
          return vis.dimensions(d.dimension) < 360 && vis.dimensions(d.dimension) > 180 ? "rotate(180 " + (vis.radius + 10) + ",0)" : null;
      })
      .text(function(d) { return d.dimension; });





}
