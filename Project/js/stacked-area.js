
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

    vis.areachart = {margin: { top: 20, right: 100, bottom: 20, left: 75 }};
    vis.legend =    {margin: { top: 0, right: 20, bottom: 10, left: 75 }};
    vis.rightLegend = {
                    width: 300,
                    margin: { top: 0, right: 20, bottom: 20, left: 75 }};

    vis.margin = vis.properties.margin;

    vis.width = vis.properties.width - vis.margin.left - vis.margin.right;
    vis.height = vis.properties.height - vis.margin.top - vis.margin.bottom;

    vis.legend.area = 65;
    vis.legend.height = vis.legend.area - vis.legend.margin.top - vis.legend.margin.bottom;
    vis.legend.width = vis.width - vis.legend.margin.right - vis.legend.margin.left;

    vis.areachart.height = vis.height - vis.areachart.margin.top - vis.areachart.margin.bottom - vis.legend.height ;
    vis.areachart.width = vis.width - vis.areachart.margin.left - vis.areachart.margin.right;


    // Helper functions

    vis.isSingleton = function (s){
        var singletons = ["ALCBEVG","CASHCONT","EDUCATN","PERSCARE","READING","TOBACCO", "MISC"];
            return singletons.indexOf(s) > -1
        };

    vis.clipName = function(n){
        var limit = 42;
        if (n.length > limit ){
            return n.substring(0, (limit -3)) + "...";
        } else { return n;}

    };

    vis.inFilteredView = function(){
        return (vis.subcategory != 'all');
    };

    vis.inSingleView = function(){
        return (vis.itemSelector != 'none');
    };

    vis.getFullSubcategoryName = function(k){
        var names = {"all": "All",
                    "APPAREL":"Apparel",
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
    };

    vis.selectSubCatagory = function(c){
            vis.itemSelector = 'none';
        if (vis.subcategory == c){vis.subcategory = 'all'}
                else {
                    vis.subcategory = c;
                }
                vis.wrangleData()};


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
        if (vis.isSingleton(vis.data[name].subcategory)){vis.data[name].subcategory = "MISC"};

        // Fills in missing year values with zeors
        years.map(function(y){
            var found_y = false;
            vis.data[name].values.map(function(v){
                if (y == v.year){found_y = true;
                    v.valuePercentIncome = v.valuePercentIncome/100;
                }
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
        .range([0, (vis.areachart.width)])
        .domain([vis.min_year, vis.max_year]);

    vis.rightLegend.x = d3.time.scale()
        .range([0, vis.rightLegend.width])
        .domain([parseDate(vis.endYear.toString()), parseDate((vis.endYear + vis.legendYears).toString())]);

    vis.y = d3.scale.linear()
        .range([vis.areachart.height , 0]);

    vis.rightLegend.y = d3.scale.linear()
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
        .interpolate("linear")
        .x(function(d) { return vis.rightLegend.x(d.year)  + 2000  ; })
        .y0(function(d) { return vis.rightLegend.y(d.y0);  })
        .y1(function(d) { return vis.rightLegend.y(d.y0 + d.y  ); });

    // Used for transitions in and out
    vis.legendAreaExit = d3.svg.area()
        .interpolate("linear")
        .x(function(d) { return vis.rightLegend.x(d.year) ; })
        .y0(function(d) { return vis.rightLegend.y(d.y0); })
        .y1(function(d) { return vis.rightLegend.y(d.y0 + d.y); });


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


   vis.clippath = vis.svg.append("defs").append("clipPath")
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
        .attr("y","-20");

    vis.rightSlideLegendGroup = vis.svg.append('g');

    vis.rightSlideLegendGroup
        .append('rect')
        .attr("id", "legendBgBoxHead")
        .attr("class","rightLegendBox")
        .attr("x", 2000)
        .attr("rx", 10)
        .attr("ry", 10)
        .attr("y", -20)
        .attr("width", vis.rightLegend.width - 100)
        .attr("height", 50)
        .style("stroke", "black")
        .style("opacity", .75)
        .style("fill","#fff")

    vis.rightSlideLegendGroup
        .append('text')
        .attr("class","rightLegendBox")
        .attr("id", "RightLegendHeader")
        .attr("x", 2000)
        .attr("dy", "-0.4em")
        .attr("dx", "0.4em")
        .text("SubCatagory");

    vis.rightSlideLegendGroup
        .append('rect')
        .attr("id", "RightLegendBgBox")
        .attr("class","rightLegendBox")
        .attr("x", 2000)
        .attr("y", 0)
        .attr("width", vis.rightLegend.width - 42)
        .attr("height", vis.areachart.height + 2)
        .style("stroke", "black")
        .style("fill","#fff");

    // Bottem sub-catagory legend
    vis.bottemnavbar = d3.select(".area-chart-nav").selectAll('li')
        .data((['all'].concat(vis.subcategories)))
        .enter().append("li")
        .attr("id",function(d){return "area-chart-nav-" + d})
        .attr("class",function(d){return "area-chart-nav-li"})
        .append("a").attr("xlink:href","#")
        .attr("onclick",function(d){return 'areachart.selectSubCatagory("' + d +'")'})
        .html(function(d){return('<div class="square" style="background-color:' + vis.subsubcategoryColorscale(d) + '"></div> ' + vis.getFullSubcategoryName(d))});

    vis.subcategory = 'all';
    vis.itemSelector = 'none';
    vis.wrangleData();
}


/*
 *  Data wrangling
 */

Stacked.prototype.wrangleData = function() {
    var vis = this;

    $('.area-chart-nav-li').removeClass("active");
    $('#area-chart-nav-'+vis.subcategory).toggleClass("active");

    if (vis.inFilteredView()){
        vis.x.range([0, vis.areachart.width - vis.rightLegend.width - 25]);
        vis.clippath.attr("width", vis.areachart.width - vis.rightLegend.width - 25);

    } else {
         vis.x.range([0, vis.areachart.width]);
         vis.clippath.attr("width", vis.areachart.width);
    }

    vis.filteredData = vis.data;

    vis.startYear = vis.x.domain()[0].getFullYear();
    vis.endYear = vis.x.domain()[1].getFullYear();

    vis.rightLegend.x
        .domain([parseDate(vis.endYear.toString()), parseDate((vis.endYear + vis.legendYears).toString())]);

    filteredData = {};

    d3.keys(vis.filteredData).map(function(name){
        filteredData[name] = vis.filteredData[name]});

    if (vis.inFilteredView() &&  vis.itemSelector == 'none' ){
         Object.keys(filteredData).map(function(name){
            if (filteredData[name].subcategory != vis.subcategory)
                { delete filteredData[name] }})
         } else if (vis.itemSelector != 'none'){
            Object.keys(filteredData).map(function(name){

            if (vis.data[name].item != vis.itemSelector)
                {
                    delete filteredData[name]}
                })
         }

    vis.filteredData = filteredData;

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
                        item: vis.filteredData[name].item,
                        subcategory: vis.filteredData[name].subcategory,
                        subcategoryText: vis.filteredData[name].subcategoryText,
                        values: vis.filteredData[name].values.map(function(d) {
                        return {
                            year: parseDate(d.year.toString()), y: d[key]};
                })};}))};

    // Build data for slide in legend
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
                        item:vis.filteredData[name].item,
                        subcategory: vis.filteredData[name].subcategory,
                        subcategoryText: vis.filteredData[name].subcategoryText,
                        values: finalValues.map(function(d) {

                        if(vis.inFilteredView()){
                            return {
                            year: parseDate(d.year.toString()), y: d[key]};

                        } else { return {year: parseDate(d.year.toString()), y: 0};}

                })};}))};


    vis.adjustedValue = stackDataForKey("adjustedValue");
    vis.value = stackDataForKey("value");
    vis.valuePercentIncome = stackDataForKey("valuePercentIncome");

    if(!vis.inSingleView()){
        vis.adjustedValueLegend = legendDataForKey("adjustedValue");
        vis.valuePercentIncomeLegend = legendDataForKey("valuePercentIncome");
        vis.valueLegend = legendDataForKey("value");
    }


    // Calculating percentages is dependent on the totals from the submitted dataset,
    // and needs to be calculated a little differently
    vis.percent = stack(dataItems.map(function(name) {
                    return {
                        name: name,
                        item:vis.filteredData[name].item,
                        subcategory: vis.filteredData[name].subcategory,
                        subcategoryText: vis.filteredData[name].subcategoryText,
                        values: vis.data[name].values.map(function(d) {
                        return {
                            year: parseDate(d.year.toString()), y: d["value"]/(year_maxes[d.year])};
                })};}));


    var TYPE = d3.select("#value-type-area").property("value");
    var yAxisFormats = {adjustedValue : "$,.4s", value : "$,.4s",  percent : ",.2p", valuePercentIncome : ",.2p",};
    vis.yAxis.tickFormat(function(d) { return d3.format(yAxisFormats[TYPE])(d);});

    var yAxisTitles = {adjustedValue : "Inflation adjusted dollars", value : "2014 Dollars",  percent : "% Overtime", valuePercentIncome : "% of Average Income"};
    vis.svg.select("#y-axis-label").text((yAxisTitles[TYPE]));


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

    var highlight_color = "#7997a1"

    // update y scale for current data

    vis.y.domain([0, d3.max(vis.displayData, function(d) {
            return d3.max(d.values, function(e) {
                return e.y0 + e.y;
            });
        })
    ]);

    // Presuming we’re not in a single view, we update the fly in legend scale as well
    if(!vis.inSingleView()){
        vis.rightLegend.y.domain(vis.y.domain());
    };

    // Draw the main area chart

    var layers = vis.svg.selectAll(".area-chart")
        .data(vis.displayData);

    // Enter
    layers.enter().append("path")
        .attr("class", "area-chart area")
        .attr("d", function(d) {return vis.areaExit(d.values);});

    // Update
    layers
        .transition().duration(duration).delay(delay + 1000)
        .style("fill", function(d) {
            if (vis.subcategory == 'all'){return vis.subsubcategoryColorscale(d.subcategory);}
            else {return vis.subColorScale(vis.subsubcategoryColorscale(d.subcategory))(d.name);}
        })
        .attr("id", function (d){return "layer-" + d.item})
        .attr("alt", function (d){return d.name})
        .attr("d", function(d) {return vis.area(d.values);});


    layers.exit()
        .transition().duration(duration).delay(delay )
        .attr("d", function(d) {return vis.areaExit(d.values);})
        .remove();


    // Draw the slide in  in legend

    var legendY = vis.rightLegend.y(d3.max(vis.legendData, function(d) {
            return d3.max(d.values, function(e) {
                return e.y0 + e.y;
            })}));


    if(vis.inFilteredView() && !vis.inSingleView() ){

        if(vis.alreadyinFilteredView){
            vis.rightSlideLegendGroup.selectAll(".rightLegend").remove();
             vis.svg.selectAll(".chartDataLabel").remove();
             vis.svg.selectAll(".rightLegendArea").remove();
        }

        // Slide in animation
        vis.rightSlideLegendGroup.transition().duration(duration).delay(delay)
            .attr("transform", "translate(" + (-2000 + (vis.areachart.width - vis.rightLegend.width - 1)) + ",0)");

        vis.rightSlideLegendGroup.selectAll(".rightLegendBox")
            .attr("transform", "translate(0," + legendY +")");

        vis.rightSlideLegendGroup.selectAll("#RightLegendBgBox")
            .attr("height", (vis.areachart.height - legendY + 2));

        vis.rightSlideLegendGroup.select("#RightLegendHeader")
            .text(" " + vis.getFullSubcategoryName(vis.subcategory) + " Subcategories");

        vis.alreadyinFilteredView = true;

    } else if (vis.inSingleView()){

    }  else {
        // Slide out
        vis.rightSlideLegendGroup.transition().duration(duration).delay(delay)
            .attr("transform", "translate(0,0)");

        vis.svg.selectAll(".chartDataLabel").transition().duration(duration).delay(delay).remove();
        vis.svg.selectAll(".rightLegendArea").transition().duration(duration).delay(delay).remove();

        vis.alreadyinFilteredView = false;

    }


    var Legendlayers = vis.rightSlideLegendGroup.selectAll(".rightLegend")
        .data(vis.legendData);

    if(vis.inFilteredView()){
        Legendlayers.enter().append("g")
            .append("path")
            .attr("class", function (d){return "rightLegend"})
            .attr("id", function (d){return "rightLegend-" + d.item})
            .attr("d", function(d) {return vis.rightLegend.area(d.values);}); }

    Legendlayers
        .style("fill", function(d) {
            if (vis.subcategory == 'all'){return vis.subsubcategoryColorscale(d.subcategory);}
            else {return vis.subColorScale(vis.subsubcategoryColorscale(d.subcategory))(d.name);}
        })
         .attr("d", function(d) {return vis.rightLegend.area(d.values);});

    Legendlayers.exit()
        .transition().duration(duration).delay(delay)
        .attr("d", function(d) {return vis.areaExit(d.values);})
        .remove();

    // Pop in legend labels

    var DataLabels = vis.rightSlideLegendGroup.selectAll(".chartDataLabel")
        .data(vis.legendData)

    if(vis.inFilteredView()){
    DataLabels
        .enter().append('text')
        .attr("class", "chartDataLabel")
        .attr("dy", "0.5em")
        .style("fill", "black")
        .text(function (d){
            if(vis.inFilteredView()){return vis.clipName(d.name)}});
    };

    DataLabels
        .attr("y", function(d) { return vis.rightLegend.y(d.values[3].y0 + d.values[3].y/2) })
        .attr("x", function(d) { return vis.rightLegend.x(d.values[1].year) + 2000; });


    var highlight_layer = function(d){
        vis.svg.select("#layer-"+d).classed('highlight',true);
        vis.svg.select("#rightLegend-"+d).classed('highlight',true);
    }


    var unhighlight_layer = function(d){
        vis.svg.select("#layer-"+d).classed('highlight',false);
        vis.svg.select("#rightLegend-"+d).classed('highlight',false);

    }

    var select_layer = function(d){
        vis.svg.select("#rightLegend-"+d).classed('selected',true);
        };

    var unselect_layer = function(d){
        vis.svg.select("#rightLegend-"+d).classed('selected',false);
        };

    // highlight optiones
    vis.svg.selectAll(".area, .rightLegend")
        .on("mouseover", function(d)
            {vis.svg.select("#category-name").text(d.name);
            highlight_layer(d.item);

            });

    vis.svg.selectAll(".area, .rightLegend")
        .on("mouseout",function(d)
            {vis.svg.select("#category-name").text("");
            unhighlight_layer(d.item);});

   vis.svg.selectAll(".area, .rightLegend")
        .on("dblclick",function(d)
            {   if (vis.inFilteredView() && vis.inSingleView()){
                    vis.svg.select("#"+d.subcategory).style("fill", "none");

                    vis.itemSelector = 'none';
                    unhighlight_layer(d.item);
                    unselect_layer(d.item);


                } else if (vis.inFilteredView()) {

                    vis.itemSelector = d.item;
                    select_layer(d.item);


                }
                else {
                    vis.subcategory = d.subcategory;
                    vis.svg.select("#"+d.subcategory).style("fill", highlight_color);

                }

                vis.wrangleData()});


    // Call axis functions with the new domain
    vis.svg.select(".x-axis").transition().duration(duration).delay(delay).call(vis.xAxis);
    vis.svg.select(".y-axis").transition().duration(duration).delay(delay).call(vis.yAxis);
}
