'use strict';

function objattrs(attrs) {
    if (!attrs) return "";

    return Object.keys(attrs).reduce(function(acc, k) {
        acc.push(k + '=' + '"' + attrs[k] + '"');
        return acc;
    }, []).join(" ")
}

// Takes an html tag name (without the <>) and value and returns the value
// wrapped inside the tag.
function tag(t, value, attrs) {
    return '<' + t + " " + objattrs(attrs || {}) + '>' + value + '</' + t + '>';
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

    keys = keys || _.keys(arr[0]);
    var header = thead(tr(keys.map(th).join("")));

    var rows = arr.reduce(function(rows, d, idx) {
        var attrs = {
            'data-key-value': d[idField],
            'data-key-field': idField
        };

        var cells = keys.map(function(k) {
            return td(d[k]);
        }).join("");

        rows.push(tag('tr', cells, attrs));
        return rows;
    }, []).join("");

    var body = tbody(rows);
    return tag("table", header + body, {
        'class': 'table table-hover table-condensed table-selectable'
    });
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
        .defer(d3.tsv, "raw/cx/cx.subcategory")
        .defer(d3.tsv, "raw/cx/cx.item")
        .defer(d3.tsv, "raw/cx/cx.series")
        .defer(d3.tsv, "raw/cx/cx.data.1.AllData")
        .await(main)

    function drilldownTable(options) {
        var parentData = options.parentData;
        var parentFields = options.parentFields;
        var childrenData = options.childrenData;
        var childrenFields = options.childrenFields;

        var parentTable = $(toTable(parentData, parentFields, options.idField));
        parentTable.addClass("table-parent");
        parentTable.find("tbody tr").on("click", function(e) {
            var keyValue = $(e.currentTarget).data('key-value');
            var keyField = $(e.currentTarget).data('key-field');

            var filteredData = childrenData.filter(function(d) {
                return d[keyField] === keyValue;
            });

            var subtable = toTable(filteredData, childrenFields, keyField);

            parentTable.find(".subtable").remove();
            $('<tr class="subtable"><td colspan="' + parentFields.length + '">'
                + subtable + '</td></tr>')
                .insertAfter(e.currentTarget);
        });

        return parentTable;
    }

    // Handle selectable tables
    $("body").on("click", ".table-selectable > tbody > tr", function(e) {
        e.stopPropagation();

        var $el = $(e.currentTarget);
        $el.siblings().removeClass("selected");
        $el.addClass("selected");
        $el.trigger("row-selected", [$el.data(), $el.index()]);
    });

    function showDemo(demographics, characteristics) {
        var table = drilldownTable({
            parentData: demographics,
            parentFields: ["demographics_code", "demographics_text"],
            childrenFields: ["characteristics_code", "characteristics_text"],
            childrenData: characteristics,
            idField: "demographics_code"
        });

        $("#demographics").empty().append(table);
        $("#demographics tbody tr").first().click();
        return table;
    }

    function showItems(subcategory, items) {
        var table = drilldownTable({
            parentData: subcategory,
            parentFields:  ["category_code", "subcategory_code", "subcategory_text"],
            childrenData: items,
            childrenFields: ["subcategory_code", "item_code", "item_text"],
            idField: "subcategory_code"
        });

        $("#subcategories").empty().append(table);
        $("#subcategories tbody tr").first().click();
        return table;
    }

        // TODO: this is garbage

    function main(errors, demographics, characteristics, subcategory, items, series, dataset) {
        var demoTable = showDemo(demographics, characteristics);
        var itemsTable = showItems(subcategory, items);

        itemsTable.subcategory_code = function() {
            return itemsTable.find("tbody > tr.selected").data("key-value");
        };

        itemsTable.item_code = function() {
            return itemsTable
                .find(".subtable > td > table > tbody > tr.selected")
                .children().eq(1).text()
        };

        $('body').on('row-selected', function(e, selected, index) {

            // A series was selected, time for some delicious data
            if ($('#series *').is(e.target)) {
                showData(dataset, selected.keyValue);
            }
            else {
                // One of the filters has been selected, try to update the series

                var subcategory_code = itemsTable.subcategory_code();
                var category_code = itemsTable.find("tbody > tr.selected").children().first().text();
                var item_code = itemsTable.item_code();

                var demographics_code = demoTable.find("tbody > tr.selected").data("key-value");
                var characteristics_code = demoTable.find(".subtable > td > table > tbody > tr.selected")
                    .children().eq(0).text();

                updateSeries(series, category_code, subcategory_code, item_code, demographics_code, characteristics_code);
            }
        });
    }

    function updateSeries(
        series,
        category_code,
        subcategory_code,
        item_code,
        demographics_code,
        characteristics_code) {

        console.log('updateSeries', Array.from(arguments));

        // Make sure each thing we need is selected
        console.assert(category_code);
        console.assert(subcategory_code);
        console.assert(item_code);
        console.assert(demographics_code);
        console.assert(characteristics_code);

        var availableSeries = _.where(series, {
            category_code: category_code,
            subcategory_code: subcategory_code,
            demographics_code: demographics_code,
            characteristics_code: characteristics_code
        });

        var table = $(toTable(availableSeries,
            ["series_title", "begin_year", "end_year"], "series_id"));

        $("#series").empty().append(table);
    }

    function showData(dataset, series_id) {
        var data = _.chain(dataset)
            .where({
                series_id: series_id
            })
            .sortBy('year')
            .value();

        var table = $(toTable(data, ['year', 'value'], 'series_id'));
        $("#data").empty().append(table);
    }

});