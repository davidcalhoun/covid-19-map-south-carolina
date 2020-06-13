import React, { useState, useEffect } from "react";
import {
	TextBlock,
	MediaBlock,
	TextRow,
	RectShape,
	RoundShape,
} from "react-placeholder/lib/placeholders";
import ReactPlaceholder from "react-placeholder";

import styles from "./legend.css";
import { round, pluralize, roundFloat, changePercentForDisplay } from "../../utils";

function getLegendQuantileBounds(quantiles, start, end) {
	const startNum = round(quantiles[start]);
	const endNum = round(quantiles[end]);

	if (startNum === endNum) {
		return `${startNum} ${pluralize(startNum, "case")}`;
	} else {
		return `${startNum}-${endNum} cases`;
	}
}

const LegendPlaceHolder = ({ className }) => {
	return (
		<div className={`${className} ${styles.legendPlaceholder}`}>
			<TextBlock rows={6} color="#a4a4a47a" />
		</div>
	);
};

const getLabel = (value, quantiles, viewMode) => {
	switch (viewMode) {
		case "percapita":
			return `${roundFloat(quantiles[value])}${getSuffix(viewMode)}`;
		case "change":
			return `${changePercentForDisplay(quantiles[value])}${getSuffix(viewMode)}`;
		case "all":
		default:
			return `${round(quantiles[value])} ${getSuffix(viewMode, quantiles[value])}`;
	}
}

function getMaxVal (props, viewMode) {
	const { maxAll, maxPerCapita, maxAverageChange } = props;

	switch (viewMode) {
		case "percapita":
			return roundFloat(maxPerCapita);
		case "change":
			return round(maxAverageChange * 100);
		case "all":
		default:
			return maxAll;
	}
}

function getSuffix(viewMode, val) {
	switch (viewMode) {
		case "percapita":
			return ' per 10k';
		case "change":
			return '% change';
		case "all":
		default:
			return ` ${pluralize(val, "case")}`;
	}
}

export default function Legend(props) {
	const { quantiles, viewMode } = props;

	const maxVal = getMaxVal(props, viewMode);

	return (
		<div className={styles.container}>
			<div className={styles.legendColorsContainer}>
				<div className={styles.legendColors} />
				<ReactPlaceholder
					showLoadingAnimation
					ready={quantiles.length > 0}
					type="media"
					rows={6}
					customPlaceholder={
						<LegendPlaceHolder className={styles.legendNumbers} />
					}
				>
					<div className={styles.legendNumbers}>
						<p>{getLabel(0, quantiles, viewMode)}</p>
						<p>
							{getLabel(32, quantiles, viewMode)}
						</p>
						<p>
							{getLabel(49, quantiles, viewMode)}
						</p>
						<p>
							{getLabel(65, quantiles, viewMode)}
						</p>
						<p>
							{getLabel(82, quantiles, viewMode)}
						</p>
						<p>
							{maxVal}{getSuffix(viewMode, maxVal)}
						</p>
					</div>
				</ReactPlaceholder>
			</div>
		</div>
	);
}
