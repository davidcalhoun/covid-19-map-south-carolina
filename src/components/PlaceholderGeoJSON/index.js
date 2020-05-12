import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useHistory, useLocation } from "react-router-dom";
import ReactMapGL, {
	Source,
	Layer,
	NavigationControl,
	Popup,
	WebMercatorViewport,
} from "react-map-gl";
import { deepAssign } from "deep-object-assign-with-reduce";

import { useInterval } from "../../utils";

export default function PlaceholderGeoJSON({ data }) {
	const [dataLayer, setDataLayer] = useState({
		id: "data",
		type: "fill",
		paint: {
			"fill-color": "gray",
			"fill-opacity": 0.5,
			"fill-opacity-transition": {
				duration: 1000,
				delay: 500,
			},
		},
	});

	setTimeout(() => {
		const newDataLayer = deepAssign({}, dataLayer, {});

		setDataLayer(newDataLayer);
	}, 300);

// 	useInterval(() => {
// 		const newDataLayer = deepAssign({}, dataLayer, {
// 			paint: {
// 				"fill-color":
// 					dataLayer.paint["fill-color"] === "gray" ? "white" : "gray",
// 			},
// 		});
// 
// 		setDataLayer(newDataLayer);
// 	}, 1000);

	return (
		<Source type="geojson" data={data}>
			<Layer {...dataLayer} />
		</Source>
	);
}
