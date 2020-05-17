import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useHistory, useLocation } from "react-router-dom";
import ReactMapGL, {
	Source,
	Layer,
	NavigationControl,
	Popup,
	WebMercatorViewport,
} from "react-map-gl";

import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import { useDebouncedCallback } from "use-debounce";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";

import {
	getDateFromDayNum,
	dayOfYearToDisplayDate,
	formatDay,
	getDayOfYear,
} from "../../utils";

import {
	SITE_NAME,
	MAPBOX_TOKEN_DEV,
	MAPBOX_TOKEN_PROD,
	isProd,
	casesData,
	southCarolinaGeoJSON,
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
	computeFeaturesForDate,
	getSliderMarks,
} from "../../utils";
import {
	HoverPopup,
	InfoPanel,
	Legend,
	PlaceholderGeoJSON,
} from "../../components";

const MAPBOX_TOKEN = isProd ? MAPBOX_TOKEN_PROD : MAPBOX_TOKEN_DEV;
const dataBasePath = isProd ? "/covid-19-map-south-carolina/data" : "/data";
const geoJSONFilename = "sc_south_carolina_zip_codes_geo.lowres.json";
const zipMetaFilename = "casesMerged.json";

function useQuery() {
	return new URLSearchParams(useLocation().search);
}

const dataLayer = {
	id: "data",
	type: "fill",
	paint: {
		"fill-color": ["rgba", ["get", "red"], 0, 0, ["get", "opacity"]],
		"fill-opacity": [
			"case",
			["boolean", ["feature-state", "hover"], false],
			1,
			["get", "opacity"],
		],
		"fill-outline-color": [
			"case",
			["boolean", ["feature-state", "hover"], false],
			"blue",
			"black",
		],
	},
};

const extrusionDataLayer = {
	id: "data",
	type: "fill-extrusion",
	paint: {
		"fill-extrusion-color": [
			"rgba",
			["get", "red"],
			0,
			0,
			["get", "opacity"],
		],
		"fill-extrusion-height": ["get", "height"],
		"fill-extrusion-base": 0,
		"fill-extrusion-opacity": 0.7,
	},
};

