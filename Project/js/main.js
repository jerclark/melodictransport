// Variables for the visualization instances
var areachart;
var timeline;
var radarChart;
var treePlot;

function updateStories() {
    var stories = ["#getting-old", "#old-entertainment"];
    stories.forEach(function(el, idx) {
        var el = el;
        var button = $("<button/>")
            .addClass("btn btn-primary")
            .text(idx)
            .click(function(e) {
                var story = $(el);
                var demographic = story.data('demographic');
                var item = story.data('item');

                $("#radar-demo-picker").val(demographic);
                $("#radar-item-picker").val(item);

                $(".current-story").html($(el).html());
                radarChart.fetchData();
            });

        $(".story-picker").append(button);
    });

    $(".stories").find("button").first().click();
}

$(function() {
    $('.filtering-nav').scrollToFixed();
    // Story picker
    // TODO MOVE

});

(function(cs171) {

    var FULL_WIDTH = 1366;
    var ds = window.ds = new cs171.Dataset();

    ds.ready(function(ds) {
        showArea();
        showRadar();
        showTrees();
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


        console.log(expends);
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
            margin: { top: 0, right: 0, bottom: 30, left: 0 },
            events: ds._datasets.presidents,
            yearBuffer: 2
        };

        console.log('yeardataset', yearDataset);
        timeline = new Timeline("#timeline", yearDataset, timelineProperties);
    }


    function showRadar() {
        var radarDemoPicker = new DemographicPicker("radar-demo-picker");
        $(".stories").append(radarDemoPicker.html());
        var radarItemPicker = new ItemPicker("radar-item-picker");
        $(".stories").append(radarItemPicker.html());
        radarChart = new Radar("#radar-chart", {
            width: FULL_WIDTH / 2,
            height: 600,
            margin: { top: 10, bottom: 10, left: 10, right: 10 },
            showLabels: false
        });
        $("#radar-demo-picker").on("change", function() { radarChart.fetchData() });
        $("#radar-item-picker").on("change", function() { radarChart.fetchData() });

        $(function() {
            updateStories();
            radarChart.fetchData();
        })
    }


    function showTrees(){
        treePlot = new TreePlot("#vis-tree");
    }

    // Handle brush events
    $(document).on("brushed", function(e, timeline) {
        areachart.x.domain(timeline.brush.empty()
            ? timeline.xContext.domain() : timeline.brush.extent());

        areachart.svg.select(".area").attr("d", areachart.area);
        areachart.svg.select(".x-axis").call(areachart.xAxis);

        // TODO: recalculate the data here in the controller instead
        areachart.wrangleData();
        radarChart.wrangleData();
        treePlot.wrangleData();
    });



})(window.cs171);

