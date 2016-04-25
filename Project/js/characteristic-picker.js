/**
 * Created by jerclark on 4/17/16.
 */

CharacteristicPicker = function(pickerId, demographic) {

  this.pickerId = pickerId;
  this.updatePicker(demographic);

}


CharacteristicPicker.prototype.html = function(){
  return this._html;
}




CharacteristicPicker.prototype.updatePicker = function(demographic){

  var pickerChoices = window.ds.characteristics(demographic).map(function(v){
    return {name: v.name, value: v.characteristic};
  });

  var pickerOptions = {
    pickerClass:"characteristic-picker",
    pickerName:"Demographic Characteristic",
    pickerId:this.pickerId,
    choices: pickerChoices
  };

  this._html = _.template($("#standard-dropdown").text())(pickerOptions);

}



//ItemPicker = function(pickerId) {
//
//  //Get the demographic elements
//  var pickerChoices = window.ds.items().map(function(v){
//    return {name: v.name, value: v.item};
//  });
//
//  var pickerOptions = {
//    pickerClass:"item-picker",
//    pickerName:"Item",
//    pickerId:pickerId,
//    choices:pickerChoices
//  };
//  this._html = _.template($("#standard-dropdown").text())(pickerOptions);
//
//
//}
//
//
//ItemPicker.prototype.html = function(){
//  return this._html;
//}

