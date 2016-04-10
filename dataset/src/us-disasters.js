// console script to extract data from the emdat database
// http://www.emdat.be/disaster_list/index.html

// Easiest way here is to use the developer tools to capture the
// request being made and then paste it here.
'use strict';

const got = require('got');
const fs = require('fs');

const url = 'http://www.emdat.be/disaster_list/php/search.php?_dc=1460326401806&continent=&region=&iso=USA&from=1900&to=2015&group=Climatological%27%2C%27Complex%20Disasters%27%2C%27Geophysical%27%2C%27Hydrological%27%2C%27Extra-terrestrial%27%2C%27Meteorological%27%2C%27Technological%27%2C%27Biological&type=&options=total_affected%2Ctotal_dam%2Ctotal_deaths&page=1&start=0&limit=25';

got(url, { json: true })
    .then(response => {
        let data = response.body.data;
        console.log('DATA', Object.keys(data));

        function yearOf(d) {
            return d ? parseInt(d.split("/")[2], 10) : null;
        }

        var cleandata = data.reduce((acc, dis) => {
            var obj = {
                fromYear: yearOf(dis.start_date),
                toYear: yearOf(dis.end_date),
                location: dis.location,
                type: dis.dis_type,
                subtype: dis.dis_subtype,
                deaths: parseInt(dis.total_deaths, 10),
                affected: parseInt(dis.total_affected, 10),
                damage: parseInt(dis.total_dam, 10),
            };
            acc.push(obj);
            return acc;
        }, []);

        fs.writeFileSync("events/disasters.json", JSON.stringify(cleandata, null, 4), "utf-8");
    });

        //     "start_date": "08\/09\/1900",
        // "end_date": "08\/09\/1900",
        // "country_name": "United States of America (the)",
        // "iso": "USA",
        // "location": "Galveston (Texas)",
        // "dis_type": "Storm",
        // "dis_subtype": "Tropical cyclone",
        // "total_deaths": "6000",
        // "total_affected": "0",
        // "total_dam": "30000",
        // "insur_dam": "0",
        // "disaster_no": "1900-0003",
        // "associated_dis": "--",
        // "associated_dis2": "--"