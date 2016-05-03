// Variables for the visualization instances
var areachart;
var timeline;
var radarChart;
var treePlot;

var SCROLL_TO_TREE = 3235;
var SCROLL_TO_CAKE = 2116;
var SCROLL_TO_RADAR = 1261;

// In SM- mode which we should use everywhere (don't want the layout
// to ever break vertically eg. become responsive.)
var COLUMN_WIDTH = 90;
var COLUMN_WIDTH_4 = COLUMN_WIDTH * 4;
var COLUMN_WIDTH_HALF = COLUMN_WIDTH * 6;
var COLUMN_WIDTH_FULL = COLUMN_WIDTH * 12;

var wrangleAll = function wrangleAll(e){
    radarChart.fetchData();
    areachart.wrangleData();
    treePlot.wrangleData();
};

$(function() {
    $('.filtering-nav').scrollToFixed();

    // Handle "scrollto" anchors to force the document to go in the right spot
    $("body").on("click", ".scrollto", function(e) {
        e.preventDefault();
        $("body").scrollTop(parseInt($(e.target).data("position"), 10));
    });

    // Handle story change for area chart
    $("body").on("story-change", function(e, section, demographic, characteristic, item) {
        if (section === "area") {
            areachart.selectItem(item);
        }
    });
});

(function(cs171) {

    var FULL_WIDTH = 1170;
    var ds = window.ds = new cs171.Dataset();

    ds.ready(function(ds) {
        showTimeline();
        showArea();
        showRadar();
        showTrees();

        var stories = new Stories({
            timeline : timeline,
            callback: wrangleAll
        }).initialize();

        // Handle brush events
        $(document).on("brushed", function(e, timeline, from, to) {
            if (areachart) {
                areachart.x.domain([from, to]);
                areachart.svg.select(".area").attr("d", areachart.area);
                areachart.svg.select(".x-axis").call(areachart.xAxis);
            }

            wrangleAll();
        });
    });

    function showTimeline() {
        var parseDate = d3.time.format("%Y").parse;
        var years = [];

        for (var i = 1984; i <= 2014; i++) {
            years.push({
                Year: parseDate("" + i)
            });
        }

        timeline = new Timeline("#timeline", years, {
            width: FULL_WIDTH,
            height: 150,
            margin: { top: 0, right: 0, bottom: 30, left: 0 },
            events: ds._datasets.events,
        });

        // When the range changes, update the timeline header
        $('#timeline').on('brushed', function(e, timeline, from, to) {
            $('.timeline-range').text(from.getFullYear() + "-" + to.getFullYear());
        });

        // Handle switching of timeline events displayed
        $("body").on("click", ".timeline-events", function(e) {
            e.preventDefault();
            $(this).children().removeClass("active");
            $(e.target).closest("li").addClass("active");
            timeline.updateVis($(e.target).text());
        });
    }

    function showArea() {
        var expenditures = _.pluck(ds.subcategories("EXPEND"), "subcategory");

        function isSingleton(s){
            var singletons = ["ALCBEVG","CASHCONT","EDUCATN","PERSCARE","READING","TOBACCO", "MISC"];
            return singletons.indexOf(s) > -1
        };

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

        var areachartProperties = {
            width: FULL_WIDTH * .75,
            height: 650,
            margin: { top: 10, right: 10, bottom: 20, left: 0 }
        };

        areachart = new Stacked("#stacked-area-chart", expends, areachartProperties);
    }

    function showRadar() {
        var radarDemoPicker = new DemographicPicker("radar-demo-picker");
        $(".radar-filter").append(radarDemoPicker.html());
        var radarItemPicker = new ItemPicker("radar-item-picker");
        $(".radar-filter").append(radarItemPicker.html());
        radarChart = new Radar("#radar-chart", {
            width: FULL_WIDTH / 2,
            height: 600,
            margin: { top: 10, bottom: 10, left: 10, right: 10 },
            showLabels: true
        });
        $("#radar-demo-picker").on("change", function() { radarChart.fetchData() });
        $("#radar-item-picker").on("change", function() { radarChart.fetchData() });

        _.defer(function() {
            radarChart.fetchData();
        });
    }

    function showTrees() {
        treePlot = new TreePlot("#vis-tree");
    }


})(window.cs171);