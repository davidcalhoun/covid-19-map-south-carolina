import React, { useState, useEffect, useRef } from "react";
export { default as useWindowResize } from "./useWindowResize";

export const parseJSON = str => {
	let json;
	try {
		json = JSON.parse(str);
	} catch (e) {
		return new Error("Failed to parse string.");
	}

	return json;
};

// https://en.wikipedia.org/wiki/Ordinal_indicator
export const getIntOrdinal = integer => {
	const integerStr = `${integer}`;
	const ending = integerStr.substr(integerStr.length - 1, 1);

	if (integer > 10 && integer < 20) {
		return "th";
	}

	switch (ending) {
		case "1":
			return "st";

		case "2":
			return "nd";

		case "3":
			return "rd";

		default:
			return "th";
	}
};

// https://davidwalsh.name/javascript-debounce-function
export const debounce = (func, wait, immediate) => {
	var timeout;
	return function() {
		var context = this,
			args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

// https://github.com/jashkenas/underscore/blob/master/underscore.js
export const throttle = (func, wait, options) => {
	var timeout, context, args, result;
	var previous = 0;
	if (!options) options = {};

	var later = function() {
		previous = options.leading === false ? 0 : Date.now();
		timeout = null;
		result = func.apply(context, args);
		if (!timeout) context = args = null;
	};

	var throttled = function() {
		var now = Date.now();
		if (!previous && options.leading === false) previous = now;
		var remaining = wait - (now - previous);
		context = this;
		args = arguments;
		if (remaining <= 0 || remaining > wait) {
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
			previous = now;
			result = func.apply(context, args);
			if (!timeout) context = args = null;
		} else if (!timeout && options.trailing !== false) {
			timeout = setTimeout(later, remaining);
		}
		return result;
	};

	throttled.cancel = function() {
		clearTimeout(timeout);
		previous = 0;
		timeout = context = args = null;
	};

	return throttled;
};

export const fetchJSON = async function (url) {
	const rawJSON = await fetch(url);
	const json = await rawJSON.json();
	return json;
}

export const fetchMultipleJSON = async function(...urls) {
	return Promise.all(urls.map(fetchJSON));
}

// custom hook for getting previous value 
export function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
