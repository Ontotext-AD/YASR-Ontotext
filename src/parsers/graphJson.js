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
	}
	return {
			type: "uri",
			value: entity
		}
}
var root = module.exports = function(responseJson) {
	if (responseJson) {
		var mapped = _.map(responseJson, function(value, subject) { 
			return _.map(value, function (value1, predicate) {
				return _.map(value1, function(object) {
					return [
						getAsObject(subject),
						getAsObject(predicate),
						getAsObject(object),
					] 
				})
			})
		});
		var reduced = _.reduce(mapped, function(memo, el) {return memo.concat(el)}, []);
		reduced = _.reduce(reduced, function(memo, el) {return memo.concat(el)}, []);
		var bindings = reduced.map(function(triple) {return {subject : triple[0], predicate: triple[1], object: triple[2]}});

		return {
			"head" : {
				"vars" : [ "subject", "predicate", "object" ]
				},
				"results" : {
					"bindings": bindings
				}
			};

	}
	return false;
	
};