export const SITE_NAME = "COVID-19 in South Carolina by Zip Code";

export const MAPBOX_TOKEN_DEV =
	"pk.eyJ1IjoiZnJhbmtzdmFsbGkiLCJhIjoiY2s4b2x2MG9kMWFwaDNmcHo0ZmRqZ2RzbiJ9.wMtFSZlToyx6kGuvRAb05Q";

export const MAPBOX_TOKEN_PROD =
	"pk.eyJ1IjoiZnJhbmtzdmFsbGkiLCJhIjoiY2s4b2x3MWtsMWFhYjNrcGdjZGFwODAzYSJ9.9jBCOdZuM_1EQybnVrbngg";

export const BREAKPOINTS = {
	1: 100,
	4: 480,
	7: 768,
	9: 992,
	12: 1200,
};

/* Values: all, change, or percapita */
export const defaultView = "change";

export const isProd = !window.location.href.includes("http://localhost");

export const southCarolinaGeoJSON = {
	type: "Polygon",
	coordinates: [
		[
			[-82.764143, 35.066903],
			[-82.550543, 35.160011],
			[-82.276696, 35.198349],
			[-81.044384, 35.149057],
			[-81.038907, 35.044995],
			[-80.934845, 35.105241],
			[-80.781491, 34.935456],
			[-80.797922, 34.820441],
			[-79.675149, 34.80401],
			[-78.541422, 33.851022],
			[-78.716684, 33.80173],
			[-78.935762, 33.637421],
			[-79.149363, 33.380005],
			[-79.187701, 33.171881],
			[-79.357487, 33.007573],
			[-79.582041, 33.007573],
			[-79.631334, 32.887081],
			[-79.866842, 32.755634],
			[-79.998289, 32.613234],
			[-80.206412, 32.552987],
			[-80.430967, 32.399633],
			[-80.452875, 32.328433],
			[-80.660998, 32.246279],
			[-80.885553, 32.032678],
			[-81.115584, 32.120309],
			[-81.121061, 32.290094],
			[-81.279893, 32.558464],
			[-81.416816, 32.629664],
			[-81.42777, 32.843265],
			[-81.493493, 33.007573],
			[-81.761863, 33.160928],
			[-81.937125, 33.347144],
			[-81.926172, 33.462159],
			[-82.194542, 33.631944],
			[-82.325988, 33.81816],
			[-82.55602, 33.94413],
			[-82.714851, 34.152254],
			[-82.747713, 34.26727],
			[-82.901067, 34.486347],
			[-83.005129, 34.469916],
			[-83.339222, 34.683517],
			[-83.322791, 34.787579],
			[-83.109191, 35.00118],
			[-82.764143, 35.066903],
		],
	],
};
