export const casesData = [
	{
		filename: "2020-03-26.json",
		dayOfYear: 86,
		sourceUrl: "https://scdhec.gov/sites/default/files/media/document/Covid-Zip-Code-Analysis-3_27_2020.pdf"
	},
	{
		filename: "2020-04-02.json",
		dayOfYear: 93,
		sourceUrl: "https://scdhec.gov/sites/default/files/media/document/Covid%20Zip%20Analysis%204_3_2020%20No%20Estimates_0.pdf"
	},
	{
		filename: "2020-04-03.json",
		dayOfYear: 94,
		sourceUrl: "https://scdhec.gov/sites/default/files/media/document/Covid%20Zip%20Code%20Analysis_Public_4_4_20.pdf"
	},
	{
		filename: "2020-04-04.json",
		dayOfYear: 95,
		sourceUrl: "https://scdhec.gov/sites/default/files/media/document/Covid-Zip-Code-Analysis-Public-4_5_2020.pdf"
	},
	{
		filename: "2020-04-05.json",
		dayOfYear: 96,
		sourceUrl: "https://www.scdhec.gov/sites/default/files/media/document/Zip%20Code%20Counts%20and%20Estimated%20Numbers%20Updated_4_6_2020_0.pdf"
	},
	{
		filename: "2020-04-06.json",
		dayOfYear: 97,
		sourceUrl: "https://scdhec.gov/sites/default/files/media/document/COVID19_Zip_Code_Counts_and_Estimates_Public-04.07.2020.pdf"
	},
	{
		filename: "2020-04-07.json",
		dayOfYear: 98,
		sourceUrl: "https://www.scdhec.gov/sites/default/files/media/document/COVID19_Zip_Code_Counts_and_Estimated_Numbers-04.08.2020.pdf"
	},
	{
		filename: "2020-04-08.json",
		dayOfYear: 99,
		sourceUrl: "https://www.scdhec.gov/sites/default/files/media/document/Zip-Code-Counts-Estimated-Numbers-4_9_2020.pdf"
	},
	{
		filename: "2020-04-09.json",
		dayOfYear: 100,
		sourceUrl: "https://www.scdhec.gov/sites/default/files/media/document/COVID19_Zip_Code_Analysis_Public-04.10.2020.pdf"
	},
	{
		filename: "2020-04-10.json",
		dayOfYear: 101,
		sourceUrl: "https://github.com/davidcalhoun/covid-19-map-south-carolina/blob/master/src/data/2020-04-10.pdf"
	},
	{
		filename: "2020-04-11.json",
		dayOfYear: 102,
		sourceUrl: "https://github.com/davidcalhoun/covid-19-map-south-carolina/blob/master/src/data/2020-04-11.pdf"
	},
	{
		filename: "2020-04-12.json",
		dayOfYear: 103,
		sourceUrl: "https://github.com/davidcalhoun/covid-19-map-south-carolina/blob/master/src/data/2020-04-12.pdf"
	},
	{
		filename: "2020-04-13.json",
		dayOfYear: 104,
		sourceUrl: "https://github.com/davidcalhoun/covid-19-map-south-carolina/blob/master/src/data/2020-04-13.pdf"
	},
	{
		filename: "2020-04-14.json",
		dayOfYear: 105,
		sourceUrl: "https://github.com/davidcalhoun/covid-19-map-south-carolina/blob/master/src/data/2020-04-14.pdf"
	},
	{
		filename: "2020-04-15.json",
		dayOfYear: 106,
		sourceUrl: "https://github.com/davidcalhoun/covid-19-map-south-carolina/blob/master/src/data/2020-04-15.pdf"
	},
	{
		filename: "2020-04-16.json",
		dayOfYear: 107,
		sourceUrl: "https://github.com/davidcalhoun/covid-19-map-south-carolina/blob/master/src/data/2020-04-16.pdf"
	},
	{
		filename: "2020-04-17.json",
		dayOfYear: 108,
		sourceUrl: "https://github.com/davidcalhoun/covid-19-map-south-carolina/blob/master/src/data/2020-04-17.pdf"
	},
	{
		filename: "2020-04-18.json",
		dayOfYear: 109,
		sourceUrl: "https://github.com/davidcalhoun/covid-19-map-south-carolina/blob/master/src/data/2020-04-18.pdf"
	},
	{
		filename: "2020-04-19.json",
		dayOfYear: 110,
		sourceUrl: "https://github.com/davidcalhoun/covid-19-map-south-carolina/blob/master/src/data/2020-04-19.pdf"
	},
	{
		filename: "2020-04-20.json",
		dayOfYear: 111,
		sourceUrl: "https://github.com/davidcalhoun/covid-19-map-south-carolina/blob/master/src/data/2020-04-20.pdf"
	},
	{
		filename: "2020-04-21.json",
		dayOfYear: 112,
		sourceUrl: "https://github.com/davidcalhoun/covid-19-map-south-carolina/blob/master/src/data/2020-04-21.pdf"
	},
	{
		filename: "2020-04-22.json",
		dayOfYear: 113,
		sourceUrl: "https://github.com/davidcalhoun/covid-19-map-south-carolina/blob/master/src/data/2020-04-22.pdf"
	},
	{
		filename: "2020-04-23.json",
		dayOfYear: 114,
		sourceUrl: "https://github.com/davidcalhoun/covid-19-map-south-carolina/blob/master/src/data/2020-04-23.pdf"
	}
];

export const MIN_DATE = casesData[0].dayOfYear;
export const MAX_DATE = casesData[casesData.length - 1].dayOfYear;

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

export const isProd = !window.location.href.includes("http://localhost");

