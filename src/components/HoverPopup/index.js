import React, { useState, useEffect } from "react";
import styles from "./hoverPopup.css";

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
			<div>
				{zip} {county && `(${county})`}
			</div>
			<div>
				{!!(typeof positiveCases === "number")
					? `${positiveCases} positive case${
							positiveCases === 1 ? "" : "s"
					  }`
					: "No data"}
			</div>
			{!!(typeof positiveCases === "number") && (
				<span>
					<span>Percentile (of entire date range): </span>
					<span>{percentile}</span>
				</span>
			)}
		</div>
	);
}
