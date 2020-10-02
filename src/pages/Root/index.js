import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useHistory, useLocation } from "react-router-dom";
import ReactMapGL, {
	Source,
	Layer,
	NavigationControl,
	Popup,
	WebMercatorViewport,
	getMap,
} from "react-map-gl";
import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import { useDebouncedCallback } from "use-debounce";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import ReactPlaceholder from "react-placeholder";
import {
	TextBlock,
	MediaBlock,
	TextRow,
	RectShape,
	RoundShape,
} from "react-placeholder/lib/placeholders";

import {
	getDateFromDayNum,
	dayOfYearToDisplayDate,
	formatDay,
	getDayOfYear,
	getQuantilesFromViewMode,
} from "../../utils";

import {
	SITE_NAME,
	MAPBOX_TOKEN_DEV,
	MAPBOX_TOKEN_PROD,
	isProd,
	casesData,
	southCarolinaGeoJSON,
	defaultView
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
	ViewModeRadios,
} from "../../components";

const MAPBOX_TOKEN = isProd ? MAPBOX_TOKEN_PROD : MAPBOX_TOKEN_DEV;
const dataBasePath = "/covid-19-map-south-carolina/data";
const geoJSONFilename = "sc_south_carolina_zip_codes_geo.lowres.json";
const zipMetaFilename = "casesMerged.json";

function useQuery() {
	return new URLSearchParams(useLocation().search);
}

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

