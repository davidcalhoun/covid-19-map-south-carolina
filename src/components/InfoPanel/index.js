import React, { useState, useEffect } from "react";
import styles from "./infoPanel.css";

import { dataSources } from "../../consts";

export default function InfoPanel(props) {
	return (
		<div className={styles.container}>
			<h2 className={styles.heading}>Info</h2>
			<p>Unofficial side project created by <a href="https://www.themaingate.net/" target="_blank" rel="noopener noreferrer">David Calhoun</a> (<a href="https://twitter.com/franksvalli" target="_blank" rel="noopener noreferrer">@franksvalli</a>).  For official data, refer to <a href="https://www.scdhec.gov/infectious-diseases/viruses/coronavirus-disease-2019-covid-19" target="_blank" rel="noopener noreferrer">SC DHEC</a>.</p>

			<h3 className={styles.heading}>Sources</h3>
			{
				dataSources.map(({ title, url }) => <a key={url} className={styles.sourceLink} href={url} target="_blank" rel="noopener noreferrer">{title}</a>)
			}
			<p><a href="https://github.com/OpenDataDE/State-zip-code-GeoJSON" target="_blank" rel="noopener noreferrer">Zip codes source</a>, compressed with <a href="https://github.com/maxogden/simplify-geojson" target="_blank" rel="noopener noreferrer">simplify-geojson</a></p>

			<h3 className={styles.heading}>Scale</h3>
			Choropleth map colors are determined using <a href="https://github.com/d3/d3-scale#quantile-scales" target="_blank" rel="noopener noreferrer">quantiles</a>.  Data domain is all nonzero zip code counts for all dates.
		</div>
	)
}