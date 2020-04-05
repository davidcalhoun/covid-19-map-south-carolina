import { promises as fs } from "fs";

const { readFile, writeFile } = fs;

function parseJSON(text) {
	let json = null;

	try {
		json = JSON.parse(text);
	} catch (e) {
		throw new Error("Error parsing JSON.");
	}

	return json;
}

async function merge(casesFilename, geoJSONFilename, outputFilename) {
	const cases = await readFile(casesFilename, "utf8");
	const geoJSON = await readFile(geoJSONFilename, "utf8");


	//await writeFile(outputFilename, JSON.stringify(output, null, 2));
}



merge('../data/2020-04-03.json', '../data/sc_south_carolina_zip_codes_geo.lowres.json');

