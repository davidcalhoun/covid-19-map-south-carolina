import React, { useState, useEffect, useRef } from "react";
import {
	format,
	getDayOfYear as dateFnsGetDayOfYear,
	parseISO,
	differenceInDays
} from "date-fns";
import { range, descending } from "d3-array";
import { scaleQuantile } from "d3-scale";

export { default as useWindowResize } from "./useWindowResize";

const msInADay = 1000 * 60 * 60 * 24;

export const parseJSON = (str) => {
	let json;
	try {
		json = JSON.parse(str);
	} catch (e) {
		return new Error("Failed to parse string.");
	}

	return json;
};

// https://en.wikipedia.org/wiki/Ordinal_indicator
export const getIntOrdinal = (integer) => {
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

export const fetchJSON = async function (url) {
	let rawJSON;
	let json;
	try {
		rawJSON = await fetch(url);

		if (rawJSON.status > 400) {
			throw `HTTP ${rawJSON.status}`;
		}

		json = await rawJSON.json();
	} catch (e) {
		console.warn(`Error fetching ${url}: ${e}`);
		return {};
	}

	return json;
};

export const fetchMultipleJSON = async function (...urls) {
	return Promise.all(urls.map(fetchJSON));
};

// custom hook for getting previous value
export function usePrevious(value) {
	const ref = useRef();
	useEffect(() => {
		ref.current = value;
	});
	return ref.current;
}

export const getMax = (numsArr) => Math.max(...numsArr);

export const round = (num) => Math.floor(num);

export const roundFloat = (num, places = 2) => {
	if (num === 0) return num;

	return parseFloat(num).toFixed(places);
};

export const pluralize = (num, prefix) => (num === 1 ? prefix : `${prefix}s`);

export const getDateFromDayNum = (dayNum, year = new Date().getFullYear()) => {
	const firstDayOfYearMS = new Date(`${year}-01-01T00:00:01Z`).getTime();
	const sumOfDaysMS = dayNum * msInADay;

	const date = new Date().setTime(firstDayOfYearMS + sumOfDaysMS);

	return date;
};

// https://stackoverflow.com/questions/8619879/javascript-calculate-the-day-of-the-year-1-366
// export const getDayOfYears = (dateStr) => {
// 	var now = new Date(dateStr);
// 	var start = new Date(now.getFullYear(), 0, 0);
// 	var diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
// 	var oneDay = 1000 * 60 * 60 * 24;
// 	var day = Math.floor(diff / oneDay);
//
// 	return day;
// }

export const getDayOfYear = (dateStr) => {
	return dateFnsGetDayOfYear(parseISO(dateStr));
};

export const dayOfYearToDisplayDate = (dayOfYear) => {
	const date = getDateFromDayNum(dayOfYear, 2020);
	return format(date, "LLL d");
};

export const dayOfYearToLongDisplayDate = (dayOfYear) => {
	const date = getDateFromDayNum(dayOfYear, 2020);
	return format(date, "LLL d, yyyy");
};

export const dayOfYearToShortDay = (dayOfYear) => {
	const date = getDateFromDayNum(dayOfYear, 2020);
	return format(date, "L/d");
};

export const formatDay = (date = new Date()) => {
	return format(date, "yyyy-MM-dd");
};

export const dayOfYearToDate = (dayOfYear) => {
	const date = getDateFromDayNum(dayOfYear, 2020);
	return formatDay(date);
};

// const flattenByCounty = (counties, features) => {
// 	const flattened = Object.entries(counties).reduce(
// 		(allZips, [countyName, countyCases]) => {
// 			if (countyName === "meta") {
// 				allZips.meta = countyCases;
// 				return allZips;
// 			}
//
// 			const zipsInCounty = countyCases.reduce((accum2, curCase) => {
// 				accum2[curCase.zip] = {
// 					...curCase,
// 					county: countyName,
// 				};
//
// 				return accum2;
// 			}, {});
//
// 			const all = Object.values(zipsInCounty).reduce((zips, zipObj) => {
// 				const { zip, positive, county } = zipObj;
//
// 				if (zips[zip]) {
// 					return {
// 						...zips,
// 						[zip]: {
// 							...zips[zip],
// 							county: `${zips[zip].county}, ${county}`,
// 							positive:
// 								parseInt(zips[zip].positive) +
// 								parseInt(positive),
// 						},
// 					};
// 				} else {
// 					return {
// 						...zips,
// 						[zip]: zipObj,
// 					};
// 				}
// 			}, allZips);
//
// 			return all;
// 		},
// 		{}
// 	);
//
// 	return flattened;
// }
//
// const flattenByZip = (zips, features, zipMeta) => {
// 	const flattened = Object.entries(zips).reduce((accum, [zip, positive]) => {
// 		if (zip === "meta") {
// 			return accum;
// 		}
//
// 		if (!zipMeta[zip]) {
// 			console.warn(`Could not find info for zip code ${zip}.`);
// 			return accum;
// 		}
//
// 		const { countyNames, population } = zipMeta[zip];
//
// 		accum[zip] = {
// 			zip,
// 			positive,
// 			county: countyNames.length > 1 ? `${countyNames.join(', ')} counties` : `${countyNames[0]} county`,
// 			population
// 		};
//
// 		return accum;
// 	}, {});
//
// 	console.log(flattened)
//
// 	return flattened;
// }
//
// /**
//  * Combines static Zip code GeoJSON with case counts by date.
//  */
// export const flattenCases = (counties, features, zipMeta) => {
// 	const isByZip = counties.meta.byZip;
//
// 	return isByZip
// 		? flattenByZip(counties, features, zipMeta)
// 		: flattenByCounty(counties, features);
// };

export const fillSequentialArray = (len) => {
	return Array.from(new Array(len)).map((val, index) => index + 1);
};

// function getDomain(zipCodes, isPerCapita) {
// 	if (isPerCapita) {
// 		return Object.entries(zipCodes).reduce((domain, [zip, zipObj]) => {
// 			if (zip === "meta") {
// 				return domain;
// 			}
//
// 			const cases = zipObj.cases.map((c) => {
// 				return (c / parseInt(zipObj.population)) * 10000;
// 			});
//
// 			return [...domain, ...cases];
// 		}, []);
// 	} else {
// 		return Object.entries(zipCodes).reduce((domain, [zip, zipObj]) => {
// 			if (zip === "meta") {
// 				return domain;
// 			}
//
// 			return [...domain, ...zipObj.cases];
// 		}, []);
// 	}
// }

function getValForViewMode({ viewMode, casesForDate, perCapita, averageChange }) {
	switch (viewMode) {
		case "percapita":
			return perCapita;
		case "change":
			return averageChange;
		case "all":
		default:
			return casesForDate;
	}
}

const getValForDate = (zipCode, dateIndex, viewMode) => {
	const casesForDate = zipCode.cases[dateIndex];
	const population = parseInt(zipCode.population);
	const perCapita = (casesForDate / population) * 10000;
	const averageChange = zipCode.averageChange[dateIndex];

	return {
		val: getValForViewMode({ viewMode, casesForDate, perCapita, averageChange }),
		perCapita,
		averageChange,
	};
};

export const filterLessThanOne = (arr) => {
	return arr.filter(val => val >= 1);
}

let cachedScales = {};
export const computeFeaturesForDate = (
	dayOfYear,
	zipCodes,
	features,
	viewMode,
	quantiles,
) => {
	const date = dayOfYearToDate(dayOfYear);
	const dateIndex = differenceInDays(new Date(date), new Date(zipCodes.meta.dateBounds.first));

	const cacheKey = viewMode;

	if (!cachedScales[cacheKey]) {
		// Perf improvement: use precomputed fine-grained quantiles as representative of the data domain.
		const rawDomain = getQuantilesFromViewMode(viewMode, quantiles);

		const domain = viewMode === 'change'
			? filterLessThanOne(rawDomain)
			: rawDomain;

		cachedScales[cacheKey] = {};
		cachedScales[cacheKey].percentile = scaleQuantile()
			.domain(domain)
			.range(fillSequentialArray(99));

		cachedScales[cacheKey].red = scaleQuantile()
			.domain(domain)
			.range(fillSequentialArray(255));

		cachedScales[cacheKey].legend = scaleQuantile()
			.domain(domain)
			.range(fillSequentialArray(100));

		cachedScales[cacheKey].opacity = scaleQuantile()
			.domain(domain)
			.range(fillSequentialArray(19));

		// cachedScales[cacheKey].height = scaleQuantile()
		// 	.domain(domain)
		// 	.range(fillSequentialArray(10000));
	}

	const newGeoJSONFeatures = features.map((zipGeoJSON) => {
		const zipCode = zipGeoJSON.properties["ZCTA5CE10"];

		const { val, perCapita, averageChange } = getValForDate(
			zipCodes[zipCode],
			dateIndex,
			viewMode
		);

		const red = (val && (viewMode !== 'change' || (viewMode === 'change' && val > 1)))
			? { red: cachedScales[cacheKey].red(val) }
			: { red: 0 };

		const opacity = (val && (viewMode !== 'change' || (viewMode === 'change' && val > 1)))
			? { opacity: cachedScales[cacheKey].opacity(val) / 20 }
			: { opacity: 0 };

		return {
			...zipGeoJSON,
			id: zipCode,
			properties: {
				...zipGeoJSON.properties,
				county: zipCodes[zipCode].countyNames.join(", "),
				positiveCases: zipCodes[zipCode].cases[dateIndex],
				perCapita,
				averageChange,
				percentile: cachedScales[cacheKey].percentile(val),
				...red,
				...opacity,
				// height: positive ? cachedScales[cacheKey].height(positive) : 0
			},
		};
	});

	return {
		features: newGeoJSONFeatures,
		legend: {
			quantiles: cachedScales[cacheKey].legend.quantiles(),
			domainMax: quantiles[quantiles.length - 1],
		},
	};
};

export const getSliderMarks = (dates = []) => {
	const sliderMarks = dates.map((dateStr, index) => {
		const isFirst = index === 0;
		const isLast = index === dates.length - 1;
		const isBoundingDay = isFirst || isLast;

		return {
			value: getDayOfYear(dateStr),
			...(isBoundingDay && {
				label: format(parseISO(dateStr), "LLL d"),
			}),
		};
	});

	return sliderMarks;
};

/* https://overreacted.io/making-setinterval-declarative-with-react-hooks/ */
export function useInterval(callback, delay) {
	const savedCallback = useRef();

	// Remember the latest callback.
	useEffect(() => {
		savedCallback.current = callback;
	}, [callback]);

	// Set up the interval.
	useEffect(() => {
		function tick() {
			savedCallback.current();
		}
		if (delay !== null) {
			let id = setInterval(tick, delay);
			return () => clearInterval(id);
		}
	}, [delay]);
}

export function getQuantilesFromViewMode(viewMode, quantiles) {
	switch (viewMode) {
		case "percapita":
			return quantiles.perCapita;
		case "change":
			return filterLessThanOne(quantiles.averageChange);
		case "all":
		default:
			return quantiles.all;
	}
}

export function changePercentForDisplay(multiplier) {
	return roundFloat(multiplier * 100 - 100);
}
