import React, { useState, useEffect } from "react";
import styles from "./hoverPopup.css";

import { pluralize } from "../../utils";

export default function HoverPopup({ hoveredFeature, date }) {
	if (!hoveredFeature || !hoveredFeature.feature) {
		return null;
	}

	const { feature, x, y } = hoveredFeature;

	const {
		ZCTA5CE10: zip,
		county,
		positiveCases,
		percentile,
	} = feature.properties;

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
					<span>Percentile: </span>
					<span>{percentile}</span>
				</p>
			)}
		</div>
	);
}
