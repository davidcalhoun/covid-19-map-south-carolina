import React, { useState, useEffect } from "react";
import styles from "./infoPanel.css";

import { dataSources } from "../../consts";

export default function InfoPanel(props) {
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		// Open info panel automatically for large screens.
		if (window.innerWidth > 1200) {
			setIsOpen(true);
		}
	}, []);

	function toggleIsOpen() {
		setIsOpen(!isOpen);
	}

	return (
		<div className={`${styles.container} ${isOpen && styles.containerOpen}`}>
			<svg
				onClick={toggleIsOpen}
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 512 512"
				className={styles.infoIcon}
			>
				<title>Open Info panel</title>
				<path d="M256 8C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm0 110c23.196 0 42 18.804 42 42s-18.804 42-42 42-42-18.804-42-42 18.804-42 42-42zm56 254c0 6.627-5.373 12-12 12h-88c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h12v-64h-12c-6.627 0-12-5.373-12-12v-24c0-6.627 5.373-12 12-12h64c6.627 0 12 5.373 12 12v100h12c6.627 0 12 5.373 12 12v24z" />
			</svg>
			{isOpen && (
				<div>
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
								<a
									href={url}
									target="_blank"
									rel="noopener noreferrer"
								>
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
					<p>
						Percentile calculated using data domain (all dates).
					</p>
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
			)}
		</div>
	);
}
