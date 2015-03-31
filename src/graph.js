'use strict';
var $ = require("jquery"),
	utils = require("./utils.js"),
	_ = require('lodash');
require("cytoscape");

var root = module.exports = function(yasr) {

var parsers = {
	graphJson: require("./parsers/graphJson.js"),
};

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

var constructGraph = function(response) {
	var nodeIds = {};
	var graph = {};

	var so = _.slice(_.uniq(_.flatten(_.map(response, function(key) {return [key.subject.value, key.object.value]}))), 0, 20);

	graph.nodes = _.map(so, function(key, index) {
		nodeIds[key] = index.toString();
		return nodeObject(key, index);
	});

	var filterEgdes = _.slice(_.filter(response, function(key) {
		return nodeIds[key.subject.value] && nodeIds[key.object.value];
	}), 0, 50);

	graph.edges = _.map(filterEgdes, function(key, index) {
		var s = nodeIds[key.subject.value];
		var t = nodeIds[key.object.value];
		var p = utils.uriToPrefixWithLocalName(invertedPrefixes, key.predicate.value)
		return { data: { id: 'e' + index.toString(), name: p.prefix + ":" + p.localName, source: s, target: t} };
	});
	return graph;
};


var draw = function() {
	yasr.resultsContainer.empty();
	yasr.resultsContainer.append('<div id="cy"></div>');
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
	       		'background-color': '#f2836b',
	      })
	      .selector('.to')
	      	.css({
	       		'background-color': '#46A2D0',
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
			query : "describe <" + entity + ">",
			infer: false
		};
		var url = ctx + '/repositories/' + backendRepositoryID;
		$.ajax({
			url: url,
			type: "POST",
			data: data,
			headers: {Accept: "application/rdf+json"}
		}).done(function(result){
			var molecule = constructGraph(parsers.graphJson(result).results.bindings);
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