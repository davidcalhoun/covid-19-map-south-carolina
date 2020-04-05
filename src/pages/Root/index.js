import React, { useState, useEffect } from "react";
import { useParams, Link, useHistory, useLocation } from "react-router-dom";
import ReactMapGL, { Source, Layer } from "react-map-gl";
import { range, descending } from "d3-array";
import { scaleQuantile } from "d3-scale";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import { useDebouncedCallback } from "use-debounce";

import {
	SITE_NAME,
	MAPBOX_TOKEN,
	MIN_YEAR,
	MAX_YEAR,
	isProd,
} from "../../consts";
import styles from "./root.css";
import {
	parseJSON,
	getIntOrdinal,
	fetchJSON,
	fetchMultipleJSON,
	usePrevious,
} from "../../utils";

function useQuery() {
	return new URLSearchParams(useLocation().search);
}

// const dataLayer = {
// 	id: "data",
// 	type: "fill",
// 	paint: {
// 		"fill-color": {
// 			property: "emissionPercentile",
// 			stops: [
// 				[0, "#ffffff"],
// 				[1, "#f2fdff"],
// 				[2, "#d8f9ff"],
// 				[3, "#aee8fe"],
// 				[4, "#8ecefc"],
// 				[5, "#639df1"],
// 				[6, "#4c78d9"],
// 				[7, "#3657b6"],
// 				[8, "#16234d"]
// 			]
// 		},
// 		"fill-opacity": 0.8
// 	}
// };

const COLOR_STOPS = [
	[0, "#ffffff"],
	[1, "#f3ecea"],
	[2, "#e7d8d6"],
	[3, "#dbc5c2"],
	[4, "#cfb3af"],
	[5, "#c3a09c"],
	[6, "#b78e89"],
	[7, "#aa7d77"],
	[8, "#9d6b65"],
	[9, "#915a53"],
	[10, "#834943"],
	[11, "#763833"],
	[12, "#692823"],
	[13, "#5b1615"],
	[14, "#4d0000"],
];

// const dataLayer = {
// 	id: "data",
// 	type: "fill",
// 	paint: {
// 		"fill-color": {
// 			property: "percentile",
// 			stops: COLOR_STOPS,
// 		},
// 		"fill-opacity": 0.5,
// 	},
// };

const dataLayer = {
	id: "data",
	type: "fill",
	paint: {
		"fill-color": ["rgba", ["get", "red"], 0, 0, ["get", "opacity"]],
	},
};

function getPercentile(percentile = 0, colorStops, max = 100) {
	return parseInt((percentile / colorStops) * max);
}

function getRank(rank) {
	if (!rank) return "No data.";

	return (
		<span>
			<span>{rank}</span>
			<sup>{getIntOrdinal(rank)}</sup>
		</span>
	);
}

function HoverPopup({ hoveredFeature, year }) {
	if (!hoveredFeature || !hoveredFeature.feature) {
		return null;
	}

	const {
		feature,
		x,
		y
	} = hoveredFeature;

	const {
		ZCTA5CE10: zip,
		county,
		positiveCases,
		percentile,
	} = feature.properties;

	console.log(zip, positiveCases, typeof positiveCases)

	return (
		<div
			className={styles.tooltip}
			style={{
				left: x + 20,
				top: y + 20,
			}}
		>
			<div>
				{zip} {county && `(${county})`}
			</div>
			<div>
				{!!(typeof positiveCases === 'number')
					? `${positiveCases} positive case${
							positiveCases === 1 ? "" : "s"
					  }`
					: "No data"}
			</div>
			{!!(typeof positiveCases === 'number') && (
				<span>
					<span>Percentile: </span>
					<span>{percentile}</span>
				</span>
			)}
		</div>
	);
}

function YearSliderThumb(props) {
	const { children } = props;

	return (
		<span className={styles.yearSliderThumb} {...props}>
			{children}
		</span>
	);
}

