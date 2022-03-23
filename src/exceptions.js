module.exports = {
	GoogleTypeException:  function(foundTypes, varName) {
	   this.foundTypes = foundTypes;
	   this.varName = varName;
	   this.toString = function() {
		  return yasr.translate('yasr.exceptions.conflict', {key: varName, value: this.varName});
	   };
	   this.toHtml = function() {
	      return yasr.translate('yasr.exceptions.conflict_render', {key: varName, value: '<i>' + this.varName + '</i>'});
	   };
	}
}