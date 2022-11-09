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
	yasr.container = $(parent).find(".yasr");
	yasr.header = $(parent).find(".yasr_header");
	yasr.resultsContainer = $(parent).find(".yasr_results");
	yasr.storage = utils.storage;

    // load and register the translation service providing the locale config
    yasr.translate = require('./translate.js')(yasr.options.locale);

	yasr.changeLanguage = function (lang) {
		yasr.translate = require('./translate.js')(lang);
		let downLoadBtn = document.getElementById('saveAsBtn');
		if (downLoadBtn) {
			downLoadBtn.innerText = yasr.translate('yasr.download.as.label');
		}
		let menuUl = document.getElementById('yasrBtnGroup');
		let downloadIcon = document.getElementById('yasrDownloadIcon');
		if (menuUl) {
			menuUl.remove();
		}
		if (downloadIcon) {
			downloadIcon.remove();
		}
		if (!yasr.options.hideHeader) {
			drawHeader(yasr);
		}
		yasr.draw();
	};

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
				downloadIcon.prop("disabled", true).prop("title", yasr.translate('yasr.btn.title.unsupported_download'));
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
		yasr.updateHeader();
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
		//First check is to return again to Table view if previous query is returning error in Raw Response view
		if (selectedOutput == 'table' && yasr.plugins[selectedOutput].canHandleResults(yasr) && selectedOutput != output && angular.isUndefined(output))  {
			return selectAndDrawOutput(selectedOutput);
		} else {
			if (output in yasr.plugins && yasr.plugins[output].canHandleResults(yasr) && selectedOutput != 'booleanBootstrap') {
				return selectAndDrawOutput(output);
			} else if (selectedOutput) {
				return selectAndDrawOutput(selectedOutput);
			}
		}
		return false;
	};

	var selectAndDrawOutput = function(selectedOutput) {
		yasr.header.find('.yasr_btnGroup').find("li.active").removeClass("active");
		$(yasr.resultsContainer).empty();
		yasr.plugins[selectedOutput].draw();
		yasr.header.find('.yasr_btnGroup .select_' + selectedOutput).parent().addClass('active');
		return true;
	}
	
	var disableOutputs = function(outputs) {
		//first enable everything.
		yasr.header.find('.yasr_btnGroup li').removeClass('disabled');
		
		
		//now disable the outputs passed as param
		outputs.forEach(function(outputName) {
			yasr.header.find('.yasr_btnGroup .select_' + outputName).parent().addClass('disabled');
		});
		
	};
	yasr.somethingDrawn = function() {
		return !yasr.resultsContainer.is(":empty");
	};


	yasr.updateDownloadDropdown = function() {
		var saveAsDropDown;
		if (!window.editor) {
			return;
		}
		yasr.header.find('.saveAsDropDown').remove();
		var qType = window.editor.getQueryType();
		if ('SELECT' == qType) {
			saveAsDropDown = $(require('./extensions.js').selectSaveAsDropDown);
		}
		if ('CONSTRUCT' == qType || 'DESCRIBE' == qType) {
			saveAsDropDown = $(require('./extensions.js').graphSaveAsDropDown);
		}
		if (saveAsDropDown) {
			saveAsDropDown.find(".format").click(function () {
				yasr.getQueryResultsAsFormat($(this).data("accepts"));
			});
		
			yasr.header.append(saveAsDropDown);
		}
	}




	yasr.setResultsCount = function(dataOrJqXhr, textStatus, jqXhrOrErrorString) {
		if (0 == dataOrJqXhr.responseJSON) {
			yasr.allCount = -1;
		}
		if (dataOrJqXhr.responseJSON || 0 == dataOrJqXhr.responseJSON) {
			yasr.allCount = -1;
			if (dataOrJqXhr.responseJSON['http://www.ontotext.com/']) {
				yasr.allCount = dataOrJqXhr.responseJSON['http://www.ontotext.com/']['http://www.ontotext.com/'][0].value;
			}
			if($.isNumeric(dataOrJqXhr.responseJSON)){
				yasr.allCount = dataOrJqXhr.responseJSON;
			}
			if (dataOrJqXhr.responseJSON.results && dataOrJqXhr.responseJSON.results.bindings) {
				var result = dataOrJqXhr.responseJSON.results.bindings[0];
				var vars = dataOrJqXhr.responseJSON.head.vars;
				var bindingVars = Object.keys(result).filter(function(b) {return vars.indexOf(b) > -1} )
				if (bindingVars.length > 0) {
					yasr.allCount = result[bindingVars[0]].value;
				} 
			}
		}
	}



	yasr.setResponse = function(dataOrJqXhr, textStatus, jqXhrOrErrorString) {
		try {
			yasr.results = require("./parsers/wrapper.js")(dataOrJqXhr, textStatus, jqXhrOrErrorString);
		} catch(exception) {
			yasr.results = {getException: function(){return exception}};
		}
		if (yasr.results.getAsJson().results) {
			yasr.resultsCount = yasr.results.getAsJson().results.bindings.length;
		}
		if (yasr.results.getAsJson() && !yasr.options.hideHeader) {
			yasr.header.show();
			yasr.updateDownloadDropdown();
		}
		if (403 == dataOrJqXhr.status) {
			yasr.results.getException = function() {
				return {status: 403, statusText: "Forbidden", responseText: yasr.translate('yasr.http.403')};
			}
		} 
		yasr.draw();

		
		//store if needed
		if (yasr.options.persistency) {
			var resultsId = yasr.getPersistencyId(yasr.options.persistency.results.key);
			if (resultsId) {
				if (yasr.results.getOriginalResponseAsString && yasr.results.getOriginalResponseAsString().length < yasr.options.persistency.results.maxSize) {
					utils.storage.set(resultsId, yasr.results.getAsStoreObject(), "month");
				} else {
					//remove old string
					utils.storage.remove(resultsId);
				}
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
			var menuUl = $('<ul id="yasrBtnGroup" class="yasr_btnGroup nav nav-tabs"></ul>');
			$.each(yasr.plugins, function(pluginName, plugin) {
				if (plugin.hideFromSelection) return;
				var name = plugin.nameLabel ? yasr.translate(plugin.nameLabel) : pluginName;
				var li = $("<li class='nav-item'></li>");
				var link = $("<a class='nav-link'></a>")
				.text(name)
				.addClass("select_" + pluginName)
				.click(function() {
					if ($(this).parent().hasClass('disabled')) {
						return;
					}
					//update buttons
					menuUl.find("li.active").removeClass("active");
					li.addClass("active");
					//set and draw output
					yasr.options.output = pluginName;
					
					//store if needed
					var selectorId = yasr.getPersistencyId(yasr.options.persistency.outputSelector);
					if (selectorId) {
						utils.storage.set(selectorId, yasr.options.output, "month");
					}
					
					//close warning if there is any
					if ($toggableWarning) $toggableWarning.hide(400);
					
					yasr.draw(pluginName);
					yasr.updateHeader();
				})
				.appendTo(li);
				li.appendTo(menuUl);
				if (yasr.options.output == pluginName) li.addClass("active");
			});
			
			if (menuUl.children().length > 1) yasr.header.append(menuUl);
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
            var btnLabelSave = yasr.translate('yasr.btn.label.save');
			var button = $("<button id='yasrDownloadIcon' class='btn btn-primary btn-sm yasr_downloadIcon pull-right'>" + btnLabelSave + "</button>")
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
			yasr.header.append(button);
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
			embedBtn = $("<button>", {class:'yasr_btn yasr_embedBtn', title: yasr.translate('yasr.btn.title.embed')})
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
		// drawEmbedButton();
	};
	
	
	

	/**
	 * postprocess
	 */
	var selectorId = yasr.getPersistencyId(yasr.options.persistency.outputSelector)
	if (selectorId) {
		var selection = utils.storage.get(selectorId);
		if (selection) yasr.options.output = selection;
	}
	if (!yasr.options.hideHeader) {
		drawHeader(yasr);
	}
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

	const resizeEvent = 'resize.' + new Date().getTime();
	$(window).on(resizeEvent, yasr.draw);

	yasr.destroy = function () {
		$(window).off(resizeEvent);
		for (const plugin in yasr.plugins) {
			if ($.isFunction(plugin.destroy)) {
				plugin.destroy();
			}
		}
	}
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
try {root.registerOutput('booleanBootstrap', require("./booleanBootstrap.js"))} catch(e){};
try {root.registerOutput('table', require("./table.js"))} catch(e){};
try {root.registerOutput('rawResponse', require("./rawResponse.js"))} catch(e){};
try {root.registerOutput('error', require("./error.js"))} catch(e){};
try {root.registerOutput('pivot', require("./pivot.js"))} catch(e){};
try {root.registerOutput('gchart', require("./gchart.js"))} catch(e){};