// TODO: fill in orphan zip codes not listed in counties
function flattenCases(counties, featuresGeoJSON) {
	const flattened = Object.entries(counties).reduce(
		(allZips, [countyName, countyCases]) => {
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
					console.log(
						`multi-county zipcode detected: ${zip} ${zipObj.county}`
					);
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

const fillSequentialArray = (len) => {
	return Array.from(new Array(len)).map((val, index) => index + 1);
};

const Root = ({ breakpoint }) => {
	let history = useHistory();
	let { year: yearInURL } = useParams();
	const [viewState, setViewState] = useState({
		latitude: 33.52,
		longitude: -80.87,
		zoom: 6.4865,
		bearing: 0,
		pitch: 0,
	});
	let [data, setData] = useState({});
	const [year, setYear] = useState(1970);
	const [hoveredFeature, setHoveredFeature] = useState({});
	let query = useQuery();
	const [debouncedUpdateSelfUrl] = useDebouncedCallback(updateSelfUrl, 50);

	const prevData = usePrevious(data);

	const { geoJSONFeatures, cases } = data;

	const { latitude, longitude, zoom } = viewState;

	function init() {
		async function fetchAllData() {
			const [zipCodesGeoJSON, casesJSON] = await fetchMultipleJSON(
				"/data/sc_south_carolina_zip_codes_geo.lowres.json",
				"/data/2020-04-03.json"
			);
			setData({
				...data,
				geoJSONFeatures: zipCodesGeoJSON.features,
				cases: flattenCases(casesJSON, zipCodesGeoJSON.features),
			});
		}
		fetchAllData();

		if (yearInURL) {
			setYear(yearInURL);
		}

		const lat = parseFloat(query.get("lat"));
		const lng = parseFloat(query.get("lng"));
		const zoom = parseFloat(query.get("zoom"));

		if (lat && lng && zoom) {
			setViewState({
				...viewState,
				latitude: lat,
				longitude: lng,
				zoom,
			});
		}

		document.title = SITE_NAME;
	}
	useEffect(init, []);

	useEffect(() => {
		if ((!prevData || !prevData.cases) && cases) {
			updateFeaturesForDate();
		}
	}, [data]);

	function findCasesByZip(cases, zipToFind) {
		return cases[zipToFind];
	}

	function updateFeaturesForDate() {
		const rangeSize = 15;

		const dDomain = Object.values(cases).map(({ positive }) =>
			parseInt(positive)
		);
		const dDomainZeroesRemoved = dDomain.filter((val) => val > 0);

		const dRange = fillSequentialArray(rangeSize);

		const scale = scaleQuantile()
			.domain(dDomainZeroesRemoved)
			.range(dRange);

		const percentileScale = scaleQuantile()
			.domain(dDomainZeroesRemoved)
			.range(fillSequentialArray(99));

		const redScale = scaleQuantile()
			.domain(dDomainZeroesRemoved)
			.range(fillSequentialArray(255));

		const opacityScale = scaleQuantile()
			.domain(dDomainZeroesRemoved)
			.range(fillSequentialArray(10));

		const newGeoJSONFeatures = geoJSONFeatures.map((zipGeoJSON) => {
			const { positive, county } =
				findCasesByZip(cases, zipGeoJSON.properties["ZCTA5CE10"]) || {};
			if (positive > 15) {
				console.log(positive, scale(positive));
			}
			return {
				...zipGeoJSON,
				properties: {
					...zipGeoJSON.properties,
					county,
					positiveCases: parseInt(positive),
					percentile: percentileScale(positive),
					red: redScale(positive),
					opacity: opacityScale(positive) / 10,
				},
			};
		});

		setData({ ...data, geoJSONFeatures: newGeoJSONFeatures });
	}

	function updateSelfUrl(newUrl) {
		history.replace(newUrl);
	}

	const geoJSONData = {
		type: "FeatureCollection",
		features: geoJSONFeatures,
	};

	function handleYearChange(event, year) {
		setYear(year);

		updateSelfUrl(
			`/year/${year}?lat=${latitude}&lng=${longitude}&zoom=${zoom}`
		);
	}

	function handleHover(event) {
		const {
			features,
			srcEvent: { offsetX, offsetY },
		} = event;

		const feature = features && features.find((f) => f.layer.id === "data");

		setHoveredFeature({ feature, x: offsetX, y: offsetY });
	}

	function handleMouseOut() {
		setHoveredFeature({});
	}

	function handleViewStateChange({ viewState }) {
		setViewState(viewState);

		debouncedUpdateSelfUrl(
			`/year/${year}?lat=${latitude}&lng=${longitude}&zoom=${zoom}`
		);
	}

	const marks = [
		{
			value: 1970,
			label: "1970",
		},
		{
			value: 1980,
			label: "1980",
		},
		{
			value: 1990,
			label: "1990",
		},
		{
			value: 2000,
			label: "2000",
		},
		{
			value: 2010,
			label: "2010",
		},
	];

	return (
		<div className={styles.container}>
			<div className={styles.yearSliderContainer}>
				<Slider
					value={year}
					aria-labelledby="discrete-slider"
					step={1}
					marks={marks}
					min={MIN_YEAR}
					max={MAX_YEAR}
					onChange={handleYearChange}
					valueLabelDisplay="on"
				/>
			</div>
			<ReactMapGL
				{...viewState}
				width="100%"
				height="100%"
				mapStyle="mapbox://styles/mapbox/outdoors-v11"
				mapboxApiAccessToken={MAPBOX_TOKEN}
				onViewStateChange={handleViewStateChange}
				onHover={handleHover}
				onMouseOut={handleMouseOut}
			>
				{geoJSONData.features && (
					<Source type="geojson" data={geoJSONData}>
						<Layer {...dataLayer} />
					</Source>
				)}
			</ReactMapGL>
			<HoverPopup hoveredFeature={hoveredFeature} year={year} />
		</div>
	);
};

export default Root;
