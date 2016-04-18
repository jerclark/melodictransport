/**
 * Created by jerclark on 4/17/16.
 */

DemographicPicker = function(pickerId) {

  //Get the demographic elements
  var pickerChoices = window.ds.demographics().map(function(v){
    return {name: v.name, value: v.demographic};
  });

  var pickerOptions = {
    pickerClass:"demographic-picker",
    pickerName:"Demographic Category",
    pickerId:pickerId,
    choices:pickerChoices
  };
  this._html = _.template($("#standard-dropdown").text())(pickerOptions);


}


DemographicPicker.prototype.html = function(){
  return this._html;
}

