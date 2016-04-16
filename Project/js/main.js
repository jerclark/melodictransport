
(function(cs171) {

    var ds = window.ds = new cs171.Dataset();

    ds.ready(function(ds) {

        // Get the data for beef (for everyone)
        var beef = ds.for({
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

        var mortgages = ds.for(mortgageCriteria);
        console.log("mortgages", mortgages);


        // Get two datasets: the income after taxes of respondents under
        // 25 and the mortgages information we got before earlier

        var incomeCriteria = {
            name: "income25",
            item: "INCAFTTX",
            demographic: "LB04",
            characteristic: "02"
        };

        var mortgagesAndIncomes = ds.for(mortgageCriteria, incomeCriteria);
        console.log(mortgagesAndIncomes);


        // Advanced example
        // Merge the money spent on property taxes + mortgage
        // interest and charges + housing costs (i assume it means the actual
        // mortgage payments) into a "allhousing" serie, for the < 25 demographic
        // as before, inluding the data from previous sets

        var mergedCriteria = [{
            name: "housing",
            demographic: "LB04",    // < 25 age demo
            characteristic: "02",
            item: "HOUSING"    // housing costs
        }, {
            name: "mortgateinterest",
            demographic: "LB04",    // < 25 age demo
            characteristic: "02",
            item: "OWNMORTG"  // mortage interest and charges
        }, {
            name: "propertytaxes",
            demographic: "LB04",    // < 25 age demo
            characteristic: "02",
            item: "220211"  // property taxes
        }];

        var nice = ds.for(mortgageCriteria, incomeCriteria, mergedCriteria);
        console.log("advanced", nice);
    });


})(window.cs171);

