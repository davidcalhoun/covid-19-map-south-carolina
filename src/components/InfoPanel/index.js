import React, { useState, useEffect } from "react";
import styles from "./infoPanel.css";

import { dataSources } from "../../consts";

export default function InfoPanel(props) {
	return (
		<div className={styles.container}>
			<h2 className={styles.heading}>Info</h2>
			<p>
				Unofficial side project created by{" "}
				<a
					href="https://www.themaingate.net/"
					target="_blank"
					rel="noopener noreferrer"
				>
					David Calhoun
				</a>{" "}
				(
				<a
					href="https://twitter.com/franksvalli"
					target="_blank"
					rel="noopener noreferrer"
				>
					@franksvalli
				</a>
				). For official data, refer to{" "}
				<a
					href="https://www.scdhec.gov/infectious-diseases/viruses/coronavirus-disease-2019-covid-19"
					target="_blank"
					rel="noopener noreferrer"
				>
					SC DHEC
				</a>
				.
			</p>
			<h3 className={styles.heading}>Sources</h3>
			{dataSources.map(({ title, url }, index) => {
				const isLast = index === dataSources.length - 1;
				return (
					<span key={url} className={styles.sourceLink}>
						<a href={url} target="_blank" rel="noopener noreferrer">
							{title}
						</a>
						{!isLast && `, `}
					</span>
				);
			})}
			<h3 className={styles.heading}>Scale</h3>
			Choropleth map colors are determined using{" "}
			<a
				href="https://github.com/d3/d3-scale#quantile-scales"
				target="_blank"
				rel="noopener noreferrer"
			>
				quantiles
			</a>
			. Data domain is all nonzero zip code counts for all dates.
			<h3 className={styles.heading}>Code Source</h3>
			Source and implementation details readme at{" "}
			<a
				href="https://github.com/davidcalhoun/covid-19-map-south-carolina"
				target="_blank"
				rel="noopener noreferrer"
			>
				Github
			</a>{" "}
			(help and corrections welcome!)
		</div>
	);
}
