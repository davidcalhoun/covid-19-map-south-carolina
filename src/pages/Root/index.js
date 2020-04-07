import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useHistory, useLocation } from "react-router-dom";
import ReactMapGL, {
	Source,
	Layer,
	NavigationControl,
	Popup,
	WebMercatorViewport,
} from "react-map-gl";
import { range, descending } from "d3-array";
import { scaleQuantile } from "d3-scale";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import { useDebouncedCallback } from "use-debounce";
import { getDateFromDayNum, dayOfYearToDisplayDate } from "../../utils";

import {
	SITE_NAME,
	MAPBOX_TOKEN_DEV,
	MAPBOX_TOKEN_PROD,
	isProd,
	casesFiles,
	MIN_DATE,
	MAX_DATE,
	sliderMarks,
} from "../../consts";
import styles from "./root.css";
import {
	parseJSON,
	getIntOrdinal,
	fetchJSON,
	fetchMultipleJSON,
	usePrevious,
	getMax,
	flattenCases,
	fillSequentialArray,
} from "../../utils";
import { HoverPopup, InfoPanel, Legend } from "../../components";

const MAPBOX_TOKEN = isProd ? MAPBOX_TOKEN_PROD : MAPBOX_TOKEN_DEV;

function useQuery() {
	return new URLSearchParams(useLocation().search);
}

const dataLayer = {
	id: "data",
	type: "fill",
	paint: {
		"fill-color": ["rgba", ["get", "red"], 0, 0, ["get", "opacity"]],
		"fill-opacity": ["get", "opacity"],
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

function DateSliderThumb(props) {
	const { children } = props;

	return (
		<span className={styles.dateSliderThumb} {...props}>
			{children}
		</span>
	);
}

function findCasesByZip(cases, zipToFind) {
	return cases[zipToFind];
}

function computeFeaturesForDate(date, casesForDate, allCases, features) {
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

	const scale = scaleQuantile()
		.domain(dDomainZeroesRemoved)
		.range(dRange);

	const percentileScale = scaleQuantile()
		.domain(dDomainZeroesRemoved)
		.range(fillSequentialArray(99));

	const redScale = scaleQuantile()
		.domain(dDomainZeroesRemoved)
		.range(fillSequentialArray(255));

	const legendScale = scaleQuantile()
		.domain(dDomainZeroesRemoved)
		.range(fillSequentialArray(100));

	const opacityScale = scaleQuantile()
		.domain(dDomainZeroesRemoved)
		.range(fillSequentialArray(19));

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
				percentile: percentileScale(positive),
				...(positive ? { red: redScale(positive) } : { red: 0 }),
				...(positive
					? { opacity: opacityScale(positive) / 20 }
					: { opacity: 0 }),
			},
		};
	});

	return {
		features: newGeoJSONFeatures,
		legend: {
			quantiles: legendScale.quantiles(),
			domainMax,
		},
	};
}

let memoizedFeaturesForDate = {};