const SliderPlaceHolder = ({ className }) => {
	return (
		<div className={`${className}`}>
			<RectShape style={{ width: 220, height: 55 }} color="#a4a4a47a" />
		</div>
	);
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
			perCapita: [],
		},
	});
	const [date, setDate] = useState(0);
	const [legendQuantiles, setLegendQuantiles] = useState([]);
	const [hoveredFeature, setHoveredFeature] = useState({});
	let query = useQuery();
	const [debouncedUpdateSelfUrl] = useDebouncedCallback(updateSelfUrl, 50);
	const prevData = usePrevious(data);
	const [isInfoPanelInFocus, setIsInfoPanelInFocus] = useState(false);
	const [userIsMovingMap, setUserIsMovingMap] = useState(false);
	const [minMaxDate, setMinMaxDate] = useState({ min: 0, max: 1 });
	const prevDate = usePrevious(date);
	const [viewMode, setViewMode] = useState(defaultView);
	const [dataLayer, setDataLayer] = useState({
		id: "data",
		type: "fill",
		paint: {
			"fill-color": ["rgba", ["get", "red"], 0, 0, ["get", "opacity"]],
			"fill-color": [
				"case",
				["boolean", ["feature-state", "hover"], false],
				["rgba", 0, 0, 0, 1],
				["rgba", ["get", "red"], 0, 0, ["get", "opacity"]],
			],
			"fill-opacity": [
				"case",
				["boolean", ["feature-state", "hover"], false],
				1,
				["get", "opacity"],
			],
			"fill-opacity-transition": {
				duration: 500,
				delay: 0,
			},
			"fill-outline-color": [
				"case",
				["boolean", ["feature-state", "hover"], false],
				"white",
				"#757575",
			],
		},
	});
	const [mapRef, setMapRef] = useState(null);

	const {
		geoJSONFeatures,
		zipCodes,
		geoJSONDate,
		quantiles,
		maxAll,
		maxPerCapita,
		maxAverageChange,
	} = data;
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

	// Update data in response to date changes.
	useEffect(() => {
		const needsInitialization = !prevData?.geoJSONDate && date !== 0;

		if (needsInitialization) {
			updateFeatures(date);

			// const timer = setTimeout(() => {
			// 	setDataLayer({
			// 		...dataLayer,
			// 		paint: {
			// 			...dataLayer.paint,
			// 			"fill-opacity": 1,
			// 		},
			// 	});
			// }, 0);
		}
	}, [data, date]);

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

		const { quantiles } = zipCodes.meta;
		const { maxAll, maxPerCapita, maxAverageChange } = quantiles;

		setData({
			...data,
			geoJSONFeatures: zipCodesGeoJSON.features,
			zipCodes,
			quantiles,
			maxAll,
			maxPerCapita,
			maxAverageChange,
		});

		const oldestDate = getDayOfYear(zipCodes.meta.dateBounds.first);
		const newestDate = getDayOfYear(zipCodes.meta.dateBounds.last);

		setMinMaxDate({ min: oldestDate, max: newestDate });

		setDate(newestDate);
	}

	function updateFeatures(newDate = date, newViewMode = viewMode) {
		// Performs initial calculation if memoized value isn't found.
		if (
			!memoizedFeaturesForDate[newDate] ||
			!memoizedFeaturesForDate[newDate][newViewMode]
		) {
			const { features, legend } = computeFeaturesForDate(
				newDate,
				zipCodes,
				geoJSONFeatures,
				newViewMode,
				quantiles
			);
			if (!memoizedFeaturesForDate[newDate]) {
				memoizedFeaturesForDate[newDate] = {};
			}
			memoizedFeaturesForDate[newDate][newViewMode] = features;
		}

		const curQuantiles = getQuantilesFromViewMode(newViewMode, quantiles);
		setLegendQuantiles(curQuantiles);

		setData({
			...data,
			geoJSONFeatures: memoizedFeaturesForDate[newDate][newViewMode],
			geoJSONDate: newDate,
		});

		// Updates popup data when year changes while hovering (e.g. keyboard arrow interaction).
		const userIsHovering = hoveredFeature.feature;
		if (userIsHovering) {
			const feature = memoizedFeaturesForDate[newDate][newViewMode].find(
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

	function updateSelfUrl(newUrl) {
		history.replace(newUrl);
	}

	const geoJSONData = {
		type: "FeatureCollection",
		features: geoJSONFeatures,
	};

	function handleDateChange(event, date) {
		setDate(date);

		updateFeatures(date);
	}

	function handleHover(event) {
		if (userIsMovingMap) return;

		const {
			features,
			srcEvent: { offsetX, offsetY },
			pointerType,
		} = event;

		const feature = features && features.find((f) => f.layer.id === "data");

		if (!feature) return;

		setHoveredFeature({
			pointerType,
			feature,
			x: offsetX,
			y: offsetY,
			id: feature.id,
		});

		// Clear previous hovered feature, if any.
		if (hoveredFeature.id) {
			mapRef.getMap().setFeatureState(
				{
					source: "covid-data",
					id: hoveredFeature.id,
				},
				{
					hover: false,
				}
			);
		}

		mapRef.getMap().setFeatureState(
			{
				source: "covid-data",
				id: feature.id,
			},
			{
				hover: true,
			}
		);
	}

	function handleMouseOut() {
		mapRef.getMap().setFeatureState(
			{
				source: "covid-data",
				id: hoveredFeature.id,
			},
			{
				hover: false,
			}
		);

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

	function handleViewModeChange(val) {
		setViewMode(val);
		updateFeatures(date, val);
	}

	const sliderMarks = [
		{
			value: 63,
			label: "3/3",
		},
		{
			value: 92,
			label: "4/1",
		},
		{
			value: 122,
			label: "5/1",
		},
		{
			value: 153,
			label: "6/1",
		},
		{
			value: 183,
			label: "7/1",
		},
		{
			value: 214,
			label: "8/1",
		},
		{
			value: 245,
			label: "9/1",
		},
		{
			value: 275,
			label: "10/1",
		},
	];

	const isLoading = geoJSONData.features.length === 0;

	return (
		<div className={styles.container}>
			<div className={styles.controls}>
				<div className={styles.dateSliderContainer}>
					<ReactPlaceholder
						showLoadingAnimation
						ready={!isLoading}
						type="media"
						rows={1}
						customPlaceholder={<SliderPlaceHolder />}
					>
						<Slider
							value={date}
							aria-labelledby="discrete-slider"
							min={minDate}
							max={maxDate}
							onChange={handleDateChange}
							valueLabelDisplay="on"
							valueLabelFormat={dayOfYearToDisplayDate}
							marks={sliderMarks}
						/>
					</ReactPlaceholder>
				</div>
				<ViewModeRadios
					onChange={handleViewModeChange}
					className={styles.viewMode}
				/>
			</div>

			<ReactMapGL
				{...viewState}
				width="100%"
				height="100%"
				mapStyle="mapbox://styles/mapbox/light-v10"
				mapboxApiAccessToken={MAPBOX_TOKEN}
				onViewStateChange={handleViewStateChange}
				onHover={handleHover}
				onMouseOut={handleMouseOut}
				minZoom={4}
				maxZoom={15}
				onInteractionStateChange={handleInteractionStateChange}
				onLoad={handleLoad}
				ref={(ref) => setMapRef(ref)}
			>
				<div className={styles.mapNavContainer}>
					<NavigationControl showCompass={false} />
				</div>

				{!isLoading && (
					<Source id="covid-data" type="geojson" data={geoJSONData}>
						{/* <Layer {...extrusionDataLayer} /> */}
						<Layer id="covid-cases" {...dataLayer} />
					</Source>
				)}
				<Legend
					quantiles={legendQuantiles}
					maxAll={maxAll}
					maxPerCapita={maxPerCapita}
					maxAverageChange={maxAverageChange}
					viewMode={viewMode}
				/>
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
