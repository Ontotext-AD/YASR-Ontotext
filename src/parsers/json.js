'use strict';
var $ = require("jquery");

var root = module.exports = function(queryResponse) {
	var responseJson;
	if (typeof queryResponse == "string") {
		try {
			return JSON.parse(queryResponse);
	    } catch (e) {
	        return false;
	    }
	}
	if (typeof queryResponse == "object" && queryResponse.constructor === {}.constructor) {
		return queryResponse;
	}
	return false;
	
};