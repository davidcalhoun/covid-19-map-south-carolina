import React, { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { range, descending } from "d3-array";
import { scaleQuantile } from "d3-scale";

export { default as useWindowResize } from "./useWindowResize";

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

export const fetchJSON = async function(url) {
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

export const fetchMultipleJSON = async function(...urls) {
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

export const pluralize = (num, prefix) => (num === 1 ? prefix : `${prefix}s`);

export const getDateFromDayNum = (dayNum, year) => {
	var date = new Date();
	if (year) {
		date.setFullYear(year);
	}
	date.setMonth(0);
	date.setDate(0);
	var timeOfFirst = date.getTime(); // this is the time in milliseconds of 1/1/YYYY
	var dayMilli = 1000 * 60 * 60 * 24;
	var dayNumMilli = dayNum * dayMilli;
	date.setTime(timeOfFirst + dayNumMilli);
	return date;
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

const flattenByCounty = (counties, features) => {
	const flattened = Object.entries(counties).reduce(
		(allZips, [countyName, countyCases]) => {
			if (countyName === "meta") {
				allZips.meta = countyCases;
				return allZips;
			}

			const zipsInCounty = countyCases.reduce((accum2, curCase) => {
				accum2[curCase.zip] = {
					...curCase,
					county: countyName,
				};

				return accum2;
			}, {});

			const all = Object.values(zipsInCounty).reduce((zips, zipObj) => {
				const { zip, positive, county } = zipObj;

				if (zips[zip]) {
					return {
						...zips,
						[zip]: {
							...zips[zip],
							county: `${zips[zip].county}, ${county}`,
							positive:
								parseInt(zips[zip].positive) +
								parseInt(positive),
						},
					};
				} else {
					return {
						...zips,
						[zip]: zipObj,
					};
				}
			}, allZips);

			return all;
		},
		{}
	);

	return flattened;
}

const flattenByZip = (zips, features, zipMeta) => {
	const flattened = Object.entries(zips).reduce((accum, [zip, positive]) => {
		if (zip === "meta") {
			return accum;
		}

		if (!zipMeta[zip]) {
			console.warn(`Could not find info for zip code ${zip}.`);
			return accum;
		}

		const { countyNames, population } = zipMeta[zip];

		accum[zip] = {
			zip,
			positive,
			county: countyNames.length > 1 ? `${countyNames.join(', ')} counties` : `${countyNames[0]} county`,
			population
		};

		return accum;
	}, {});

	console.log(flattened)

	return flattened;
}

/**
 * Combines static Zip code GeoJSON with case counts by date.
 */
export const flattenCases = (counties, features, zipMeta) => {
	const isByZip = counties.meta.byZip;

	return isByZip
		? flattenByZip(counties, features, zipMeta)
		: flattenByCounty(counties, features);
};

export const fillSequentialArray = (len) => {
	return Array.from(new Array(len)).map((val, index) => index + 1);
};

function findCasesByZip(cases, zipToFind, zipMeta) {
	return cases[zipToFind];
}

let cachedScales = {};
export const computeFeaturesForDate = (date, casesForDate, allCases, features) => {
	const rangeSize = 15;

	const dDomain = Object.values(allCases).reduce((accum, casesForDate) => {
		const domain = Object.values(casesForDate).map(({ positive }) =>
			parseInt(positive)
		);

		return [...accum, ...domain];
	}, []);
	
	const dDomainZeroesRemoved = dDomain.filter((val) => val > 0);

	const domainMax = getMax(dDomainZeroesRemoved);

	const dRange = fillSequentialArray(rangeSize);

	if (!cachedScales.percentile) {
		cachedScales.percentile = scaleQuantile()
			.domain(dDomainZeroesRemoved)
			.range(fillSequentialArray(99));

		cachedScales.red = scaleQuantile()
			.domain(dDomainZeroesRemoved)
			.range(fillSequentialArray(255));

		cachedScales.legend = scaleQuantile()
			.domain(dDomainZeroesRemoved)
			.range(fillSequentialArray(100));

		cachedScales.opacity = scaleQuantile()
			.domain(dDomainZeroesRemoved)
			.range(fillSequentialArray(19));

		// cachedScales.height = scaleQuantile()
		// 	.domain(dDomainZeroesRemoved)
		// 	.range(fillSequentialArray(10000));
	}

	const newGeoJSONFeatures = features.map((zipGeoJSON) => {
		const { positive, county } =
			findCasesByZip(casesForDate, zipGeoJSON.properties["ZCTA5CE10"]) ||
			{};

		return {
			...zipGeoJSON,
			properties: {
				...zipGeoJSON.properties,
				county,
				positiveCases: parseInt(positive),
				percentile: cachedScales.percentile(positive),
				...(positive ? { red: cachedScales.red(positive) } : { red: 0 }),
				...(positive
					? { opacity: cachedScales.opacity(positive) / 20 }
					: { opacity: 0 }),
				// height: positive ? cachedScales.height(positive) : 0
			},
		};
	});

	return {
		features: newGeoJSONFeatures,
		legend: {
			quantiles: cachedScales.legend.quantiles(),
			domainMax,
		},
	};
}


export const getSliderMarks = (cases) => {
	const sliderMarks = cases.map(({ dayOfYear }, index) => {
		const isFirst = index === 0;
		const isLast = index === (cases.length - 1);
		const isBoundingDay = isFirst || isLast;

		return {
			value: dayOfYear,
			...(isBoundingDay && { label: dayOfYearToLongDisplayDate(dayOfYear) })
		};
	});

	return sliderMarks;
}
