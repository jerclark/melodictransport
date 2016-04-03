// Takes an html tag name (without the <>) and value and returns the value
// wrapped inside the tag.
function tag(t, value) {
    return "<" + t + ">" + value + "</" + t + ">";
}

var th = _.partial(tag, "th");
var tr = _.partial(tag, "tr");
var td = _.partial(tag, "td");
var tbody = _.partial(tag, "tbody");
var thead = _.partial(tag, "thead");
var table = _.partial(tag, "table");

// Take an array of objects and output a table element. filterKeys is a
// predicate function to filter which keys (e.g. columns) get show.
function toTable(arr, keys, idField) {
    if (arr.length === 0) return tag("table", "");
    var toString = function(arr){ return arr.join("") };

    keys = keys || _.keys(arr[0]);
    arr = arr.map(_.partial(_.pick, _, keys));

    var header = thead(tr(keys.map(th).join("")));

    // fine line between clever and stupid
    var body = tbody(arr
        .map(_.values)
        .map(_.partial(_.map, _, td)).map(toString)
        .map(tr).join(""));

    return tag("table class='table table-hover table-condensed table-selectable'", header + body);
}

// Returns a filtering function where field = value
function filterBy(field, value) {
    return function(d) {
        return d[field] === value;
    };
}

$(function() {
    queue()
        .defer(d3.tsv, "raw/cx/cx.demographics")
        .defer(d3.tsv, "raw/cx/cx.characteristics")
        .await(showDemo);

    function drilldownTable(options) {
        var parentData = options.parentData;
        var parentFields = options.parentFields;
        var childrenData = options.childrenData;
        var childrenFields = options.childrenFields;
        var idLocator = options.idLocator;
        var idField = options.idField;

        var parentTable = $(toTable(parentData, parentFields));
        parentTable.addClass("table-parent");
        parentTable.find("tbody tr").on("click", function(e) {
            var id = idLocator(e.currentTarget);
            var filteredData = childrenData.filter(function(d) {
                return d[idField] === id;
            });
            var subtable = toTable(filteredData, childrenFields);

            parentTable.find(".subtable").remove();
            $('<tr class="subtable"><td colspan="' + parentFields.length + '">'
                + subtable + '</td></tr>')
                .insertAfter(e.currentTarget);
        });

        return parentTable;
    }

    // Handle selectable tables
    $("body").on("click", ".table-selectable tbody tr", function(e) {
        $(e.currentTarget).siblings().removeClass("selected");
        $(e.currentTarget).addClass("selected");
        $(e.currentTarget).trigger("row-selected", e.currentTarget);
    });

    function showDemo(errors, demographics, characteristics) {
        var table = drilldownTable({
            parentData: demographics,
            parentFields: ["demographics_code", "demographics_text"],
            childrenFields: ["characteristics_code", "characteristics_text"],
            childrenData: characteristics,
            idLocator: function(tr) {
                return $(tr).children("td").first().text();
            },
            idField: "demographics_code"
        });

        $("#demographics").empty().append(table);
        $("#demographics tbody tr").first().click();
    }

    queue()
        .defer(d3.tsv, "raw/cx/cx.subcategory")
        .defer(d3.tsv, "raw/cx/cx.item")
        .await(showItems)

    function showItems(errors, subcategory, items) {
        var table = drilldownTable({
            parentData: subcategory,
            parentFields:  ["category_code", "subcategory_code", "subcategory_text"],
            childrenData: items,
            childrenFields: ["subcategory_code", "item_code", "item_text"],
            idLocator: function(tr) {
                return $(tr).children("td").eq(1).text();
            },
            idField: "subcategory_code"
        });

        $("#subcategories").empty().append(table);
        $("#subcategories tbody tr").first().click();
    }

    queue()
        .defer(d3.tsv, "raw/cx/cx.series")
        .await(function(errors, series) {
            console.log("series loaded", series);
        });
});