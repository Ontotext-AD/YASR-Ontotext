'use strict';
var $ = require("jquery");
var utils = require("yasgui-utils");
console = console || {"log":function(){}};//make sure any console statements don't break in IE

require('./jquery/extendJquery.js');


/**
 * Main YASR constructor
 * 
 * @constructor
 * @param {DOM-Element} parent element to append editor to.
 * @param {object} settings
 * @class YASR
 * @return {doc} YASR document
 */
var root = module.exports = function(parent, options, queryResults) {

	
	var yasr = {};
	yasr.options = $.extend(true, {}, root.defaults, options);
	
	yasr.container = $("<div class='yasr'></div>").appendTo(parent);
	yasr.header = $("<div class='yasr_header'></div>").appendTo(yasr.container);
	yasr.resultsContainer = $("<div class='yasr_results'></div>").appendTo(yasr.container);
	yasr.storage = utils.storage;
	
	var prefix = null;
	yasr.getPersistencyId = function(postfix) {
		if (prefix === null) {
			//instantiate prefix
			if (yasr.options.persistency && yasr.options.persistency.prefix) {
				prefix = (typeof yasr.options.persistency.prefix == 'string'? yasr.options.persistency.prefix : yasr.options.persistency.prefix(yasr));
			} else {
				prefix = false;
			}
		}
		if (prefix && postfix) {
			return prefix + (typeof postfix == 'string'? postfix : postfix(yasr));
		} else {
			return null;
		}
	};
	
	if (yasr.options.useGoogleCharts) {
		//pre-load google-loader
		require('./gChartLoader.js')
			.once('initError', function(){yasr.options.useGoogleCharts = false})
			.init();
	}
	
	//first initialize plugins
	yasr.plugins = {};
	for (var pluginName in root.plugins) {
		if (!yasr.options.useGoogleCharts && pluginName == "gchart") continue; 
		yasr.plugins[pluginName] = new root.plugins[pluginName](yasr);
	}
	
	
	yasr.updateHeader = function() {
		var downloadIcon = yasr.header.find(".yasr_downloadIcon")
				.removeAttr("title");//and remove previous titles
		var saveAsButton = yasr.header.find(".saveAsDropDown");
		var embedButton = yasr.header.find(".yasr_embedBtn");
		var outputPlugin = yasr.plugins[yasr.options.output];
		if (outputPlugin) {
			// Show our SaveAs for table view
			if (outputPlugin.name == 'Table') {
				downloadIcon.hide();
				// jquery show puts display:block and moves the element
				saveAsButton.removeAttr("style");
			} else {
				saveAsButton.hide();
				downloadIcon.show();
			}
						
			//Manage download link
			var info = (outputPlugin.getDownloadInfo? outputPlugin.getDownloadInfo(): null);
			if (info) {
				if (info.buttonTitle) downloadIcon.attr('title', info.buttonTitle);
				downloadIcon.prop("disabled", false);
				downloadIcon.find("path").each(function(){
					this.style.fill = "black";
				});
			} else {
				downloadIcon.prop("disabled", true).prop("title", "Download not supported for this result representation");
				downloadIcon.find("path").each(function(){
					this.style.fill = "gray";
				});
			}
			
			//Manage embed button
			var link = null;
			if (outputPlugin.getEmbedHtml) link = outputPlugin.getEmbedHtml();
			if (link && link.length > 0) {
				embedButton.show();
			} else {
				embedButton.hide();
			}
		}
	};
	yasr.draw = function(output) {
		if (!yasr.results) return false;
		if (!output) output = yasr.options.output;
		
		
		//ah, our default output does not take our current results. Try to autodetect
		var selectedOutput = null;
		var selectedOutputPriority = -1;
		var unsupportedOutputs = [];
		for (var tryOutput in yasr.plugins) {
			if (yasr.plugins[tryOutput].canHandleResults(yasr)) {
				var priority = yasr.plugins[tryOutput].getPriority;
				if (typeof priority == "function") priority = priority(yasr);
				if (priority != null && priority != undefined && priority > selectedOutputPriority) {
					selectedOutputPriority = priority;
					selectedOutput = tryOutput;
				}
			} else {
				unsupportedOutputs.push(tryOutput);
			}
		}
		disableOutputs(unsupportedOutputs);
		if (output in yasr.plugins && yasr.plugins[output].canHandleResults(yasr)) {
			$(yasr.resultsContainer).empty();
			yasr.plugins[output].draw();
			return true;
		} else if (selectedOutput) {
			$(yasr.resultsContainer).empty();
			yasr.plugins[selectedOutput].draw();
			return true;
		}
		return false;
	};
	
	var disableOutputs = function(outputs) {
		//first enable everything.
		yasr.header.find('.yasr_btnGroup .yasr_btn').removeClass('disabled');
		
		
		//now disable the outputs passed as param
		outputs.forEach(function(outputName) {
			yasr.header.find('.yasr_btnGroup .select_' + outputName).addClass('disabled');
		});
		
	};
	yasr.somethingDrawn = function() {
		return !yasr.resultsContainer.is(":empty");
	};

	yasr.setResponse = function(dataOrJqXhr, textStatus, jqXhrOrErrorString) {
		try {
			yasr.results = require("./parsers/wrapper.js")(dataOrJqXhr, textStatus, jqXhrOrErrorString);
		} catch(exception) {
			yasr.results = {getException: function(){return exception}};
		}
		yasr.draw();
		
		//store if needed
		var resultsId = yasr.getPersistencyId(yasr.options.persistency.results.key);
		if (resultsId) {
			if (yasr.results.getOriginalResponseAsString && yasr.results.getOriginalResponseAsString().length < yasr.options.persistency.results.maxSize) {
				utils.storage.set(resultsId, yasr.results.getAsStoreObject(), "month");
			} else {
				//remove old string
				utils.storage.remove(resultsId);
			}
		}
	};
	var $toggableWarning = null;
	var $toggableWarningClose = null;
	var $toggableWarningMsg = null;
	yasr.warn = function(warning) {
		if (!$toggableWarning) {
			//first time instantiation
			$toggableWarning = $('<div>', {class: 'toggableWarning'}).prependTo(yasr.container).hide();
			$toggableWarningClose = $('<span>', {class: 'toggleWarning'})
				.html('&times;')
				.click(function() {
					$toggableWarning.hide(400);
				})
				.appendTo($toggableWarning);
			$toggableWarningMsg = $('<span>', {class: 'toggableMsg'}).appendTo($toggableWarning);
		}
		$toggableWarningMsg.empty();
		if (warning instanceof $) {
			$toggableWarningMsg.append(warning);
		} else {
			$toggableWarningMsg.html(warning);
		}
		$toggableWarning.show(400);
	};
	
	var blobDownloadSupported = null;
	var checkBlobDownloadSupported = function() {
		if (blobDownloadSupported === null) {
			var windowUrl = window.URL || window.webkitURL || window.mozURL || window.msURL;
			blobDownloadSupported = windowUrl && Blob;
		}
		return blobDownloadSupported;
	};
	var embedBtn = null;
	var drawHeader = function(yasr) {
		var drawOutputSelector = function() {
			var btnGroup = $('<div class="yasr_btnGroup"></div>');
			$.each(yasr.plugins, function(pluginName, plugin) {
				if (plugin.hideFromSelection) return;
				var name = plugin.name || pluginName;
				var button = $("<button class='yasr_btn'></button>")
				.text(name)
				.addClass("select_" + pluginName)
				.click(function() {
					//update buttons
					btnGroup.find("button.selected").removeClass("selected");
					$(this).addClass("selected");
					//set and draw output
					yasr.options.output = pluginName;
					
					//store if needed
					var selectorId = yasr.getPersistencyId(yasr.options.persistency.outputSelector);
					if (selectorId) {
						utils.storage.set(selectorId, yasr.options.output, "month");
					}
					
					//close warning if there is any
					if ($toggableWarning) $toggableWarning.hide(400);
					
					yasr.draw();
					yasr.updateHeader();
				})
				.appendTo(btnGroup);
				if (yasr.options.output == pluginName) button.addClass("selected");
			});
			
			if (btnGroup.children().length > 1) yasr.header.append(btnGroup);
		};
		var drawDownloadIcon = function() {
			var stringToUrl = function(string, contentType) {
				var url = null;
				var windowUrl = window.URL || window.webkitURL || window.mozURL || window.msURL;
				if (windowUrl && Blob) {
					var blob = new Blob([string], {type: contentType});
					url = windowUrl.createObjectURL(blob);
				}
				return url;
			};
			var button = $("<button class='btn btn-success btn-sm yasr_downloadIcon'>Save</button>")
				.click(function() {
					var currentPlugin = yasr.plugins[yasr.options.output];
					if (currentPlugin && currentPlugin.getDownloadInfo) {
						var downloadInfo = currentPlugin.getDownloadInfo();
						var downloadUrl = stringToUrl(downloadInfo.getContent(), (downloadInfo.contentType? downloadInfo.contentType: "text/plain"));
						var downloadMockLink = $("<a></a>",
								{
							href: downloadUrl,
							download: downloadInfo.filename
						});
						require('./utils.js').fireClick(downloadMockLink);
//						downloadMockLink[0].click();
					}
				});
			var saveAsDropDown = $(require('./extensions.js').saveAsDropDown);
			saveAsDropDown.find(".format").click(function () {
				yasr.getQueryResultsAsFormat($(this).data("accepts"));
			});
			yasr.header.append(button);
			yasr.header.append(saveAsDropDown);
		};
		var drawFullscreenButton = function() {
			var button = $("<button class='yasr_btn btn_fullscreen btn_icon'></button>")
				.append(require("yasgui-utils").svg.getElement(require('./imgs.js').fullscreen))
				.click(function() {
					yasr.container.addClass('yasr_fullscreen');
				});
			yasr.header.append(button);
		};
		var drawSmallscreenButton = function() {
			var button = $("<button class='yasr_btn btn_smallscreen btn_icon'></button>")
				.append(require("yasgui-utils").svg.getElement(require('./imgs.js').smallscreen))
				.click(function() {
					yasr.container.removeClass('yasr_fullscreen');
				});
			yasr.header.append(button);
		};
		var drawEmbedButton = function() {
			embedBtn = $("<button>", {class:'yasr_btn yasr_embedBtn', title: 'Get HTML snippet to embed results on a web page'})
			.text('</>')
			.click(function(event) {
				var currentPlugin = yasr.plugins[yasr.options.output];
				if (currentPlugin && currentPlugin.getEmbedHtml) {
					var embedLink = currentPlugin.getEmbedHtml();
					
					event.stopPropagation();
					var popup = $("<div class='yasr_embedPopup'></div>").appendTo(yasr.header);
					$('html').click(function() {
						if (popup) popup.remove();
					});

					popup.click(function(event) {
						event.stopPropagation();
						//dont close when clicking on popup
					});
					var prePopup = $("<textarea>").val(embedLink);
					prePopup.focus(function() {
					    var $this = $(this);
					    $this.select();

					    // Work around Chrome's little problem
					    $this.mouseup(function() {
					        // Prevent further mouseup intervention
					        $this.unbind("mouseup");
					        return false;
					    });
					});
					
					popup.empty().append(prePopup);
					var positions = embedBtn.position();
					var top = (positions.top + embedBtn.outerHeight()) + 'px';
					var left = Math.max(((positions.left + embedBtn.outerWidth()) - popup.outerWidth()), 0) + 'px';
					
					popup.css("top",top).css("left", left);
					
				}
			})
			yasr.header.append(embedBtn);
		};
		// drawFullscreenButton();drawSmallscreenButton();
		if (yasr.options.drawOutputSelector) drawOutputSelector();
		if (yasr.options.drawDownloadIcon && checkBlobDownloadSupported()) drawDownloadIcon();//only draw when it's supported
		drawEmbedButton();
	};
	
	
	

	/**
	 * postprocess
	 */
	var selectorId = yasr.getPersistencyId(yasr.options.persistency.outputSelector)
	if (selectorId) {
		var selection = utils.storage.get(selectorId);
		if (selection) yasr.options.output = selection;
	}
	drawHeader(yasr);
	if (!queryResults && yasr.options.persistency && yasr.options.persistency.results) {
		var resultsId = yasr.getPersistencyId(yasr.options.persistency.results.key)
		var fromStorage;
		if (resultsId) {
			fromStorage = utils.storage.get(resultsId);
		}
		
		
		if (!fromStorage && yasr.options.persistency.results.id) {
			//deprecated! But keep for backwards compatability
			//if results are stored under old ID. Fetch the results, and delete that key (results can be large, and clutter space)
			//setting the results, will automatically store it under the new key, so we don't have to worry about that here
			var deprId = (typeof yasr.options.persistency.results.id == "string" ? yasr.options.persistency.results.id: yasr.options.persistency.results.id(yasr));
			if (deprId) {
				fromStorage = utils.storage.get(deprId);
				if (fromStorage) utils.storage.remove(deprId);
			}
		}
		if (fromStorage) {
			if ($.isArray(fromStorage)) {
				yasr.setResponse.apply(this, fromStorage);
			} else {
				yasr.setResponse(fromStorage);
			}
		}
	}
	
	if (queryResults) {
		yasr.setResponse(queryResults);
	} 
	yasr.updateHeader();
	return yasr;
};



root.plugins = {};
root.registerOutput = function(name, constructor) {
	root.plugins[name] = constructor;
};




/**
 * The default options of YASR. Either change the default options by setting YASR.defaults, or by
 * passing your own options as second argument to the YASR constructor
 * 
 * @attribute YASR.defaults
 */
root.defaults = require('./defaults.js');
root.version = {
	"YASR" : require("../package.json").version,
	"jquery": $.fn.jquery,
	"yasgui-utils": require("yasgui-utils").version
};
root.utils = require('./utils.js');
root.$ = $;



// Desi: make table default
//put these in a try-catch. When using the unbundled version, and when some dependencies are missing, then YASR as a whole will still function
try {root.registerOutput('boolean', require("./boolean.js"))} catch(e){};
try {root.registerOutput('table', require("./table.js"))} catch(e){};
try {root.registerOutput('rawResponse', require("./rawResponse.js"))} catch(e){};
try {root.registerOutput('error', require("./error.js"))} catch(e){};
try {root.registerOutput('pivot', require("./pivot.js"))} catch(e){};
try {root.registerOutput('gchart', require("./gchart.js"))} catch(e){};