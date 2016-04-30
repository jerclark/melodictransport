/**
 * Created by jerclark on 4/17/16.
 */

DemographicPicker = function(pickerId) {

  //Get the demographic elements
  var pickerChoices = window.ds.demographics().map(function(v){
      return {name: v.name, value: v.demographic};
  });

  pickerChoices = _.reject(pickerChoices, {value: "LB14"});

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




ItemPicker = function(pickerId) {

  //Get the demographic elements
  var pickerChoices = window.ds.items().map(function(v){
    return {name: v.name, value: v.item};
  });

  var pickerOptions = {
    pickerClass:"item-picker",
    pickerName:"Item",
    pickerId:pickerId,
    choices:pickerChoices
  };
  this._html = _.template($("#standard-dropdown").text())(pickerOptions);


}


ItemPicker.prototype.html = function(){
  return this._html;
}