// Memoizes scale calculations per date.
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
		zipCodes: null,
		geoJSONDate: null,
		quantiles: {
			all: [],
			perCapita: []
		}
	});
	const [date, setDate] = useState(0);
	const [legendQuantiles, setLegendQuantiles] = useState([]);
	const [hoveredFeature, setHoveredFeature] = useState({});
	let query = useQuery();
	const [debouncedUpdateSelfUrl] = useDebouncedCallback(updateSelfUrl, 50);
	const prevData = usePrevious(data);
	const [isInfoPanelInFocus, setIsInfoPanelInFocus] = useState(false);
	const [userIsMovingMap, setUserIsMovingMap] = useState(false);
	const [isPerCapita, setIsPerCapita] = useState(false);
	const [minMaxDate, setMinMaxDate] = useState({ min: 0, max: 1 });
	const prevIsPerCapita = usePrevious(isPerCapita);
	const prevDate = usePrevious(date);

	const { geoJSONFeatures, zipCodes, geoJSONDate, quantiles } = data;
	const { latitude, longitude, zoom } = viewState;
	const { min: minDate, max: maxDate } = minMaxDate;

	function init() {
		//fetchAllData();

		document.title = SITE_NAME;

		// Attemps to grab viewport info from the URL.
		const lat = parseFloat(query.get("lat"));
		const lng = parseFloat(query.get("lng"));
		const zoom = parseFloat(query.get("zoom"));
		const viewportInURL = lat && lng && zoom;
		if (viewportInURL) {
			setViewState({
				...viewState,
				latitude: lat,
				longitude: lng,
				zoom,
			});
		} else {
			// Default viewport: fit state bounds to window.
			const viewport = new WebMercatorViewport({
				width: window.innerWidth,
				height: window.innerHeight,
			}).fitBounds(
				[
					[-83.96873, 35.361338],
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
			// Cleanup
			memoizedFeaturesForDate = null;
		};
	}
	useEffect(init, []);

	/**
	 * Fetches all GeoJSON for zip codes, as well as case counts per day and zip code.
	 */
	async function fetchAllData() {
		// Daily updates daily, so bust the cache daily.
		const cacheBust = formatDay();

		const [zipCodes, zipCodesGeoJSON] = await fetchMultipleJSON(
			`${dataBasePath}/${zipMetaFilename}?${cacheBust}`,
			`${dataBasePath}/${geoJSONFilename}`
		);

		setData({
			...data,
			geoJSONFeatures: zipCodesGeoJSON.features,
			zipCodes,
			quantiles: zipCodes.meta.quantiles
		});

		const oldestDate = getDayOfYear(zipCodes.meta.dates[0]);
		const newestDate = getDayOfYear(zipCodes.meta.dates[zipCodes.meta.dates.length - 1]);

		setMinMaxDate({ min: oldestDate, max: newestDate,  });

		setDate(newestDate);
	}

	// Update data in response to date changes.
	useEffect(() => {
		const needsInitialization =
			(!prevData || !prevData.zipCodes) && zipCodes;
		const casesChanged = zipCodes && geoJSONDate && geoJSONDate !== date;
		const perCapitaChanged = prevIsPerCapita !== isPerCapita;
		const dateChanged = date !== 0 && prevDate !== date;

		if (
			needsInitialization ||
			casesChanged ||
			(perCapitaChanged && zipCodes) ||
			dateChanged
		) {
			// Performs initial calculation if memoized value isn't found.
			if (
				!memoizedFeaturesForDate[date] ||
				!memoizedFeaturesForDate[date][isPerCapita]
			) {
				const { features, legend } = computeFeaturesForDate(
					date,
					zipCodes,
					geoJSONFeatures,
					isPerCapita,
					quantiles
				);
				if (!memoizedFeaturesForDate[date]) {
					memoizedFeaturesForDate[date] = {};
				}
				memoizedFeaturesForDate[date][isPerCapita] = features;

				// Initialize legend quantiles if needed.
				if (!legendQuantiles.domainMax) {
					const { quantiles, domainMax } = legend;
					setLegendQuantiles([...quantiles, domainMax]);
				}
			}

			setData({
				...data,
				geoJSONFeatures: memoizedFeaturesForDate[date][isPerCapita],
				geoJSONDate: date,
			});

			// Updates popup data when year changes while hovering (e.g. keyboard arrow interaction).
			const userIsHovering = hoveredFeature.feature;
			if (userIsHovering) {
				const feature = memoizedFeaturesForDate[date][isPerCapita].find(
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
	}, [data, date, isPerCapita]);

	function updateSelfUrl(newUrl) {
		history.replace(newUrl);
	}

	const geoJSONData = {
		type: "FeatureCollection",
		features: geoJSONFeatures,
	};

	function handleDateChange(event, date) {
		setDate(date);
	}

	function handleHover(event) {
		if (userIsMovingMap) return;

		const {
			features,
			srcEvent: { offsetX, offsetY },
			pointerType,
		} = event;

		const feature = features && features.find((f) => f.layer.id === "data");

		setHoveredFeature({ pointerType, feature, x: offsetX, y: offsetY });
	}

	function handlePerCapitaChange() {
		setIsPerCapita(!isPerCapita);
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

	function handleInfoPanelFocusBlur(isInFocus) {
		setIsInfoPanelInFocus(isInFocus);
	}

	function handleInteractionStateChange(interactionState) {
		const {
			inTransition,
			isDragging,
			isPanning,
			isRotating,
			isZooming,
		} = interactionState;

		const userIsMoving =
			inTransition || isDragging || isPanning || isRotating || isZooming;

		setUserIsMovingMap(userIsMoving);
	}

	function handleLoad() {
		fetchAllData();
	}

	const isLoading = geoJSONData.features.length === 0;

	return (
		<div className={styles.container}>
			{!isLoading && (
				<div className={styles.dateSliderContainer}>
					<Slider
						value={date}
						aria-labelledby="discrete-slider"
						step={null}
						marks={getSliderMarks(zipCodes.meta.dates)}
						min={minDate}
						max={maxDate}
						onChange={handleDateChange}
						valueLabelDisplay="on"
						valueLabelFormat={dayOfYearToDisplayDate}
					/>
				</div>
			)}

			<FormControlLabel
				control={
					<Checkbox
						checked={isPerCapita}
						onChange={handlePerCapitaChange}
						name="checkedB"
						color="primary"
					/>
				}
				label="Per Capita"
			/>
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
				onInteractionStateChange={handleInteractionStateChange}
				onLoad={handleLoad}
			>
				<div className={styles.mapNavContainer}>
					<NavigationControl showCompass={false} />
				</div>

				{!isLoading && (
					<Source type="geojson" data={geoJSONData}>
						{/* <Layer {...extrusionDataLayer} /> */}
						<Layer {...dataLayer} />
					</Source>
				)}
				<Legend quantiles={legendQuantiles} />
				<InfoPanel
					onInfoPanelFocusBlur={handleInfoPanelFocusBlur}
					captureScroll={isInfoPanelInFocus}
				/>
			</ReactMapGL>
			{!isInfoPanelInFocus && (
				<HoverPopup hoveredFeature={hoveredFeature} date={date} />
			)}
		</div>
	);
};

export default Root;
