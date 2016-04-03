// Takes an html tag name (without the <>) and value and returns the value
// wrapped inside the tag.
function tag(t, value) {
    return "<" + t + ">" + value + "</" + t + ">";
}

// Take an array of objects and output a table element. filterKeys is a
// predicate function to filter which keys (e.g. columns) get show.
function toTable(arr, filterKeys) {
    if (arr.length === 0) return tag("table", "");

    var filterKeys = filterKeys || function(){ return true; };
    var fieldnames = Object.keys(arr[0]).filter(filterKeys);
    var header =
        tag("thead",
        tag("tr", fieldnames.map(_.partial(tag, "th")).join("")));

    var values = function(d) {
        return fieldnames.reduce(function(v, k) {
            v.push(d[k]);
            return v;
        }, []);
    };

    var body =
        tag("tbody", arr
            .map(function(d) {
                return tag("tr", values(d).map(_.partial(tag, "td")).join(""))
            }).join(""));

    return tag("table class='table table-hover table-condensed table-selectable'", header + body);
}

// Returns a filtering function where field = value
function filterBy(field, value) {
    return function(d) {
        return d[field] === value;
    };
}

function containing(fields) {
    return _.partial(_.contains, fields);
}

$(function() {
    queue()
        .defer(d3.tsv, "raw/cx/cx.demographics")
        .defer(d3.tsv, "raw/cx/cx.characteristics")
        .await(showDemo);

    function showDemo(errors, demographics, characteristics) {
        console.log(demographics);
        console.log(characteristics);

        var demoFields = ["demographics_code", "demographics_text"];
        var charFields = ["demographics_code", "characteristics_code", "characteristics_text"];

        $("#demographics").html(
            toTable(demographics, containing(demoFields)));

        $("#demographics").on("click", "tr", function(e) {
            var dem_code = $(e.currentTarget).children("td").first().text();

            $(e.currentTarget).siblings().removeClass("selected");
            $(e.currentTarget).addClass("selected");

            $("#characteristics").html(toTable(characteristics.filter(function(d) {
                return d.demographics_code === dem_code;
            }), _.partial(_.contains, charFields)))
        });

        $("#demographics tbody tr").first().click();
    }

    queue()
        .defer(d3.tsv, "raw/cx/cx.subcategory")
        .defer(d3.tsv, "raw/cx/cx.item")
        .await(showItems)

    function showItems(errors, subcategory, items) {
        console.log(subcategory, items);
        var catFields = ["category_code", "subcategory_code", "subcategory_text"];
        var itemFields = ["subcategory_code", "item_code", "item_text"];

        $("#subcategories").html(toTable(subcategory, containing(catFields)));
        $("#subcategories").on("click", "tr", function(e) {
            var sub_code = $(e.currentTarget).children("td").eq(1).text();
            $(e.currentTarget).siblings().removeClass("selected");
            $(e.currentTarget).addClass("selected");

            $("#items").html(
                toTable(items.filter(filterBy("subcategory_code", sub_code)), containing(itemFields)));
        });

        $("#subcategories tbody tr").first().click();
    }

});