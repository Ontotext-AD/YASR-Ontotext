'use strict';
var $ = require("jquery"),
	utils = require("./utils.js"),
	_ = require('lodash');
require("cytoscape");
require("../lib/DataTables/media/js/jquery.dataTables.js");


var root = module.exports = function(yasr) {


	var invertedPrefixes = function() {
		if (yasr.options.getUsedPrefixes) {
			return _.invert(typeof yasr.options.getUsedPrefixes == "function"? yasr.options.getUsedPrefixes(yasr):  yasr.options.getUsedPrefixes);
		}
		return null;
	}();


	var getNodeName = function(key) {
		if (invertedPrefixes) {
			var shortKey = utils.uriToPrefixWithLocalName(invertedPrefixes, key);
			if (shortKey) {
				return shortKey.prefix + ":" + shortKey.localName;
			}
		}

		return key;
	}

	var nodeObject = function(key, index) {
		return { data: { id: index.toString(), name: getNodeName(key), uri: key, size: 70}}
	}

	var addDataTypes = function(data) {
		var table = $('<table cellpadding="0" cellspacing="0" border="0" class="dataPropsTable table table-striped table-bordered fixedCellWidth"></table>');
		yasr.resultsContainer.find('table').remove();
		yasr.resultsContainer.find(".graph-info").append(table);
		
		var tableData = _.map(data, function(key) {
			return {
				property: getNodeName(key.predicate.value),
				value: getNodeName(key.object.value)
			}
		});
		
		table.DataTable({
			data: tableData,
			columns: [
				{data: "property"},
				{data: "value"}
			],
			paging: false,
			ordering: false,
			searching: false,
			info: false,
		});
		table.find("th").hide();
	}

	var constructGraph = function(response, isDescribe) {
		var nodeLimit = 20;
		var edgeLimit = 50;

		var nodeIds = {};
		var graph = {};
		// prefer triples where entity is subject
		response = _.sortBy(response, function(key) {
			return ("uri" == key.subject.type)? 0 : 1;
		});
		var allNodes = _.uniq(_.flatten(_.map(response, function(key) {
			var so = [];
			if ("literal" != key.object.type) {
				return [key.subject.value, key.object.value]
			}
			return [key.subject.value];
		})));

		var allEdgeCount = _.filter(response, function(key) {
			return "literal" != key.object.type;
		}).length;

		var allNodeCount = allNodes.length;
		var so = _.slice(allNodes, 0, nodeLimit);

		graph.nodes = _.map(so, function(key, index) {
			nodeIds[key] = index.toString();
			return nodeObject(key, index);
		});


		if (isDescribe) {
			var dataProps = _.filter(response, function(key) {
				return "literal" == key.object.type
			});
			addDataTypes(dataProps);
			
		}

		var filterEgdes = _.slice(_.filter(response, function(key) {
			return nodeIds[key.subject.value] && nodeIds[key.object.value];
		}), 0, edgeLimit);

		graph.edges = _.map(filterEgdes, function(key, index) {
			var s = nodeIds[key.subject.value];
			var t = nodeIds[key.object.value];
			var p = utils.uriToPrefixWithLocalName(invertedPrefixes, key.predicate.value);
			var name = p ? p.prefix + ":" + p.localName : key.predicate.value;
			return { data: { id: 'e' + index.toString(), name: name, source: s, target: t} };
		});
		addNodeEdgesInfo(graph.nodes.length, allNodeCount, graph.edges.length, allEdgeCount);
		return graph;
	};

	var addNodeEdgesInfo = function(nodes, allNodes, edges, allEdges) {
		yasr.resultsContainer.find('.graph-info-title').text(nodes + ' of ' + allNodes + ' nodes, ' + edges + ' of ' + allEdges + ' edges.');
	}


	var draw = function() {
		yasr.resultsContainer.empty();
		yasr.resultsContainer.append('<div class="graph-info-title"></div><div class="graph-info"></div><div id="cy"></div>');
		
		var graph = constructGraph(yasr.results.getAsJson().results.bindings);
		var cy = cytoscape({
		  container: document.getElementById('cy'),

		  style: cytoscape.stylesheet()
		    .selector('node')
		      .css({
		        'content': 'data(name)',
		        'text-valign': 'center',
		        'color': 'white',
		        'text-outline-width': 2,
		        'text-outline-color': '#888',
		        'width': 'data(size)',
		        'height': 'data(size)'
		      })
		    .selector('edge')
		      .css({
		        'target-arrow-shape': 'triangle',
		        'width': 'mapData(weight, 0, 10, 3, 9)',
		        'line-color': '#ddd',
		        'target-arrow-color': '#ddd',
		        'content': 'data(name)',
		        'text-opacity': 1,
		        'text-valign': 'center',
		        'color': 'black',
			})    
	       .selector('.from')
		      	.css({
		       		'background-color': '#f04e23',
		      })
		      .selector('.to')
		      	.css({
		       		'background-color': '#018ae1',
		      }),
		  
		  elements: {
		      nodes: graph.nodes, 
		      edges: graph.edges
		    },
		  
		  layout: {
		    name: 'circle',
		    padding: 10
		  },
		  boxSelectionEnabled: true
		});

		var describeEntity = function(entity, cb) {
			var data = {
				query : "describe <" + entity + "> limit 1000",
				infer : yasr.currentQuery.inference ? true : false
			};
			if (yasr.currentQuery.sameAs) {
				data['default-graph-uri'] = 'http://www.ontotext.com/disable-sameAs';
			}
			var url = 'repositories/' + backendRepositoryID;
			//todo com.ontotext.graphdb.auth

			$.ajax({
				url: url,
				type: "POST",
				data: data,
				headers: {Accept: "application/x-sparqlstar-results+json"}
			}).done(function(result){
				var molecule = constructGraph(parsers.json(result).results.bindings, true);
				cy.load(molecule, cb);
			}).fail(function(xhr, textStatus, errorThrown) {
				console.log('Cannot browse entity: ' + entity + '; ' + xhr.responseText);
			});
		}
		
		cy.on('tap', 'node', function(n) {
			var node = n.cyTarget;
			var uri = node.data()["uri"];
			describeEntity(uri, function() {
				var mainNode = cy.nodes("[uri='" + uri +"']");
				cy.nodes().addClass('to');
				mainNode.removeClass('to').addClass('from');
			});
		});
	}

	var canHandleResults = function() {
		return "CONSTRUCT" == window.editor.getQueryType() || "DESCRIBE" == window.editor.getQueryType();
	}

	return {
		name: 'Graph(beta)',
		draw: draw,
		getPriority: 20,
		hideFromSelection: false,
		canHandleResults: canHandleResults,
	}
}