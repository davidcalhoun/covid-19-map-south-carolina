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
import { round, pluralize, roundFloat } from "../../utils";

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

const getLabel = (value, quantiles, isPerCapita) => {
	return isPerCapita
		? `${roundFloat(quantiles[value])} per 10k`
		: `${round(quantiles[value])} ${pluralize(quantiles[value], "case")}`;
}

export default function Legend(props) {
	const { quantiles, isPerCapita, maxAll, maxPerCapita } = props;

	const maxVal = isPerCapita ? roundFloat(maxPerCapita) : maxAll;

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
						<p>0 {isPerCapita ? ' per 10k' : 'cases'}</p>
						<p>
							{getLabel(32, quantiles, isPerCapita)}
						</p>
						<p>
							{getLabel(49, quantiles, isPerCapita)}
						</p>
						<p>
							{getLabel(65, quantiles, isPerCapita)}
						</p>
						<p>
							{getLabel(82, quantiles, isPerCapita)}
						</p>
						<p>
							{maxVal} {isPerCapita ? ' per 10k' : 'cases'}
						</p>
					</div>
				</ReactPlaceholder>
			</div>
		</div>
	);
}
