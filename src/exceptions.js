module.exports = {
	GoogleTypeException: function (foundTypes, varName) {
		let translate = require('./translate.js').translate;
		this.foundTypes = foundTypes;
		this.varName = varName;
		this.toString = function () {
			return translate('yasr.exceptions.conflict', {key: 'varName', value: this.varName});
		};
		this.toHtml = function () {
			return translate('yasr.exceptions.conflict_render', {key: 'varName', value: '<i>' + this.varName + '</i>'});
		};
	}
}