const Root = ({ breakpoint }) => {
	let history = useHistory();
	const [viewState, setViewState] = useState({
		latitude: 33.65043,
		longitude: -80.1632,
		zoom: 6.75,
		bearing: 0,
		pitch: 0,
	});
	let [data, setData] = useState({
		geoJSONFeatures: [],
		cases: null,
		allCases: [],
		geoJSONDate: null,
	});
	const [date, setDate] = useState(MIN_DATE);
	const [legendQuantiles, setLegendQuantiles] = useState([]);
	const [hoveredFeature, setHoveredFeature] = useState({});
	let query = useQuery();
	const [debouncedUpdateSelfUrl] = useDebouncedCallback(updateSelfUrl, 50);
	const prevData = usePrevious(data);
	const [debouncedHandleDateChange] = useDebouncedCallback(
		handleDateChange,
		10,
		{ leading: true }
	);

	const { geoJSONFeatures, cases, allCases, geoJSONDate } = data;
	const { latitude, longitude, zoom } = viewState;

	function init() {
		fetchAllData();

		const lat = parseFloat(query.get("lat"));
		const lng = parseFloat(query.get("lng"));
		const zoom = parseFloat(query.get("zoom"));

		document.title = SITE_NAME;

		if (lat && lng && zoom) {
			setViewState({
				...viewState,
				latitude: lat,
				longitude: lng,
				zoom,
			});
		} else {
			// Fit state bounds to device screen.
			const viewport = new WebMercatorViewport({
				width: window.innerWidth,
				height: window.innerHeight,
			}).fitBounds(
				[
					[-83.968730, 35.361338],
					[-76.384959, 31.402005],
				],
				{
					padding: 20,
					offset: [0, -100],
				}
			);

			setViewState({
				...viewState,
				latitude: viewport.latitude,
				longitude: viewport.longitude,
				zoom: viewport.zoom,
			});
		}



		() => {
			memoizedFeaturesForDate = null;
		};
	}
	useEffect(init, []);

	async function fetchAllData() {
		const basePath = isProd ? "/covid-19-map-south-carolina/data" : "/data";

		const casesFilePaths = casesFiles.map(
			(filename) => `${basePath}/${filename}`
		);

		const [zipCodesGeoJSON, ...casesJSON] = await fetchMultipleJSON(
			`${basePath}/sc_south_carolina_zip_codes_geo.lowres.json`,
			...casesFilePaths
		);

		setData({
			...data,
			geoJSONFeatures: zipCodesGeoJSON.features,
			cases: flattenCases(casesJSON[0], zipCodesGeoJSON.features),
			allCases: casesJSON.reduce((all, casesForDate) => {
				if (!casesForDate.meta) {
					return all;
				}

				all[casesForDate.meta.date] = flattenCases(
					casesForDate,
					zipCodesGeoJSON.features
				);

				return all;
			}, {}),
		});

		setDate(MIN_DATE);
	}

	useEffect(() => {
		const needsInitialization = (!prevData || !prevData.cases) && cases;
		const casesChanged = cases && geoJSONDate && geoJSONDate !== date;

		if (needsInitialization || casesChanged) {
			if (!memoizedFeaturesForDate[date]) {
				const { features, legend } = computeFeaturesForDate(
					date,
					cases,
					allCases,
					geoJSONFeatures
				);
				memoizedFeaturesForDate[date] = features;

				// TODO: only update once
				const { quantiles, domainMax } = legend;
				setLegendQuantiles([...quantiles, domainMax]);
			}

			setData({
				...data,
				geoJSONFeatures: memoizedFeaturesForDate[date],
				geoJSONDate: date,
			});

			// Update if year changes while hovering (e.g. keyboard arrow interaction).
			if (hoveredFeature.feature) {
				const feature = memoizedFeaturesForDate[date].find(
					({ properties }) =>
						properties["ZCTA5CE10"] ===
						hoveredFeature.feature.properties["ZCTA5CE10"]
				);

				setHoveredFeature({
					...hoveredFeature,
					feature: {
						...hoveredFeature.feature,
						properties: {
							...feature.properties,
						},
					},
				});
			}
		}
	}, [data]);

	useEffect(() => {
		if (!allCases) return;

		const casesForDate = allCases[date];

		if (!casesForDate) {
			console.warn(
				`Could not find cases for day of year ${date}.`,
				allCases
			);
			return;
		}

		setData({
			...data,
			cases: casesForDate,
		});
	}, [date]);

	function updateSelfUrl(newUrl) {
		history.replace(newUrl);
	}

	const geoJSONData = {
		type: "FeatureCollection",
		features: geoJSONFeatures,
	};

	function handleDateChange(event, date) {
		setDate(date);

		updateSelfUrl(`/?lat=${latitude}&lng=${longitude}&zoom=${zoom}`);
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
			`/?lat=${latitude}&lng=${longitude}&zoom=${zoom}`
		);
	}

	return (
		<div className={styles.container}>
			<div className={styles.dateSliderContainer}>
				<Slider
					value={date}
					aria-labelledby="discrete-slider"
					step={null}
					marks={sliderMarks}
					min={MIN_DATE}
					max={MAX_DATE}
					onChange={debouncedHandleDateChange}
					valueLabelDisplay="on"
					valueLabelFormat={dayOfYearToDisplayDate}
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
				minZoom={4}
				maxZoom={15}
			>
				<div className={styles.mapNavContainer}>
					<NavigationControl showCompass={false} />
				</div>
				{geoJSONData.features && (
					<Source type="geojson" data={geoJSONData}>
						<Layer {...dataLayer} />
					</Source>
				)}
				<Legend quantiles={legendQuantiles} />
				<InfoPanel />
			</ReactMapGL>
			<HoverPopup hoveredFeature={hoveredFeature} date={date} />
		</div>
	);
};

export default Root;
