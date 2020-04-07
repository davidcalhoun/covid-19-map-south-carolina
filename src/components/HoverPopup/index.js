import React, { useState, useEffect } from "react";
import styles from "./hoverPopup.css";

import { pluralize, getIntOrdinal } from "../../utils";

export default function HoverPopup({ hoveredFeature, date }) {
	if (!hoveredFeature || !hoveredFeature.feature) {
		return null;
	}

	const { feature, x: rawX, y: rawY } = hoveredFeature;

	const {
		ZCTA5CE10: zip,
		county,
		positiveCases,
		percentile,
	} = feature.properties;

	let x = rawX;
	let y = rawY;
	if (x + 200 > window.innerWidth) {
		// Move popup to the left of the cursor.
		x = x - 200;
	}

	if (y + 220 > window.innerHeight) {
		// Move popup above cursor.
		y = y - 60;
	}

	return (
		<div
			className={styles.container}
			style={{
				left: x + 20,
				top: y + 20,
			}}
		>
			<p className={styles.cases}>
				{!!(typeof positiveCases === "number")
					? <span><span className={styles.casesValue}>{positiveCases}</span> {pluralize(positiveCases, 'case')}</span>
					: "No data"}
			</p>
			<p className={styles.zip}>{zip} {county && <span className={styles.county}>({county} County)</span>}</p>
			{!!(typeof positiveCases === "number") && (
				<p className={styles.percentile}>
					{percentile}{getIntOrdinal(percentile)} percentile*
				</p>
			)}
		</div>
	);
}
