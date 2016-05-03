'use strict';

(function(cs171) {

    if (Object.assign === undefined) {
        Object.assign = _.extend;
    }

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
            .defer(d3.json, "data/clean/dataset.json")
            .defer(d3.json, "data/clean/presidents.json")
            .defer(d3.json, "data/events/natural.json")
            .defer(d3.json, "data/events/military.json")
            .defer(d3.json, "data/events/financial.json")

        .await(function(errors, fulldata, presidents, natural, military, financial) {

            if (errors) console.log(errors);

            this._datasets = fulldata;
            this._datasets.presidents = presidents;

            // Aggregate all the events
            // TODO: move to cleanup
            this._datasets.events = [];

            presidents.reduce(function(events, d) {
                if (d.termEnd >= 1984) {
                    events.push({
                        label: d.name + " (" + d.party + ")",
                        fromYear: d.termBegin,
                        toYear: d.termEnd,
                        type: "Political"
                    });
                }
                return events;
            }, this._datasets.events);

            natural.reduce(function(events, d) {
                events.push({
                    label: d.label,
                    fromYear: d.fromYear,
                    toYear: d.toYear || d.fromYear,
                    description: d.description || "",
                    type: "Natural Disasters"
                });
                return events;
            }, this._datasets.events);

            military.reduce(function(events, d) {
                events.push({
                    label: d.label,
                    fromYear: d.fromYear,
                    toYear: d.toYear || d.fromYear,
                    description: d.description || "",
                    type: "Military"
                });
                return events;
            }, this._datasets.events);

            financial.reduce(function(events, d) {
                events.push({
                    label: d.label,
                    fromYear: d.fromYear,
                    toYear: d.toYear || d.fromYear,
                    description: d.description || "",
                    type: "Financial"
                });
                return events;
            }, this._datasets.events);

            this._datasets.indexed = this._datasets.values.reduce(function(obj, v) {
                obj[v.id] = obj[v.id] || [];
                obj[v.id].push({
                    year: v.year,
                    value: v.value
                });
                return obj;
            });

            this.isLoaded = true;
            callback(this);

        }.bind(this));
    }

    Dataset.prototype.demographics = function() {
        return this._datasets.demographics;
    }

    Dataset.prototype.subcategories = function() {
        return this._datasets.subcategories;
    }

    Dataset.prototype.expenditures = function() {
        return _.where(this._datasets.subcategories, {
            category: "EXPEND"
        });
    }

    Dataset.prototype.characteristics = function(demographic) {
        if (demographic) {
            return _.where(this._datasets.characteristics, {
                demographic: demographic
            });
        } else {
            return this._datasets.characteristics;
        }
    }

    Dataset.prototype.subcategories = function(category) {
        if (category) {
            return _.where(this.subcategories(), {
                category: category
            });
        } else {
            return this._datasets.subcategories;
        }
    };

    Dataset.prototype.subcategory = function(subcategory) {
        return _.findWhere(this.subcategories(), {
            subcategory: subcategory
        });
    };

    Dataset.prototype.subcategoryText = function(subcategory) {
        return this.subcategory(subcategory).name;
    };



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

    Dataset.prototype.items = function(subcategory, includeTop) {
        includeTop = !!includeTop;

        if (subcategory) {
            return _.where(this._datasets.items, {
                subcategory: subcategory
            });
        } else {
            return this._datasets.items;
        }
    }

    Dataset.prototype.isSingleItemSubcategory = function(subcategory) {
        return this.items(subcategory).length === 1;
    }

    Dataset.prototype.item = function(code) {
        console.assert(code, "pass an item code to get an item");
        return _.findWhere(this.items(), {
            item: code
        });
    }

    Dataset.prototype.itemText = function(item) {
        return _.findWhere(this._datasets.items, {
            item: item
        }).name;
    };

    Dataset.prototype.demographicText = function(demographic) {
        return _.findWhere(this._datasets.demographics, {
            demographic: demographic
        }).name;
    };

    Dataset.prototype.characteristicText = function(demographic, characteristic) {
        return _.findWhere(this._datasets.characteristics, {
            demographic: demographic,
            characteristic: characteristic
        }).name;;
    };

    // Given a datum { year: 1000, value : n } adds relative values to the
    // object. Criteria should contain demo / characteristic attributes or
    // it will default to all consumer units.
    Dataset.prototype.includeRelativeValues = function(d, criteria) {
        var income = this.incomeForYear(d.year, criteria);
        var cpi = this.cpiForYear(d.year, criteria);
        return Object.assign({}, d, {
            income: income,
            valuePercentIncome: ((d.value * 100) / income),
            adjustedValue: $adjusted(d.year, d.value),
            cpi: cpi
        });
    };

    Dataset.prototype.exists = function(criteria) {
        return (this._keyFor(criteria) in this._datasets.indexed);
    };


    Dataset.prototype.singleResult = function(criteria) {
        var item = this.item(criteria.item);
        var key = this._keyFor(criteria);
        var values = this._datasets.indexed[key];

        if (!values) {
            console.assert(values, "values should be there! keys is", key);
            return undefined;
        }

        values = values.map(_.partial(this.includeRelativeValues, _, criteria), this);

        return {
            name: criteria.name,
            subcategory: item.subcategory,
            subcategoryText: this.subcategoryText(item.subcategory),
            item: criteria.item,
            itemText: this.itemText(criteria.item),
            itemCpi: item.cpi,
            demographic: criteria.demographic,
            demographicText: this.demographicText(criteria.demographic),
            characteristic: criteria.characteristic,
            characteristicText: this.characteristicText(criteria.demographic, criteria.characteristic),
            minValue: _.min(values, this.valueOf),
            maxValue: _.min(values, this.valueOf),
            values: values
        };
    };

    Dataset.prototype.valueOf = function(v) {
        return v.value;
    };

    Dataset.prototype.querySingle = Dataset.prototype.singleResult;

    // Returns n results in an object with keys corresponding the names given in the criteria
    Dataset.prototype.query = function( /* criteria, criteria, ...*/ ) {
        var args = (Array.isArray(arguments[0])) ? arguments[0] : Array.from(arguments);
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
        if (!includeAll) chars = _.reject(chars, function(d) {
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
    };



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
        console.assert(criteria.item, "you need an item code");
        console.assert(criteria.demographic, "you need a demographic");
        console.assert(criteria.characteristic, "you need a characteristic");

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
    };

    // Returns the income before taxes for a given demo / characteristic and
    // year. Defaults to everyone / all demographics.

    Dataset.prototype.incomeForYear = _.memoize(function(year, criteria) {
        return _.findWhere(this.incomes(criteria), {
            year: year
        }).value;
    }, hashCriteria);

    // Returns all the incomes for the criteria given (ignores the item code)

    Dataset.prototype.incomes = _.memoize(function(criteria) {
        criteria = Object.assign({}, criteria, INCOME_BEFORE_TAXES);
        criteria = _defaultCriteria(criteria);

        return _.where(this._datasets.values, {
            id: this._keyFor(criteria)
        }).map(YV);
    }, function(criteria) {
        return hashCriteria(null, criteria);
    });


    /**************
     * CPI RELATED QUERIES BELOW
     **************/


    // Returns all the cpi's for the criteria given
    Dataset.prototype.cpiForYear = function(year, criteria) {
        var cpiForCriteria = this.cpi(criteria);
        var cpiForYear = _.findWhere(cpiForCriteria, {
            year: year
        });
        return cpiForYear ? cpiForYear.value : 100;
    }


    // Returns all the cpi's for the criteria given
    Dataset.prototype.cpi = _.memoize(function(criteria) {
        //Make sure to populate criteria
        criteria = _defaultCriteria(criteria);

        //get the cpi for the given item across all years
        var cpiCode = this.item(criteria.item).cpiCode;
        if (cpiCode) {
            return _.where(this._datasets.cpiValues, {
                id: "CU0000" + cpiCode
            }).map(YV);
        }
    }, JSON.stringify);


    Dataset.prototype.cpiValues = function(cpiItemCode) {
        if (cpiItemCode) {
            return _.where(this.cpiValues(), {
                id: cpiItemCode
            });
        } else {
            return this._datasets.cpiValues;
        }
    };



})(window.cs171 || (window.cs171 = {}));