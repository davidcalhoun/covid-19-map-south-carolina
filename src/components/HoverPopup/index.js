import React, { useState, useEffect } from "react";
import styles from "./hoverPopup.css";

import { pluralize, getIntOrdinal } from "../../utils";

export default function HoverPopup({ hoveredFeature, date }) {
	if (!hoveredFeature || !hoveredFeature.feature) {
		return null;
	}

	const { pointerType, feature, x: rawX, y: rawY } = hoveredFeature;

	const hasCursor = pointerType === "mouse";

	const {
		ZCTA5CE10: zip,
		county,
		positiveCases,
		percentile,
	} = feature.properties;

	let x = rawX;
	let y = rawY;
	if (x + 160 > window.innerWidth) {
		// Move popup to the left.
		if (hasCursor) {
			x = x - 180;
		} else {
			x = x - 160;
		}
		
	}

	if (y + 220 > window.innerHeight) {
		// Move popup above.
		if (hasCursor) {
			y = y - 60;
		} else {
			y = y - 40;
		}
	}

	const hasCases = Number.isInteger(positiveCases);

	return (
		<div
			className={styles.container}
			style={{
				left: x + 20,
				top: y + 20,
			}}
		>
			<p className={styles.cases}>
				{hasCases
					? <span><span className={styles.casesValue}>{positiveCases}</span> {pluralize(positiveCases, 'case')}</span>
					: "No data"}
			</p>
			<p className={styles.zip}>{zip} {county && <span className={styles.county}>({county} County)</span>}</p>
			{hasCases && (
				<p className={styles.percentile}>
					{percentile}{getIntOrdinal(percentile)} percentile*
				</p>
			)}
		</div>
	);
}
