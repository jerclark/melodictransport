
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