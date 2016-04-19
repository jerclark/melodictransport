// Variables for the visualization instances
var areachart;
var timeline;
var radarChart;

(function(cs171) {

    var ds = window.ds = new cs171.Dataset();

    ds.ready(function(ds) {
        showArea();
        showRadar();
    });

    function showArea() {
        /*
        *  Setup area chart
        */

        subcategories = ["ALCBEVG", "APPAREL", "CASHCONT", "EDUCATN",
                "ENTRTAIN", "FOODTOTL", "HEALTH", "HOUSING",
                "INSPENSN", "MISC", "PERSCARE", "READING",
                "TOBACCO", "TRANS"];

        expends = {};
        subcategories.map(function(s){
                ds.items(s).map(function(d){
                    if (d.item != s){ // Filter out aggregate items
                        var result = ds.query({name: d.name,item: d.item})[d.name];
                        result.subcategory = s;
                        expends[d.name] = result;
                     }})});


        var year_maxes = {};
        Object.keys(expends).map(function(name) {
            expends[name].values.map(function(d){
                if (d.year in year_maxes){
                    year_maxes[d.year] = year_maxes[d.year] + d.value;
                } else {year_maxes[d.year] =  d.value;}})});

        // Date parser to convert strings to date objects
        var parseDate = d3.time.format("%Y").parse;

        years_ds = Object.keys(year_maxes).map(function (y){
            return {"Expenditures": year_maxes[y],
                    "Year": parseDate(y)}});

        var areachartProperties = {
            width: 800,
            height: 400,
            margin: { top: 40, right: 0, bottom: 60, left: 60 }};

        areachart = new Stacked("#stacked-area-chart", expends, areachartProperties);

         var timelineProperties = {
            width: 800,
            height: 50,
            margin: { top: 0, right: 0, bottom: 30, left: 60 }};

        timeline = new Timeline("timeline", years_ds, timelineProperties);
    }

    function showRadar() {
        var radarDemoPicker = new DemographicPicker("radar-demo-picker");
        $("#radar-chart").append(radarDemoPicker.html());
        var radarItemPicker = new ItemPicker("radar-item-picker");
        $("#radar-chart").append(radarItemPicker.html());
        radarChart = new Radar("#radar-chart", {
            width:600,
            height:600,
            margin:{top:10, bottom:10, left:10, right:10},
            showLabels:true
        });
        $("#radar-demo-picker").on("change", function(){ radarChart.fetchData() });
        $("#radar-item-picker").on("change", function(){ radarChart.fetchData() });
    }


})(window.cs171);

function brushed() {
    areachart.x.domain(timeline.brush.empty() ? timeline.xContext.domain() : timeline.brush.extent());
    areachart.svg.select(".area").attr("d", areachart.area);
    areachart.svg.select(".x-axis").call(areachart.xAxis);
    areachart.wrangleData();
    radarChart.wrangleData();
}