'use strict';

(function(cs171) {

    var INCOME_BEFORE_TAXES = {
        item: "INCBEFTX"
    };
    var YV = function(d) {
        return {
            year: d.year,
            value: d.value
        };
    }
    var $adjusted = cs171.$adjusted;

    // Trim every value of each key in an object
    function trim(obj) {
        return Object.keys(obj).reduce(function(o, k) {
            o[k] = (o[k] || "").trim()
            return o;
        }, obj);
    }

    function typeValue(d) {
        d.year = parseInt(d.year, 10);
        d.value = parseFloat(d.value);
        return d;
    }

    // Returns a filtering function where field = value
    function filterBy(field, value) {
        return function(d) {
            return d[field] === value;
        };
    }

    var Dataset = cs171.Dataset = function Dataset() {
        this.isLoaded = false;
        this._datasets = null;
    }

    Dataset.prototype.ready = function(callback) {
        if (this.isLoaded) {
            callback(this);
        } else {
            this._loadData(callback);
        }
    }

    Dataset.prototype._loadData = function(callback) {

        queue()
            .defer(d3.tsv, "data/cx/cx.demographics")
            .defer(d3.tsv, "data/cx/cx.characteristics")
            .defer(d3.tsv, "data/cx/cx.subcategory")
            .defer(d3.tsv, "data/cx/cx.item")
            .defer(d3.tsv, "data/cx/cx.data.1.AllData")
            .defer(d3.json, "data/events/disasters.json")
            .defer(d3.json, "data/events/presidents.json")

        .await(function(errors,
            demographics,
            characteristics,
            subcategories,
            items,
            values,

            /* events */
            disasters,
            presidents) {

            if (errors) console.log(errors);

            // TODO: clean up in Node, dump to JSON

            demographics = demographics.map(trim);
            characteristics = characteristics.map(trim);
            subcategories = subcategories.map(trim);
            items = items.map(trim);
            values = values.map(trim).map(typeValue);

            this._datasets = {
                demographics: demographics,
                characteristics: characteristics,
                subcategories: subcategories,
                items: items,
                values: values,
                disasters: disasters,
                presidents: presidents
            };

            this.isLoaded = true;

            callback(this);

        }.bind(this));
    }


    Dataset.prototype.demographics = function() {
        var t = function(d) {
            return {
                demographic: d.demographics_code,
                name: d.demographics_text
            };
        }
        return this._datasets.demographics.map(t);
    }


    Dataset.prototype.characteristics = function(demographic) {
        var t = function(d) {
            return {
                demographic: d.demographics_code,
                characteristic: d.characteristics_code,
                name: d.characteristics_text
            };
        }

        if (demographic) {
            return _.where(this._datasets.characteristics, {
                demographics_code: demographic
            }).map(t);
        }
        else {
            return this._datasets.characteristics.map(t);
        }
    }


    // Merges two or more datasets together. The "name" of the resulting
    // dataset is "dataset 1 name-dataset 2 name": all the names with
    // dashes between them. The values are added indiscriminately
    Dataset.prototype.merge = function( /* criteria, criteria */ ) {
        var args = Array.from(arguments);
        var results = args.map(this.singleResult, this);

        var merged = results.reduce(function(obj, result) {
            obj.names.push(result.name);
            // obj.totals.push(_.pluck(result.values, "value"));

            // TODO: ensure ordering / use a hash instead of array
            obj.values = result.values.map(function(v, idx) {
                return {
                    year: v.year,
                    value: ((obj.values[idx] || {}).value || 0) + v.value
                };
            });

            return obj;
        }, {
            values: [],
            names: []
        });

        merged.values = merged.values.map(this.includeRelativeValues, this);
        merged.name = merged.names.join("-");
        return merged;
    };

    var _defaultCriteria = function(criteria) {
        console.assert(criteria.item, "item is mandatory in the criteria");

        // Copy the object first
        criteria = Object.assign({}, criteria);

        if (!criteria.demographic) criteria.demographic = "LB01";
        if (!criteria.characteristic) criteria.characteristic = "01";
        if (!criteria.name) criteria.name = "data";
        return criteria;
    };

    // If subcategory is not give, returns every item code

    Dataset.prototype.items = function(subcategory) {
        var t = function(d) {
            return {
                item: d.item_code,
                name: d.item_text,
                subcategory: d.subcategory_code
            };
        }

        if (subcategory) {
            return _.chain(this._datasets.items)
                .where({
                    subcategory_code: subcategory
                })
                .map(t)
                .value()
        } else {
            return this._datasets.items.map(t);
        }
    }

    Dataset.prototype.itemText = function(item) {
        return _.findWhere(this._datasets.items, {
            item_code: item
        }).item_text;
    };

    Dataset.prototype.demographicText = function(demographic) {
        return _.findWhere(this._datasets.demographics, {
            demographics_code: demographic
        }).demographics_text;
    };

    Dataset.prototype.characteristicText = function(demographic, characteristic) {
        return _.findWhere(this._datasets.characteristics, {
            demographics_code: demographic,
            characteristics_code: characteristic
        }).characteristics_text;;
    };

    // Given a datum { year: 1000, value : n } adds relative values to the
    // object. Criteria should contain demo / characteristic attributes or
    // it will default to all consumer units.
    Dataset.prototype.includeRelativeValues = function(d, criteria) {
        var income = this.incomeForYear(d.year, criteria);
        return Object.assign({}, d, {
            income: income,
            valuePercentIncome: ((d.value * 100) / income),
            adjustedValue: $adjusted(d.year, d.value)
        });
    };

    Dataset.prototype.singleResult = function(criteria) {
        return {
            name: criteria.name,
            item: criteria.item,
            itemText: this.itemText(criteria.item),
            demographic: criteria.demographic,
            demographicText: this.demographicText(criteria.demographic),
            characteristic: criteria.characteristic,
            characteristicText: this.characteristicText(criteria.demographic, criteria.characteristic),
            values: _.where(this._datasets.values, {
                    series_id: this._keyFor(criteria)
                })
                .map(YV)
                .map(_.partial(this.includeRelativeValues, _, criteria), this)
        };
    };

    // Returns n results in an object with keys corresponding the names given in the criteria
    Dataset.prototype.query = function( /* criteria, criteria, ...*/ ) {
        var args = Array.from(arguments);
        console.assert(args.length > 0, "you need to pass some criteria here");

        return args.reduce(function(result, criteria) {

            // Deal with merged criteria
            if (Array.isArray(criteria)) {
                criteria = criteria.map(_defaultCriteria);
                var merged = this.merge.apply(this, criteria);
                result[merged.name] = merged;
            } else {
                criteria = _defaultCriteria(criteria);
                result[criteria.name] = this.singleResult(criteria);
            }

            return result;
        }.bind(this), {});
    }

    // Given a demographic and item code returns a dataset that contains
    // each characteristic and their values.
    // The object keys and names look like
    // LB04-01-Textutal Description
    // demographic-characteristic code-characteristic text

    // if the criteria has a a flag "includeAll" set to true, we also
    // return the 01- all consumer units as part of the result. By default
    // it is NOT included.

    Dataset.prototype.queryDemographic = function(criteria) {
        console.assert(criteria.demographic, "need a demographic");
        console.assert(criteria.item, "need an item");

        var demographic = criteria.demographic;
        var item = criteria.item;
        var includeAll = !!criteria.includeAll;

        var chars = this.characteristics(demographic);
        if (!includeAll) chars = _.reject(chars, function(d){
            return d.characteristic === "01"
        });

        var criteria = chars.map(function(c) {
            return {
                name: (demographic + "-" + c.characteristic + "-" + c.name),
                item: item,
                demographic: demographic,
                characteristic: c.characteristic
            }
        });

        return this.query.apply(this, criteria);
    }

    // Takes the result of queryDemographic and flips the results
    // to have the demographics be the keys
    Dataset.prototype.toDimensions = function(data) {
        return Object.keys(data).map(function(k) {
            var d = data[k];
            return {
                dimension: k,
                value: d.values[0].adjustedValue,
                values: d.values
            };
        });
    };

    Dataset.prototype._keyFor = function(criteria) {
        console.assert(criteria.item);
        console.assert(criteria.demographic);
        console.assert(criteria.characteristic);

        var k = "CXU";
        k += criteria.item;
        k += criteria.demographic;
        k += criteria.characteristic;
        k += "M"; // process code
        return k;
    };

    var hashCriteria = function(year, criteria) {
        criteria = Object.assign({}, criteria, INCOME_BEFORE_TAXES);
        criteria = _defaultCriteria(criteria);
        if ("name" in criteria) delete criteria.name;
        return (year ? year.toString() + "|" : "") + JSON.stringify(criteria);
    }

    // Returns the income before taxes for a given demo / characteristic and
    // year. Defaults to everyone / all demographics.

    Dataset.prototype.incomeForYear = _.memoize(function(year, criteria) {
        return _.findWhere(this.incomes(), {
            year: year
        }).value;
    }, hashCriteria);

    // Returns all the incomes for the criteria given (ignores the item code)

    Dataset.prototype.incomes = _.memoize(function(criteria) {
        criteria = Object.assign({}, criteria, INCOME_BEFORE_TAXES);
        criteria = _defaultCriteria(criteria);

        return _.where(this._datasets.values, {
            series_id: this._keyFor(criteria)
        }).map(YV);
    }, function(criteria) {
        return hashCriteria(null, criteria);
    });


})(window.cs171 || (window.cs171 = {}));