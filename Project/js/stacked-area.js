
/*
 *  Stacked - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Array with all stations of the bike-sharing network
 */


// Date parser to convert strings to date objects
var parseDate = d3.time.format("%Y").parse;

var duration = 1500
var delay = 0


Stacked = function(_parentElement, _data, _properties){
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = []; // see data wrangling
    this.properties = _properties; 
    this.initVis();
}

/*
 *  Initialize area chart
 */

Stacked.prototype.initVis = function() {
    var vis = this;

    

    vis.margin = vis.properties.margin;
    vis.width = vis.properties.width - vis.margin.left - vis.margin.right;
    vis.legendMargin = { top: 0, right: 1, bottom: 20, left: 1 }; 
    vis.legendArea = 100; 
    vis.legendHeight = vis.legendArea - vis.legendMargin.top - vis.legendMargin.bottom; 
    vis.legendWidth = vis.width - vis.legendMargin.right - vis.legendMargin.left; 
    
    vis.areaChartHeight = vis.properties.height - vis.margin.top - vis.margin.bottom - vis.legendHeight; 
    


    var subcategories = new Set();
    d3.keys(vis.data).map(function(k){
    subcategories.add(vis.data[k].subcategory)});

    vis.subcategories = Array.from(subcategories);

    var colorPalette = colorbrewer.Purples[7].concat(
        colorbrewer.Blues[7],
        colorbrewer.Greens[7],
        colorbrewer.Oranges[7],
        colorbrewer.Reds[7],
        colorbrewer.Greys[7]); 

    var categoryColors = [];
    for ( var i=5; i< colorPalette.length; i+=7 )
    {categoryColors.push(colorPalette[i]);}

    vis.colorPalette = colorPalette;
    vis.categoryColors = categoryColors; 

    vis.colorScale = d3.scale.ordinal()
        .domain(Array.from(subcategories))
        .range(categoryColors);

    var dataCategories = d3.keys(vis.data);
    vis.allDataCategories = dataCategories; 

    var years = new Set();
    dataCategories.map(function(name)
        {vis.data[name].values.map(function(d){years.add(d.year)})}); 

    var years = Array.from(years).sort();
    vis.years = years; 


    // Fills in missing year values 
    dataCategories.map(function(name) {
        years.map(function(y){
            var found_y = false;
            vis.data[name].values.map(function(v){
                if (y == v.year){found_y = true;}
                })
            if (found_y == false){
                // console.log(name + " missing value for" + y );
                vis.data[name].values.push({year:parseInt(y), value: 0, income: 0, valuePercentIncome: 0, adjustedValue: 0});
            }
            })
        vis.data[name].values = vis.data[name].values.sort(function(a,b){return a.year - b.year});
    }); 
 

  // SVG drawing area (Adapted from lab 7)
    vis.svg = d3.select(vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.areaChartHeight + vis.margin.top + vis.margin.bottom + vis.legendArea)
      .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    // Scales and axes
    // Currently makes x scale based on first layer min/max

    vis.min_year = parseDate(d3.min(years).toString());
    vis.max_year = parseDate(d3.max(years).toString()); 

    vis.x = d3.time.scale()
        .range([0, vis.width])
        .domain([vis.min_year, vis.max_year]);  

    vis.y = d3.scale.linear()
        .range([vis.areaChartHeight, 0]);

    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom");

    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .orient("left");

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.areaChartHeight + ")");

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
        .attr("height", vis.areaChartHeight);

    vis.svg.append("text")
        .attr("id", "category-name")
        .attr("x","10")
        .attr("y","10");
    
    vis.legend_entry_height = 10; 
    vis.legend_x = 0 
    vis.legend_y = vis.properties.height - vis.legendHeight;  
    // Append legend background 
    vis.svg.append("rect")
        .attr("id", "legendBackground")
        .attr("x", vis.legend_x)
        .attr("y", vis.legend_y)
        .attr("width", vis.legendWidth )
        .attr("height", vis.legendHeight -25 )
        .style("stroke", "black")
        .style("fill","#fff") 
        .style("opacity", .75); 


    vis.subcategory = 'all'; 
    vis.wrangleData();
}


/*
 *  Data wrangling
 */

Stacked.prototype.wrangleData = function() {
    var vis = this;

    vis.filteredData = vis.data; 

    filteredData = {}; 

    if (vis.subcategory != 'all'){
         vis.allDataCategories.map(function(name){
            if (vis.data[name].subcategory == vis.subcategory)
                {filteredData[name] = vis.data[name]}})
         vis.filteredData = filteredData; 
         };

    var dataCategories = d3.keys(vis.filteredData);

    baseColor = vis.colorScale(vis.subcategory);
    var i = vis.categoryColors.indexOf(baseColor.toString()); 

    
    // Create an ordinal scale based on the color of the category 
    vis.colorScaleFiltered = d3.scale.ordinal()
            .domain(dataCategories)
            .range(vis.colorPalette.slice(i*7, i*7 +7)); 

    // Caculates year-by-year total for each year, to be used in percentage
    // caculations below
    var year_maxes = {};
    
    dataCategories.map(function(name) {
        vis.filteredData[name].values.map(function(d){
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
                        subcategory: vis.filteredData [name].subcategory,
                        values: vis.filteredData [name].values.map(function(d) {
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
                        subcategory: vis.data[name].subcategory,
                        values: vis.data[name].values.map(function(d) {
                        return {
                            year: parseDate(d.year.toString()), y: d["value"]/(year_maxes[d.year])};
                })};}));


    // Update the visualization
    var TYPE = d3.select("#area-chart-type").property("value");
    vis.displayData = vis[TYPE]; 
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
    var layers = vis.svg.selectAll(".area")
      .data(vis.displayData);

    layers.enter().append("path")
        .attr("class", "area");

    layers
        .style("fill", function(d) { 
            if (vis.subcategory == 'all'){return vis.colorScale(d.subcategory);} 
            else {return vis.colorScaleFiltered(d.name);}
        })
        .transition().duration(duration).delay(delay)
        .attr("d", function(d) {return vis.area(d.values);})

    layers
        .on("mouseover", function(d)
            {vis.svg.select("#category-name").text(d.subcategory + ": " + d.name);})
    layers
        .on("mouseout",function(d)
            {vis.svg.select("#category-name").text("");})

    layers
        .on("dblclick",function(d)
            {   if (vis.subcategory == d.subcategory){vis.subcategory = 'all'} 
                else {vis.subcategory = d.subcategory}
                vis.wrangleData()});

    layers.exit()
        .transition().duration(duration).delay(delay)
        .remove();

    var spacer = vis.legendWidth / (vis.subcategories.length ); 

    var legend = vis.svg.selectAll('g.legendEntry')
        .data(vis.subcategories)
        .enter()
        .append('g').attr('class', 'legendEntry');

    legend
        .append('rect')
        .attr("x", function(d, i) {
            return vis.legend_x + 10 +  (i * spacer );})
        .attr("y", vis.legend_y + 5)
        .attr("width", 10)
        .attr("height", 10)
        .style("stroke", "black")
        .style("stroke-width", 1)
        .style("fill", function(d){return vis.colorScale(d);}); 

     legend.append('text')
        .attr("x", function(d, i) {
            return vis.legend_x + 25 +  (i * spacer );})
        .attr("y", vis.legend_y + 15)
        .text(function(d){ return d; });

    // Call axis functions with the new domain
    vis.svg.select(".x-axis").call(vis.xAxis);
    vis.svg.select(".y-axis").call(vis.yAxis);
}
