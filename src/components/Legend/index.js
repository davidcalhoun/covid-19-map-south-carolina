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
import { round, pluralize } from "../../utils";

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

export default function Legend(props) {
	const { quantiles } = props;
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
						<p>0 cases</p>
						<p>
							{round(quantiles[32])} {pluralize(quantiles[32], "case")}
						</p>
						<p>
							{round(quantiles[49])} {pluralize(quantiles[49], "case")}
						</p>
						<p>
							{round(quantiles[65])} {pluralize(quantiles[65], "case")}
						</p>
						<p>
							{round(quantiles[82])} {pluralize(quantiles[82], "case")}
						</p>
						<p>
							{round(quantiles[99])} {pluralize(quantiles[99], "case")}
						</p>
					</div>
				</ReactPlaceholder>
			</div>
		</div>
	);
}
