/**
 * Created by jerclark on 4/17/16.
 */

SubcategoryPicker = function(pickerId) {

  //Get the demographic elements
  var pickerChoices = window.ds.subcategories().map(function(v){
    return {name: v.name, value: v.subcategory};
  });

  var pickerOptions = {
    pickerClass:"subcategory-picker",
    pickerName:"Survey Category",
    pickerId:pickerId,
    choices:pickerChoices
  };
  this._html = _.template($("#standard-dropdown").text())(pickerOptions);


}


SubcategoryPicker.prototype.html = function(){
  return this._html;
}

