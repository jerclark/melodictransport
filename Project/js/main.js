// Variables for the visualization instances
var areachart;
var timeline;
var radarChart;

$(function() {
    $('.filtering-nav').scrollToFixed();
});

(function(cs171) {

    var FULL_WIDTH = 1366;
    var ds = window.ds = new cs171.Dataset();

    ds.ready(function(ds) {
        showArea();
        showRadar();
    });

    function showArea() {
        var expenditures = _.pluck(ds.subcategories("EXPEND"), "subcategory");

        function isSingleton(s){
            var singletons = ["ALCBEVG","CASHCONT","EDUCATN","PERSCARE","READING","TOBACCO", "MISC"];
            return singletons.indexOf(s) > -1
        };

        console.time('subcats2');

        var expends = ds.items().filter(function(i) {

            // We only want items that are in the expenses array above, and that are either a singleton,
            // or if they are not a singleton, their tittle does not match the subcategory
            if (expenditures.indexOf(i.subcategory) > -1){
                return i.item !== i.subcategory || isSingleton(i.subcategory)}
            else {return false; }

        }).reduce(function(acc, d) {
            var c = {
                name: d.name,
                item: d.item,
                demographic: "LB01",
                characteristic: "01"
            };

            if (ds.exists(c)) {
                acc[d.name] = ds.querySingle(c);
            }
            else {
                console.error("doesn't exist?", c);
            }
            return acc;
        }, {});
        console.timeEnd('subcats2');


        //console.log(expends);
        // Date parser to convert strings to date objects
        var parseDate = d3.time.format("%Y").parse;

        var yearDataset = _.chain(expends)
            .values()
            .reduce(function(obj, val) {
                val.values.forEach(function(val) {
                    obj[val.year] = (obj[val.year] || 0) + val.value;
                });
                return obj;
            }, {})
            .map(function(v, k) {
                return {
                    Expenditures: v,
                    Year: parseDate(k)
                };
            })
            .value();

       //  console.log(yearDataset);

        var areachartProperties = {
            width: FULL_WIDTH,
            height: 1000,
            margin: { top: 20, right: 0, bottom: 20, left: 60 }
        };

        areachart = new Stacked("#stacked-area-chart", expends, areachartProperties);

        var timelineProperties = {
            width: FULL_WIDTH,
            height: 100,
            margin: { top: 0, right: 0, bottom: 30, left: 0 }
        };

        timeline = new Timeline("timeline", yearDataset, timelineProperties);
    }

    function showRadar() {
        var radarDemoPicker = new DemographicPicker("radar-demo-picker");
        $("#radar-chart").append(radarDemoPicker.html());
        var radarItemPicker = new ItemPicker("radar-item-picker");
        $("#radar-chart").append(radarItemPicker.html());
        radarChart = new Radar("#radar-chart", {
            width: FULL_WIDTH / 2,
            height: 600,
            margin: { top: 10, bottom: 10, left: 10, right: 10 },
            showLabels: true
        });
        $("#radar-demo-picker").on("change", function() { radarChart.fetchData() });
        $("#radar-item-picker").on("change", function() { radarChart.fetchData() });
    }


})(window.cs171);

function brushed() {
    areachart.x.domain(timeline.brush.empty() ? timeline.xContext.domain() : timeline.brush.extent());
    areachart.svg.select(".area").attr("d", areachart.area);
    areachart.svg.select(".x-axis").call(areachart.xAxis);
    areachart.wrangleData();
    radarChart.wrangleData();
}
