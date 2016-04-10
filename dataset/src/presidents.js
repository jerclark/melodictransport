// console script to run inside the
// http://www.enchantedlearning.com/history/us/pres/list.shtml website
// to extract the data and dump to json

var presidentsTable = (document.querySelectorAll("table")[8])

var rows = Array.from(presidentsTable.querySelectorAll("tr"));
// Get rid of the header row
rows.shift();

function cleanup(p) {
    var term = p.term.split("-");
    term[0] = parseInt(term[0], 10);
    term[1] = term[1] || term[0];
    term[1] = parseInt(term[1], 10);
    term[1] = isNaN(term[1]) ? 2017 : term[1];

    return {
        name: p.name.replace(/[^a-zA-Z\s]/g, ""),
        party: p.party,
        termBegin: term[0],
        termEnd: term[1],
        vp: p.vp
    };
}


var dataset = rows.reduce(function(dataset, row) {
    var columns = Array.from(row.querySelectorAll("td"));
    var name = columns[0].textContent;
    var party = columns[1].textContent;
    var term = columns[2].textContent;
    var vp = columns[3].textContent;

    dataset.push({
        name: name,
        party: party,
        term: term,
        vp: vp
    });

    return dataset;
}, []).map(cleanup);

console.log(dataset);
console.log(JSON.stringify(dataset));
