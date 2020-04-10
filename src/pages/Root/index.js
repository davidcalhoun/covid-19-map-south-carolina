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
	computeFeaturesForDate,
} from "../../utils";
import { HoverPopup, InfoPanel, Legend } from "../../components";

const MAPBOX_TOKEN = isProd ? MAPBOX_TOKEN_PROD : MAPBOX_TOKEN_DEV;
const dataBasePath = isProd ? "/covid-19-map-south-carolina/data" : "/data";
const geoJSONFilepath = "sc_south_carolina_zip_codes_geo.lowres.json";

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
			["get", "opacity"]
		],
		"fill-outline-color": [
			"case",
			["boolean", ["feature-state", "hover"], false],
			"blue",
			"black",
		],
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
	const [isInfoPanelInFocus, setIsInfoPanelInFocus] = useState(false);
	const [userIsMovingMap, setUserIsMovingMap] = useState(false);

	const { geoJSONFeatures, cases, allCases, geoJSONDate } = data;
	const { latitude, longitude, zoom } = viewState;

	function init() {
		fetchAllData();

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
	 * Fetches all GeoJSON for zip codes, as well as cases counts per day and zip code.
	 */
	async function fetchAllData() {
		const casesFilePaths = casesFiles.map(
			(filename) => `${dataBasePath}/${filename}`
		);

		const [zipCodesGeoJSON, ...casesJSON] = await fetchMultipleJSON(
			`${dataBasePath}/${geoJSONFilepath}`,
			...casesFilePaths
		);

		setData({
			...data,
			geoJSONFeatures: zipCodesGeoJSON.features,
			cases: flattenCases(casesJSON[0], zipCodesGeoJSON.features),
			allCases: casesJSON.reduce((all, casesForDate) => {
				// Sanity check for any case file that already errored above.
				if (!casesForDate.meta) {
					return all;
				}

				// Merges zip codes with case counts for date.
				all[casesForDate.meta.date] = flattenCases(
					casesForDate,
					zipCodesGeoJSON.features
				);

				return all;
			}, {}),
		});

		setDate(MIN_DATE);
	}

	// Update data in response to date changes.
	useEffect(() => {
		const needsInitialization = (!prevData || !prevData.cases) && cases;
		const casesChanged = cases && geoJSONDate && geoJSONDate !== date;

		if (needsInitialization || casesChanged) {
			// Performs initial calculation if memoized value isn't found.
			if (!memoizedFeaturesForDate[date]) {
				const { features, legend } = computeFeaturesForDate(
					date,
					cases,
					allCases,
					geoJSONFeatures
				);
				memoizedFeaturesForDate[date] = features;

				// Initialize legend quantiles if needed.
				if (!legendQuantiles.domainMax) {
					const { quantiles, domainMax } = legend;
					setLegendQuantiles([...quantiles, domainMax]);
				}
			}

			setData({
				...data,
				geoJSONFeatures: memoizedFeaturesForDate[date],
				geoJSONDate: date,
			});

			// Updates popup data when year changes while hovering (e.g. keyboard arrow interaction).
			const userIsHovering = hoveredFeature.feature;
			if (userIsHovering) {
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
		if (userIsMovingMap) return;

		const {
			features,
			srcEvent: { offsetX, offsetY },
			pointerType,
		} = event;

		const feature = features && features.find((f) => f.layer.id === "data");

		setHoveredFeature({ pointerType, feature, x: offsetX, y: offsetY });
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
				onInteractionStateChange={handleInteractionStateChange}
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
