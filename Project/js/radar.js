
/*
 *  Radar - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Array with all stations of the bike-sharing network
 */

Radar = function(_parentElement, _data) {

    this.parentElement = _parentElement;
    this.data = _data;

    // this.data = [
    //     {
    //         dimension:"Poop",
    //         value:10
    //     },
    //     {
    //         dimension:"Terd",
    //         value:13
    //     },
    //     {
    //         dimension:"Crud",
    //         value:15
    //     },
    //     {
    //         dimension:"Stuff",
    //         value:8
    //     },
    //     {
    //         dimension:"More Stuff",
    //         value:18
    //     },
    //     {
    //         dimension:"Yet More Stuff",
    //         value:9
    //     },
    //     {
    //         dimension:"Hey Now",
    //         value:10
    //     }
    // ];

    this.initVis();
}


/*
 *  Initialize radar chart
 */

Radar.prototype.initVis = function() {
    var vis = this;

    //Create an SVG area (width: 1000px, height: 600px)
    var margin = {top: 40, right: 40, bottom: 40, left: 40};
    var width = vis.width = 1000 - margin.left - margin.right;
    var height = vis.height = 1000 - margin.top - margin.bottom;
    vis.radius = Math.min(vis.width, vis.height) / 2 - 200;

    var svg = vis.svg = d3.select(vis.parentElement).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("class", "center-block")
      .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    //Create the scales
    vis.values = d3.scale.linear();

    vis.dimensions = d3.scale.ordinal();

    vis.line = d3.svg.line.radial()
      .radius(function(d) { return (d[0]); })
      .angle(function(d) {
          return -(d[1] * Math.PI/180) + (Math.PI / 2);
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

    vis.values.domain([0, d3.max(values)])
      .range([0, vis.radius]);

    vis.dimensions.domain(vis.data.map(function(v,a,i){
        return v.dimension;
    }))
      .range(d3.range(0, 360, (360/vis.data.length)));


    var lineData = vis.data.map(function(v,a,i){
        return [vis.values(v.value), vis.dimensions(v.dimension)];
    });

    lineData.push([vis.values(vis.data[0].value), vis.dimensions(vis.data[0].dimension)]);

    var rings = vis.svg.append("g")
      .attr("class", "r axis")
      .selectAll("g")
      .data(vis.values.ticks(10).slice(1))
      .enter().append("g");

    rings.append("circle")
      .attr("r", vis.values);

    rings.append("text")
      .attr("y", function(d) { return -vis.values(d) - 4; })
      .attr("transform", "rotate(15)")
      .style("text-anchor", "middle")
      .text(function(d) { return d; });

    var axes = vis.svg.append("g")
      .attr("class", "a axis")
      .selectAll("g")
      .data(vis.data)
      .enter().append("g")
      .attr("transform", function(d) {
          return "rotate(" + -vis.dimensions(d.dimension) + ")"; }
      );

    axes.append("line")
      .attr("x2", vis.radius);

    axes.append("text")
      .attr("x", vis.radius + 6)
      .attr("dy", ".35em")
      .style("text-anchor", function(d) {
          return vis.dimensions(d.dimension) < 270 && vis.dimensions(d.dimension) > 90 ? "end" : null;
      })
      .attr("transform", function(d) {
          return vis.dimensions(d.dimension) < 270 && vis.dimensions(d.dimension) > 90 ? "rotate(180 " + (vis.radius + 6) + ",0)" : null;
      })
      .text(function(d) { return d.dimension; });

    vis.svg.append("path")
      .datum(lineData)
      .attr("class", "line")
      .attr("d", vis.line);


}
