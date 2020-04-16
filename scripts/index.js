import { fileURLToPath } from 'url';
import { dirname, normalize } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

function isZipCode(str) {
	return !!str.match(/^[0-9]{5}$/);
}

function isCaseCount(str) {
	return !!str.match(/^[0-9]+$/);
}

function getCountyName(str) {
	const [fullMatch, countyName] = str.match(/^(\w+)\sCounty$/) || [];
	return countyName;
}

function isPrivateProp(keyName) {
	return keyName.startsWith('_');
}

// Removes props added to accumulator while iterating through line input.
function removePrivateProps(objRaw) {
	//const obj = {...objRaw};

	const obj = Object.entries(objRaw).reduce((accum, [key, val]) => {
		if (!isPrivateProp(key)) {
			accum[key] = val;
		}

		return accum;
	}, {});

	return obj;
}

async function casesToJSON(inputFilename, outputFilename) {
	let cases;
	try {
		cases = await readFile(inputFilename, "utf8");
	} catch(e) {
		console.error(`Could not find file ${inputFilename}`);
		return;
	}

	// Iterates through each line in the file sequentially.
	const output = cases.split('\n').reduce((accum, line) => {
		// Checks if a new county threshold was crossed.
		const county = getCountyName(line);
		if (county) {
			accum._currentCounty = county;
			accum._currentSection = 'zip';
			accum[county] = [];
			return accum;
		}

		// Checks if the end of the Zip code list was reached for this county.  If so,
		// we know we're now in the confirmed case counts section.
		if (line === 'Total') {
			accum._currentSection = 'counts';
			accum._countIndex = 0;
		}

		// Checks if the current line appears to be a zip code.
		if (isZipCode(line) && accum._currentSection === 'zip') {
			const newZip = {
				zip: line
			};
			accum[accum._currentCounty].push(newZip);
			return accum;
		}

		// Checks if the current line appears to be a confirmed case count.
		// Note: this assumes that the confirmed case count list will always appear first.  Subsequent
		// lists of numbers (e.g. estimated cases, possible cases) will be ignored
		
		if (isCaseCount(line) && accum._currentSection === 'counts') {
			const zipInitializedForCounty = typeof accum[accum._currentCounty][accum._countIndex] !== 'undefined';

			if (zipInitializedForCounty) {
				accum[accum._currentCounty][accum._countIndex].positive = line;
				accum._countIndex = accum._countIndex + 1;
			}
		}

		return accum;
	}, {});

	const cleanedOutput = removePrivateProps(output);



	await writeFile(outputFilename, JSON.stringify(cleanedOutput, null, 2));
}


async function newCasesToJSON(inputFilename, outputFilename) {
	let cases;
	try {
		cases = await readFile(inputFilename, "utf8");
	} catch(e) {
		console.error(`Could not find file ${inputFilename}`);
		return;
	}

	// Iterates through each line in the file sequentially.
	const output = cases.split('\n').reduce((accum, line) => {
		if (line === 'Zip') {
			accum._currentSection = 'zip';
			accum._indeces = [];
			accum._curIndex = 0;
		}

		if (line === 'Reported Cases') {
			accum._currentSection = 'counts';
			accum._curIndex = 0;
		}

		// Checks if the current line appears to be a zip code.
		if (isZipCode(line) && accum._currentSection === 'zip') {
			accum._indeces[accum._curIndex] = line;
			accum._curIndex++;

			return accum;
		}

		// Checks if the current line appears to be a confirmed case count.
		// Note: this assumes that the confirmed case count list will always appear first.  Subsequent
		// lists of numbers (e.g. estimated cases, possible cases) will be ignored
		
		if (isCaseCount(line) && accum._currentSection === 'counts') {
			const zipCode = accum._indeces[accum._curIndex];

			if (typeof zipCode === 'undefined') {
				return accum;
			}

			accum[zipCode] = line;
			accum._curIndex++;
			return accum;
		}

		return accum;
	}, {});

	const cleanedOutput = removePrivateProps(output);



	await writeFile(outputFilename, JSON.stringify(cleanedOutput, null, 2));
}


const date = '2020-04-15';

newCasesToJSON(normalize(`${__dirname}/../src/data/${date}.txt`), normalize(`${__dirname}/../src/data/${date}.json`));

