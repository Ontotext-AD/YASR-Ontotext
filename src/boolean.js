'use strict';
var $ = require("jquery");

/**
 * Constructor of plugin which displays boolean info
 * 
 * @param yasr {object}
 * @param parent {DOM element}
 * @param options {object}
 * @class YASR.plugins.boolean
 * @return yasr-boolean (doc)
 * 
 */
var root = module.exports = function(yasr) {
    // load and register the translation service providing the locale config
    yasr.translate = require('./translate.js').translate;

	var container = $("<div class='booleanResult'></div>");
	var plugin = {
		id: 'boolean',
		name: null,//don't need to set this: we don't show it in the selection widget anyway, so don't need a human-friendly name
		hideFromSelection: true,
		getPriority: 1,
	}
	plugin.options = $.extend(true, {}, yasr.options.pluginsOptions ? yasr.options.pluginsOptions[plugin.id] : {});

	plugin.draw = function() {
		container.empty().appendTo(yasr.resultsContainer);
		var booleanVal = yasr.results.getBoolean();
		
		var imgId = null;
		var textVal = null;
		if (booleanVal === true) {
			imgId = "check";
			textVal = yasr.translate('yasr.boolean.true');
		} else if (booleanVal === false) {
			imgId = "cross";
			textVal = yasr.translate('yasr.boolean.false');
		} else {
			container.width("140");
			textVal = yasr.translate('yasr.boolean.no_boolean');
		}
		
		//add icon
		if (imgId) require("yasgui-utils").svg.draw(container, require('./imgs.js')[imgId]);
		
		$("<span></span>").text(textVal).appendTo(container);
	};

	plugin.canHandleResults = function(){return yasr.results.getBoolean && (yasr.results.getBoolean() === true || yasr.results.getBoolean() == false);};

	return plugin;
};

root.version = {
	"YASR-boolean" : require("../package.json").version,
	"jquery": $.fn.jquery,
};

