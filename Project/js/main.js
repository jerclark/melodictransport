// Variables for the visualization instances
var areachart;
var timeline; 


(function(cs171) {

    var ds = window.ds = new cs171.Dataset();

    ds.ready(function(ds) {

        // Get the data for beef (for everyone)
        var beef = ds.query({
            item: "BEEF"
        });

        console.log("beef", beef);

        // Get the data for the percentage of howeowners with a mortgage
        // aged 25-34 and place it under the "mortgages25" key

        var mortgageCriteria = {
            name: "mortgages25",
            item: "980230",
            demographic: "LB04",
            characteristic: "02"
        };

        var mortgages = ds.query(mortgageCriteria);
        console.log("mortgages", mortgages);


        // Get two datasets: the income after taxes of respondents under
        // 25 and the mortgages information we got before earlier

        var incomeCriteria = {
            name: "income25",
            item: "INCAFTTX",
            demographic: "LB04",
            characteristic: "02"
        };

        var mortgagesAndIncomes = ds.query(mortgageCriteria, incomeCriteria);
        console.log("multiple", mortgagesAndIncomes);


        // Advanced example
        // Merge the money spent on property taxes + mortgage
        // interest and charges + housing costs (i assume it means the actual
        // mortgage payments) into a "allhousing" serie, for the < 25 demographic
        // as before, inluding the data from previous sets

        var mergedCriteria = [{
            name: "housing",
            demographic: "LB04", // < 25 age demo
            characteristic: "02",
            item: "HOUSING" // housing costs
        }, {
            name: "mortgateinterest",
            demographic: "LB04", // < 25 age demo
            characteristic: "02",
            item: "OWNMORTG" // mortage interest and charges
        }, {
            name: "propertytaxes",
            demographic: "LB04", // < 25 age demo
            characteristic: "02",
            item: "220211" // property taxes
        }];

        var nice = ds.query(mortgageCriteria, incomeCriteria, mergedCriteria);
        console.log("advanced", nice);


        //Get item data for all characteristics for a particlar demographic
        var numVehiclesByHousingType = ds.queryDemographic({
            demographic: "LB08",
            item: "VEHICLES"
        });

        console.log("all-demographic", numVehiclesByHousingType);


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


        // Show beef consumption radar per age
        var beefdata = ds.queryDemographic({
            demographic: "LB04",
            item: "BEEF"
        });


        console.log("toDimensions", ds.toDimensions(beefdata));

        var radarDemoPicker = new DemographicPicker("radar-demo-picker");
        $(".vis-radar").append(radarDemoPicker.html());
        var radar = new Radar(".vis-radar");
        $("#radar-demo-picker").on("change", function(){ radar.wrangleData() });


    });


})(window.cs171);

function brushed() {
    areachart.x.domain(timeline.brush.empty() ? timeline.xContext.domain() : timeline.brush.extent());
    areachart.svg.select(".area").attr("d", areachart.area);
    areachart.svg.select(".x-axis").call(areachart.xAxis);
    areachart.wrangleData();
}