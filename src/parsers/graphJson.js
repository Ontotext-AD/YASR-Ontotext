'use strict';
var $ = require("jquery");
var _ = require('lodash');

var getAsObject = function(entity) {
	if (typeof entity == "object") {
		if ("bnode" == entity.type) {
			entity.value = entity.value.slice(2);
		}
		return entity;
	}
	if (entity.indexOf("_:") == 0) {
		return {
			type: "bnode",
			value: entity.slice(2)
		}
	} else if (entity.indexOf(":") == -1) {
        return {
            type: "bnode",
            value: entity
 	   }
	}
	return {
			type: "uri",
			value: entity
		}
}
var root = module.exports = function(responseJson) {
	if (responseJson) {
		var hasContext = ('RESOURCE' == window.editor.getQueryType());
		var mapped = _.map(responseJson, function(value, subject) {
			return _.map(value, function (value1, predicate) {
				return _.map(value1, function(object) {
					if (object.graphs) {
						hasContext = true;
						return _.map(object.graphs, function(context){
							return [
									getAsObject(subject),
									getAsObject(predicate),
									getAsObject(object),
									getAsObject(context)
								]
						})
					} else {
						return [
									getAsObject(subject),
									getAsObject(predicate),
									getAsObject(object)
								]
					}
				})
			})
		});
		var reduced = _.reduce(mapped, function(memo, el) {return memo.concat(el)}, []);
		reduced = _.reduce(reduced, function(memo, el) {return memo.concat(el)}, []);
		var bindings;
		if (!hasContext) {
			bindings = reduced.map(function(triple) {return {subject : triple[0], predicate: triple[1], object: triple[2]}});
		} else {
			reduced = _.reduce(reduced, function(memo, el) {return memo.concat(el)}, []);
			bindings = reduced.map(function(triple) {return {subject : triple[0], predicate: triple[1], object: triple[2], context: triple[3]}});
		}
		var variables = (hasContext) ? [ "subject", "predicate", "object", "context" ] : [ "subject", "predicate", "object"];
		return {
			"head" : {
				"vars" : variables
				},
				"results" : {
					"bindings": bindings
				}
			};

	}
	return false;

};