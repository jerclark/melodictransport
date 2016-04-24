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
        var subcategories = ["ALCBEVG", "APPAREL", "CASHCONT", "EDUCATN",
            "ENTRTAIN", "FOODTOTL", "HEALTH", "HOUSING",
            "INSPENSN", "MISC", "PERSCARE", "READING",
            "TOBACCO", "TRANS"
        ];

        console.time('subcats2');

        var expends = ds.items().filter(function(i) {
            return i.item !== i.subcategory &&
            // Ensure we're only querying for items that are expenses
            // (Excludes info about income) 
            subcategories.indexOf(i.subcategory) > -1;
        }).reduce(function(acc, d) {
            var c = {
                name: d.name,
                item: d.item,
                demographic: "LB01",
                characteristic: "01"
            };

            if (ds.exists(c)) {
                acc[d.name] = ds.querySingle(c);
                // This line should not be needed, but querySingle is currently returning null 
                // subcategories for some reason 
                acc[d.name].subcategory = d.subcategory; 
            }
            return acc;
        }, {});
        console.timeEnd('subcats2');

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
            width: 800,
            height: 500,
            margin: { top: 20, right: 0, bottom: 20, left: 60 }
        };

        areachart = new Stacked("#stacked-area-chart", expends, areachartProperties);

        var timelineProperties = {
            width: 800,
            height: 50,
            margin: { top: 0, right: 0, bottom: 30, left: 60 }
        };

        timeline = new Timeline("timeline", yearDataset, timelineProperties);
    }

    function showRadar() {
        var radarDemoPicker = new DemographicPicker("radar-demo-picker");
        $("#radar-chart").append(radarDemoPicker.html());
        var radarItemPicker = new ItemPicker("radar-item-picker");
        $("#radar-chart").append(radarItemPicker.html());
        radarChart = new Radar("#radar-chart", {
            width: 600,
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
