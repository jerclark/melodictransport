
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

    vis.areachart = {margin: { top: 20, right: 150, bottom: 20, left: 75 }};
    vis.legend =    {margin: { top: 0, right: 250, bottom: 20, left: 75 }};
    vis.rightLegend = {
                    width: 350,
                    margin: { top: 0, right: 250, bottom: 20, left: 75 }};

    vis.margin = vis.properties.margin;

    vis.width = vis.properties.width - vis.margin.left - vis.margin.right;
    vis.height = vis.properties.height - vis.margin.top - vis.margin.bottom;

    vis.legend.area = 65; 
    vis.legend.height = vis.legend.area - vis.legend.margin.top - vis.legend.margin.bottom; 
    vis.legend.width = vis.width - vis.legend.margin.right - vis.legend.margin.left; 
    
    vis.areachart.height = vis.height - vis.areachart.margin.top - vis.areachart.margin.bottom - vis.legend.height ; 
    vis.areachart.width = vis.width - vis.areachart.margin.left - vis.areachart.margin.right; 

    function isSingleton(s){
        var singletons = ["ALCBEVG","CASHCONT","EDUCATN","PERSCARE","READING","TOBACCO", "MISC"];
            return singletons.indexOf(s) > -1
        };

    var dataItems = d3.keys(vis.data);
    vis.alldataItems = dataItems;

    //Build complete array of years used in dataset
    var years = new Set();
    dataItems.map(function(name)
        {vis.data[name].values.map(function(d){years.add(d.year)})});

    years = Array.from(years).sort();
    vis.years = years;

    // Initial data cleaning
    dataItems.map(function(name) {

        // Groups singleton items under miscellanies category
        if (isSingleton(vis.data[name].subcategory)){vis.data[name].subcategory = "MISC"};

        // Fills in missing year values with zeors
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


    // Complete list of subcategories
    var subcategories = new Set();
    d3.keys(vis.data).map(function(k){
    subcategories.add(vis.data[k].subcategory)});
    vis.subcategories = Array.from(subcategories).sort();

    var colorPallets = [colorbrewer.Purples[6],colorbrewer.Blues[6],colorbrewer.YlGn[6],colorbrewer.Oranges[6],colorbrewer.Reds[6],colorbrewer.RdYlGn[6],colorbrewer.PuRd[6]];
    
    // Main colors, used at top level 

    var subcategoryColors = [];

    // color palletes used for zoomed view
    var subcategoryPalettes = []

    colorPallets.map(function(cP){
    {subcategoryColors.push(cP[2]);
     subcategoryColors.unshift(cP[5]);
     subcategoryPalettes.push(cP);
     subcategoryPalettes.unshift(cP);
    } });

    vis.subsubcategoryColorscale = d3.scale.ordinal()
        .domain(Array.from(subcategories))
        .range(subcategoryColors);

    var subColorScales = subcategoryPalettes.map(function(cP){
        return d3.scale.ordinal().range(cP);
    });

    vis.subColorScale = d3.scale.ordinal()
        .domain((subcategoryColors))
        .range(subColorScales);


  // SVG drawing area (Adapted from lab 7)
    vis.svg = d3.select(vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.areachart.height + vis.margin.top + vis.margin.bottom + vis.legend.area)
      .append("g")
        .attr("transform", "translate(" + vis.areachart.margin.left + "," + vis.areachart.margin.top + ")")
    .append("g")
        .attr("transform", "translate(" + (vis.rightLegend.margin.left) + "," + vis.areachart.margin.top + ")")

    // Scales and axes
    // Currently makes x scale based on first layer min/max

    vis.min_year = parseDate(d3.min(years).toString());
    vis.max_year = parseDate(d3.max(years).toString());

    vis.endYear = 2014;
    vis.legendYears = 7; 

    vis.x = d3.time.scale()
        .range([0, vis.areachart.width])
        .domain([vis.min_year, vis.max_year]);

    vis.rightLegend.x = d3.time.scale()
        .range([0, vis.rightLegend.width])
        .domain([parseDate(vis.endYear.toString()), parseDate((vis.endYear + vis.legendYears).toString())]);

    vis.y = d3.scale.linear()
        .range([vis.areachart.height , 0]);

    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom");

    vis.rightLegend.xAxis = d3.svg.axis()
        .scale(vis.rightLegend.x)
        .orient("bottom");

    vis.yAxis = d3.svg.axis()
        .scale(vis.y)
        .orient("left");

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.areachart.height + ")");

    vis.svg.append("g")
        .attr("class", "right-legend-x-axis axis")
        .attr("transform", "translate(0," + vis.areachart.height + ")");

    vis.svg.append("g")
            .attr("class", "y-axis axis");

    vis.rightLegend.area = d3.svg.area()
        .interpolate("cardinal")
        .x(function(d) { return vis.rightLegend.x(d.year)  + 900; })
        .y0(function(d) { return vis.y(d.y0);  })
        .y1(function(d) { return vis.y(d.y0 + d.y  ); });

    // Used for transitions in and out 
    vis.legendAreaExit = d3.svg.area()
        .interpolate("cardinal")
        .x(function(d) { return vis.x(d.year); })
        .y0(function(d) { return vis.y(0); })
        .y1(function(d) { return vis.y(0); });

    
    vis.area = d3.svg.area()
        .interpolate("cardinal")
        .x(function(d) { return vis.x(d.year); })
        .y0(function(d) { return vis.y(d.y0); })
        .y1(function(d) { return vis.y(d.y0 + d.y); });

    
    // Used for transitions in and out 
    vis.areaExit = d3.svg.area()
        .interpolate("cardinal")
        .x(function(d) { return vis.x(d.year); })
        .y0(function(d) { return vis.y(0); })
        .y1(function(d) { return vis.y(0); });

   vis.svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", vis.areachart.width)
        .attr("height", vis.areachart.height);
    
    // Y axis label
    vis.svg.append("text")
        .attr("id", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", (0 - vis.areachart.margin.left ))
        .attr("x",0 - (vis.areachart.height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Value");

    // Slice label 
    vis.svg.append("text")
        .attr("id", "category-name")
        .attr("x","10")
        .attr("y","0");
    
   
    // Append legend background
    vis.legend_entry_height = 10; 
    vis.legend_x = 0 
    vis.legend_y = vis.height - vis.legend.height;  
 

    vis.svg.append("rect")
        .attr("id", "legendBackground")
        .attr("x", vis.legend_x)
        .attr("y", vis.legend_y)
        .attr("width", vis.legend.width )
        .attr("height", vis.legend.height -25 )
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

    function inFilteredView(){
        return (vis.subcategory != 'all');
    }

    if (inFilteredView()){
        vis.x.range([0, vis.areachart.width - 300]);
    } else {
         vis.x.range([0, vis.areachart.width]);
    }

    vis.filteredData = vis.data;

    vis.startYear = vis.x.domain()[0].getFullYear(); 
    vis.endYear = vis.x.domain()[1].getFullYear();

    vis.rightLegend.x
        .domain([parseDate(vis.endYear.toString()), parseDate((vis.endYear + vis.legendYears).toString())]);

    filteredData = {};

    if (vis.subcategory != 'all'){
         vis.alldataItems.map(function(name){
            if (vis.data[name].subcategory == vis.subcategory)
                {filteredData[name] = vis.data[name]}})
         vis.filteredData = filteredData;
         };

         // Todo -- see if I can get better filtering work to enable "zoom transitons "
/*    filteredData = {};

    var dataItems = d3.keys(vis.filteredData);

    if (vis.subcategory != 'all'){
         dataItems.map(function(name) {
            if (vis.filteredData[name].subcategory != vis.subcategory){
                delete vis.filteredData[name]; 
            }
         })};*/

   dataItems = d3.keys(vis.filteredData);

    // Caculates year-by-year total for each year, to be used in percentage
    // caculations below
    var year_maxes = {};

    dataItems.map(function(name) {
        vis.filteredData[name].values.map(function(d){
                if (d.year in year_maxes){
                    year_maxes[d.year] = year_maxes[d.year] + d.value;
                } else {year_maxes[d.year] =  d.value;}})});

    var stack = d3.layout.stack()
        .values(function(d) { return d.values; });

    // Build area layout datastructure for given data key
    function stackDataForKey(key){
        return stack(
                dataItems.map(function(name) {
                    return {
                        name: name,
                        subcategory: vis.filteredData[name].subcategory,
                        values: vis.filteredData[name].values.map(function(d) {
                        return {
                            year: parseDate(d.year.toString()), y: d[key]};
                })};}))};



    valueTotals = {};
    dataItems.map(function(name) {
 
        var finalValues = vis.filteredData[name].values.filter(function(v){return v.year == vis.endYear;})[0];

        Object.keys(finalValues).filter(function(k){return k!='year';}).map(function(k){
            valueTotals[k] = (valueTotals[k] !== undefined ? valueTotals[k] : 0) + finalValues[k]; 
        })});

        var dataAverages = {};
        Object.keys(valueTotals).map(function(k){ dataAverages[k] =  valueTotals[k]/dataItems.length});


        extraYears = []; 
        for (i = 1; i < vis.legendYears; i++) {
            dataAverages.year = (vis.endYear + i);
            extraYears.push(_.clone(dataAverages));
        }


    function legendDataForKey(key){
        return stack(
                dataItems.map(function(name) {

                    var finalSliceValue = vis.filteredData[name].values.filter(function(v){return v.year == vis.endYear;})[0];
                    finalValues = [finalSliceValue].concat(extraYears); 

                    //console.log(finalValues);
                    return {
                        name: name,
                        subcategory: vis.filteredData[name].subcategory,
                        values: finalValues.map(function(d) {

                        if(inFilteredView()){
                            return {
                            year: parseDate(d.year.toString()), y: d[key]};

                        } else { return {year: parseDate(d.year.toString()), y: 0};}

                })};}))};


    vis.adjustedValue = stackDataForKey("adjustedValue");
    vis.adjustedValueLegend = legendDataForKey("adjustedValue");

    vis.value = stackDataForKey("value");
    vis.valueLegend = legendDataForKey("value");

    vis.valuePercentIncome = stackDataForKey("valuePercentIncome");
    vis.valuePercentIncomeLegend = legendDataForKey("valuePercentIncome");



    // Calculating percentages is dependent on the totals from the submitted dataset,
    // and needs to be calculated a little differently
    vis.percent = stack(dataItems.map(function(name) {
                    return {
                        name: name,
                        subcategory: vis.data[name].subcategory,
                        values: vis.data[name].values.map(function(d) {
                        return {
                            year: parseDate(d.year.toString()), y: d["value"]/(year_maxes[d.year])};
                })};}));

   
    var TYPE = d3.select("#value-type").property("value");
    var yAxisFormats = {adjustedValue : "$,.4s", value : "$,.4s",  percent : ",.2p", valuePercentIncome : ",.2p",};
    vis.yAxis.tickFormat(function(d) { return d3.format(yAxisFormats[TYPE])(d);});

    var yAxisTitles = {adjustedValue : "Inflation adjusted dollars", value : "2014 Dollars",  percent : "% Overtime", valuePercentIncome : "% of Average Income"};
    vis.svg.select("#y-axis-label").text((yAxisTitles[TYPE]));

    //console.log(TYPE);

    // Update the visualization
 
    vis.displayData = vis[TYPE];
    vis.legendData = vis[(TYPE + "Legend")]; 


    vis.updateVis();

}


/*
 *  The drawing function 
 */

Stacked.prototype.updateVis = function() {

    var vis = this;

    function getFullSubcategoryName(k){
        var names = {"APPAREL":"Apparel",
                    "ENTRTAIN":"Entertain.",
                    "FOODTOTL":"Food",
                    "HEALTH":"Healthcare",
                    "HOUSING":"Housing",
                    "INSPENSN":"Pensions",
                    "MISC":"Misc.",
                    "TRANS":"Transport."
                    };
        if (_.has(names,k)){return names[k]}
            else {return k;}
    }

    function inFilteredView(){
        return (vis.subcategory != 'all');
    }

    var highlight_color = "#7997a1"

    // Get the maximum of the multi-dimensional array or in other words, get the highest peak of the uppermost layer
    vis.y.domain([0, d3.max(vis.displayData, function(d) {
            return d3.max(d.values, function(e) {
                return e.y0 + e.y;
            });
        })
    ]);

    // Draw the layers

  
    var layers = vis.svg.selectAll(".area-chart")
        .data(vis.displayData);

    layers.enter().append("path")
        .attr("class", "area-chart area")
        .attr("d", function(d) {return vis.areaExit(d.values);});

    layers
        .style("fill", function(d) {
            if (vis.subcategory == 'all'){return vis.subsubcategoryColorscale(d.subcategory);}
            else {return vis.subColorScale(vis.subsubcategoryColorscale(d.subcategory))(d.name);}
        })
        .transition().duration(duration).delay(delay)
        .attr("d", function(d) {return vis.area(d.values);});


    layers.exit()
        .transition().duration(duration).delay(delay)
        .attr("d", function(d) {return vis.areaExit(d.values);})
        .remove();


    // Draw the legend

  
    var Legendlayers = vis.svg.selectAll(".rightLegend")
        .data(vis.legendData);


    Legendlayers.enter().append("path")
        .attr("class", "rightLegend")
        .attr("d", function(d) {return vis.legendAreaExit(d.values);});

    Legendlayers 
        .style("fill", function(d) {
            if (vis.subcategory == 'all'){return vis.subsubcategoryColorscale(d.subcategory);}
            else {return vis.subColorScale(vis.subsubcategoryColorscale(d.subcategory))(d.name);}
        })
        .transition().duration(duration).delay(delay)
        .attr("d", function(d) {return vis.rightLegend.area(d.values);}); 

    vis.svg.selectAll(".chartDataLabel").remove();

    var DataLabels = vis.svg.selectAll(".chartDataLabel")
        .data(vis.legendData);

    DataLabels
        .enter().append('text')
        .attr("class", "chartDataLabel")
        .attr("y", function(d) { return vis.y(d.values[3].y0 + d.values[3].y/2); })
        .attr("x", function(d) { return 2000; })
        .attr("dy", "0.5em")
        .style("fill", "black")
        .text(function (d){
            if(inFilteredView()){return d.name}});


    DataLabels
        .transition().duration(duration).delay(delay)
        .attr("y", function(d) { return vis.y(d.values[3].y0 + d.values[3].y/2); })
        .attr("x", function(d) { return vis.rightLegend.x(d.values[3].year)  + 825; })
        .attr("dy", "0.5em");
  
    Legendlayers.exit()
        .transition().duration(duration).delay(delay)
        .attr("d", function(d) {return vis.areaExit(d.values);})
        .remove();


    // highlight optiones
    vis.svg.selectAll(".area, .rightLegend")
        .on("mouseover", function(d)
            {vis.svg.select("#category-name").text(d.subcategory + ": " + d.name);
            if (!inFilteredView()){vis.svg.select("#"+d.subcategory).style("fill", highlight_color);}
            });

    vis.svg.selectAll(".area, .rightLegend")
        .on("mouseout",function(d)
            {vis.svg.select("#category-name").text("");
            if (!inFilteredView()){vis.svg.select("#"+d.subcategory).style("fill", "none");}
            });

   vis.svg.selectAll(".area, .rightLegend")
        .on("dblclick",function(d)
            {   if (inFilteredView()){
                    vis.subcategory = 'all';
                    vis.svg.select("#"+d.subcategory).style("fill", "none");
                } 
                else {
                    vis.subcategory = d.subcategory;
                    vis.svg.select("#"+d.subcategory).style("fill", highlight_color);

                }

                vis.wrangleData()});


    // SubCatagory Legend 

    var spacer = (vis.legend.width - 5) / (vis.subcategories.length );

    var legend = vis.svg.selectAll('g.legendEntry')
        .data(vis.subcategories)
        .enter().append('g')
        .attr('class', 'legendEntry')
        .on("mouseover", function(d)
            {vis.svg.select("#"+d).style("fill", highlight_color);})
        .on("mouseout", function(d)
            {vis.svg.select("#"+d).style("fill", "none");})
        .on("dblclick",function(d)
            {   if (vis.subcategory == d){vis.subcategory = 'all'}
                else {vis.subcategory = d}
                vis.wrangleData()});

    legend
        .append('rect')
        .attr("class", "legendBgBox")
        .attr('id',function(d){return d;})
        .attr("x", function(d, i) {
            return vis.legend_x + 10 +  (i * spacer );})
        .attr("y", vis.legend_y + 5)
        .attr("width", spacer - 8)
        .attr("height", 12)
        .style("fill", "#fff")
        .on("mouseover", function() {
            d3.select(this).style("fill", highlight_color);
            })
        .on("mouseout", function() {
            if (!inFilteredView()){d3.select(this).style("fill", "none");}   
        })

    legend
        .append('rect')
        .attr("x", function(d, i) {
            return vis.legend_x + 10 +  (i * spacer );})
        .attr("y", vis.legend_y + 5)
        .attr("width", 9)
        .attr("height", 9)
        .style("stroke", "black")
        .style("stroke-width", 1)
        .style("fill", function(d){return vis.subsubcategoryColorscale(d);});

     legend.append('text')
        .attr("x", function(d, i) {
            return vis.legend_x + 25 +  (i * spacer );})
        .attr("y", vis.legend_y + 15)
        .style("font-size", 12)
        .text(function(d){ return getFullSubcategoryName(d); });



    // Call axis functions with the new domain
    vis.svg.select(".x-axis").call(vis.xAxis);
    vis.svg.select(".y-axis").transition().duration(duration).delay(delay).call(vis.yAxis);
}
