
/*
 *  Radar - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Array with all stations of the bike-sharing network
 */

Radar = function(_parentElement, options) {

    this.parentElement = _parentElement;
    this.options = _.defaults(options, {
        width: 800,
        height:800,
        margin:{top: 40, right: 40, bottom: 40, left: 40},
        showLabels:true
    });

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
    var margin = vis.options.margin;
    var width = vis.width = vis.options.width - margin.left - margin.right;
    var height = vis.height = vis.options.height - margin.top - margin.bottom;
    var threshold = Math.min(vis.width, vis.height);
    vis.radius = threshold / 2 - (.2 * threshold);

    var svg = vis.svg = d3.select(vis.parentElement).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("class", "center-block")
      .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var ringGroup = vis.ringGroup = vis.svg.append("g")
      .attr("class", "r axis");

    var plotGroup = vis.plotGroup = vis.svg.append("g").attr("class", "radar-plot-group");

    var spokeGroup = vis.spokeGroup = vis.svg.append("g").attr("class", "a axis");

    /************
     * SCALES
     * **********/
    vis.values = d3.scale.linear().range([0, vis.radius]);

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

Radar.prototype.wrangleData = function(demographicCode, itemCode) {
    var vis = this;

    var demographicCode = this.demographicCode = $("#radar-demo-picker").val();
    var itemCode = this.itemCode = $("#radar-item-picker").val();

    //Get the data for the selected Demographic and Item
    var _data = ds.queryDemographic({
        demographic: demographicCode,
        item: itemCode,
        year: 1984
    });


    //Map the data
    vis.data = Object.keys(_data).map(function(k) {
        var d = _data[k];
        return {
            dimension: k,
            value: d.values[0].adjustedValue
        };
    });

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
      .domain([0, d3.max(values)]);

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
    var rings = vis.ringGroup.selectAll("g")
      .data(vis.values.ticks(5).slice(1));

    rings
      .enter()
      .append("g")
      .attr("class", "ring");

    rings.exit().remove();

    //Circles
    rings.selectAll("circle").remove();
    rings
      .append("circle")
      .attr("r", vis.values);


    //Labels
    rings.selectAll("text").remove();
    rings.append("text")
      .attr("y", function(d) { return -vis.values(d) - 4; })
      .attr("transform", "rotate(" + (vis.dimensions.range()[1] / 2) + ")") //ring labels halfway btwn noon and 1
      .style("text-anchor", "middle")
      .text(function(d) { return d; });





    /************
     * VALUE LINE
     * **********/
    vis.plotGroup.selectAll("path").remove();
    vis.plotGroup.append("path")
      .datum(lineData)
      .attr("class", "line")
      .attr("d", vis.line);


    /************
     * SPOKES
     * **********/
    //Groups
    var spokes = vis.spokeGroup
      .selectAll("g")
      .data(vis.data);

    spokes
      .enter()
      .append("g");

    spokes
      .attr("transform", function(d) {
          console.log(vis.dimensions(d.dimension));
          return "rotate(" + (vis.dimensions(d.dimension) - 90) + ")"; }
      );

    spokes.exit().remove();

    //Lines
    spokes.selectAll("line").remove();
    spokes.append("line")
      .attr("class", "spoke")
      .attr("x2", vis.radius);

    //Value Point - added here because can't attach event handlers to svg 'path markers'
    spokes.selectAll("circle").remove();
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
      });
      //.call(vis.tip);

    //Labels
    if (vis.options.showLabels) {
        spokes.selectAll("text").remove();
        spokes.append("text")
          .attr("x", vis.radius + 10)
          .attr("dy", ".35em")
          .style("text-anchor", function (d) {
              return vis.dimensions(d.dimension) < 360 && vis.dimensions(d.dimension) > 180 ? "end" : null;
          })
          .attr("transform", function (d) {
              return vis.dimensions(d.dimension) < 360 && vis.dimensions(d.dimension) > 180 ? "rotate(180 " + (vis.radius + 10) + ",0)" : null;
          })
          .text(function (d) {
              return d.dimension;
          });
    }





}
