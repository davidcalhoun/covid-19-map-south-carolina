export const casesFiles = [
	"2020-03-26.json",
	"2020-04-02.json",
	"2020-04-03.json",
	"2020-04-04.json",
	"2020-04-05.json",
	"2020-04-06.json"
];

export const sliderMarks = [
	{
		value: 86,
		label: "March 26, 2020",
	},
	{
		value: 93,
	},
	{
		value: 94,
	},
	{
		value: 95,
	},
	{
		value: 96,
	},
	{
		value: 97,
		label: "April 6, 2020",
	},
];

export const MIN_DATE = sliderMarks[0].value;
export const MAX_DATE = sliderMarks[sliderMarks.length - 1].value;

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

export const dataSources = [
	{
		title: "3/26",
		url:
			"https://scdhec.gov/sites/default/files/media/document/Covid-Zip-Code-Analysis-3_27_2020.pdf",
	},
	{
		title: "4/2",
		url:
			"https://scdhec.gov/sites/default/files/media/document/Covid%20Zip%20Analysis%204_3_2020%20No%20Estimates_0.pdf",
	},
	{
		title: "4/3",
		url:
			"https://scdhec.gov/sites/default/files/media/document/Covid%20Zip%20Code%20Analysis_Public_4_4_20.pdf",
	},
	{
		title: "4/4",
		url:
			"https://scdhec.gov/sites/default/files/media/document/Covid-Zip-Code-Analysis-Public-4_5_2020.pdf",
	},
	{
		title: "4/5",
		url:
			"https://www.scdhec.gov/sites/default/files/media/document/Zip%20Code%20Counts%20and%20Estimated%20Numbers%20Updated_4_6_2020_0.pdf",
	},
	{
		title: "4/6",
		url: "https://scdhec.gov/sites/default/files/media/document/COVID19_Zip_Code_Counts_and_Estimates_Public-04.07.2020.pdf"
	}
];



