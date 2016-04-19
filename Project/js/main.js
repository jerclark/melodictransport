// Variables for the visualization instances
var areachart;
var timeline;


(function(cs171) {

    var ds = window.ds = new cs171.Dataset();

    ds.ready(function(ds) {

        showRadar();
        // showArea();

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


        // This is needed for the current dataformat expected by timeline. Will refactor soon.
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
        $(".vis-radar-plot").append(radarDemoPicker.html());
        var radarItemPicker = new ItemPicker("radar-item-picker");
        $(".vis-radar-plot").append(radarItemPicker.html());


        var radar = new Radar(".vis-radar", {
           width:300,
           height:300,
           margin:{top:10, bottom:10, left:10, right:10},
           showLabels:false
        });

        $("#radar-item-picker").on("change", function(){ radar.fetchData() });
        $("#radar-demo-picker").on("change", function(){ radar.fetchData() });

        var radarPlot = new MultiplePlot(
          [1984,1990],
          Radar.prototype.constructor,
          "radar-small-multiples"
        );
        $(".vis-radar-plot").append(radarPlot.html());
        radarPlot.draw();

    }


})(window.cs171);

function brushed() {
    areachart.x.domain(timeline.brush.empty() ? timeline.xContext.domain() : timeline.brush.extent());
    areachart.svg.select(".area").attr("d", areachart.area);
    areachart.svg.select(".x-axis").call(areachart.xAxis);
    areachart.wrangleData();
}