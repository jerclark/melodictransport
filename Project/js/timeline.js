/*
 * Timeline - Object constructor function
 * @param _parentElement    -- the HTML element in which to draw the visualization
 * @param _data                     -- the
 */
var parseDate = d3.time.format("%Y").parse;

Timeline = function(parentElement, data, properties) {
    this.parentElement = parentElement;
    this.data = data;
    this.displayData = this.data;
    this.eventsData = properties.events;
    this.properties = properties;
    this.initVis();
}

// Updates the timeline by redrawing the brush
Timeline.prototype.updateVis = function() {
    var selection = this.svg.select(".x.brush");
    selection.call(this.brush);
    this.brush.event(selection);
    return this;
};

// Return a two item array with the from / to years
Timeline.prototype.selectedRange = function() {
    return this.brush.empty() ? this.xContext.domain() : this.brush.extent()
};

// Returns the beginning of the selected range (year)
Timeline.prototype.selectedBegin = function() {
    return this.selectedRange()[0];
}

// Returns the beginning of the selected range (year)
Timeline.prototype.selectedEnd = function() {
    return this.selectedRange()[1];
};

// Sets the current range and redraws
Timeline.prototype.setYearRange = function(from, to) {
    this.brush.extent([parseDate('' + from), parseDate('' + to)]);
    return this.updateVis();
};

/*
 * Initialize area chart with brushing component
 */

Timeline.prototype.initVis = function() {
    var vis = this;

    vis.margin = vis.properties.margin;
    vis.width = vis.properties.width - vis.margin.left - vis.margin.right,
        vis.height = vis.properties.height - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select(vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    var yearsExtent = d3.extent(vis.displayData, function(d) {
        return d.Year;
    });

    // Scales and axes
    vis.x = d3.time.scale()
        .range([0, vis.width])
        .domain(yearsExtent);

    vis.y = d3.scale.linear()
        .range([vis.height, 0])

    vis.xAxis = d3.svg.axis()
        .scale(vis.x)
        .orient("bottom");

    // SVG area path generator
    vis.area = d3.svg.area()
        .x(function(d) {
            return vis.x(d.Year);
        })
        .y0(vis.height)
        .y1(function(d) {
            return -vis.height;
        });

    vis.svg.append("path")
        .datum(vis.displayData)
        .attr("fill", "transparent")
        .attr("d", vis.area);

    // Initialize time scale (x-axis)
    var xContext = d3.time.scale()
        .range([0, vis.width])
        .domain(yearsExtent);

    vis.xContext = xContext;

    // Initialize brush component
    var brush = d3.svg.brush()
        .x(xContext)
        .on("brush", function() {
            $(this.parentElement).trigger('brushed', [this, this.selectedBegin(), this.selectedEnd()]);
        }.bind(this));

    vis.brush = brush;

    // Append brush component
    vis.svg.append("g")
        .attr("class", "x brush")
        .call(brush)
        .selectAll("rect")
        .attr("fill", "#424242")
        .attr("opacity", 0.8)
        .attr("y", -6)
        .attr("height", vis.height + 7);

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")")
        .call(vis.xAxis);

    // Event markers
    var evdata = this.eventsData.filter(function(d) {
        var from = yearsExtent[0].getFullYear();
        var to = yearsExtent[1].getFullYear();

        return (d.termBegin >= from && d.termBegin <= to) ||
            (d.termEnd <= to && d.termEnd >= from)
    });


    var linex = function(d) {
        return xContext(parseDate('' + d.termBegin));
    };

    function translate(x, y) {
        return "translate(" + x + ", " + y + ")";
    }

    var eventMarkers = vis.svg
        .append("g")
        .attr("class", "event-markers")
        .selectAll("line.event-marker")
        .data(evdata)
        .enter()
        .append("g")
        .attr("transform", function(d) {
            var x = linex(d);
            if (x < 0) {
                x = 0;
            }
            return translate(x, 0);
        });

    eventMarkers
        .append("line")
        .attr("stroke", function(d) {
            if (linex(d) < 0) return "transparent";

            return d.party === "Republican" ? "red" : "blue";
        })
        .attr("stroke-width", 2)
        .attr("class", "event-marker")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", 0)
        .attr("y2", vis.height)

    eventMarkers
        .append("text")
        .attr("transform", translate(10, 20))
        .text(function(d) {
            return d.name.trim();
        });

    console.log(evdata);
}