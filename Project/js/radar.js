
/*
 *  Radar - Object constructor function
 *  @param _parentElement   -- HTML element in which to draw the visualization
 *  @param _data            -- Array with all stations of the bike-sharing network
 */

Radar = function(_parentElement, _data) {

    this.parentElement = _parentElement;
    this.data = _data;

    this.initVis();
}


/*
 *  Initialize station map
 */

Radar.prototype.initVis = function() {
    var vis = this;

    vis.wrangleData();
}


/*
 *  Data wrangling
 */

Radar.prototype.wrangleData = function() {
    var vis = this;

    // Currently no data wrangling/filtering needed
    // vis.displayData = vis.data;

    // Update the visualization
    vis.updateVis();

}


/*
 *  The drawing function
 */

Radar.prototype.updateVis = function() {

}
