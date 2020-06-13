import React, { Fragment, useState, useEffect } from "react";

import styles from "./hoverPopup.css";
import { pluralize, getIntOrdinal, roundFloat, changePercentForDisplay } from "../../utils";

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
		perCapita,
		averageChange,
	} = feature.properties;

	let x = rawX;
	let y = rawY;
	if (x + 160 > window.innerWidth) {
		// Move popup to the left.
		if (hasCursor) {
			x = x - 200;
		} else {
			x = x - 180;
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

	// TODO: move popup below cursor when in upper bounds

	const hasCases = Number.isInteger(positiveCases);

	const per10k = roundFloat(perCapita);

	return (
		<div
			className={styles.container}
			style={{
				left: x + 20,
				top: y + 20,
			}}
		>
			<p className={styles.detail}>
				{hasCases ? (
					<span>
						<span className={styles.casesValue}>
							{positiveCases}
						</span>{" "}
						{pluralize(positiveCases, "case")}
					</span>
				) : (
					"No data"
				)}
			</p>
			<p className={styles.detail}>
				{zip}{" "}
				{county && (
					<span className={styles.county}>({county} County)</span>
				)}
			</p>
			{hasCases && (
				<Fragment>
					<p className={styles.detail}>
						{per10k} {pluralize(per10k, "case")} per 10k.
					</p>
					<p className={styles.detail}>
						{changePercentForDisplay(averageChange)}% change (last 7-day average).
					</p>
					{/* <p className={styles.detail}> */}
					{/* 	{percentile}{getIntOrdinal(percentile)} percentile* */}
					{/* </p> */}
				</Fragment>
			)}
		</div>
	);
}
