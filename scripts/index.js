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
	const cases = await readFile(inputFilename, "utf8");

	const output = cases.split('\n').reduce((accum, line) => {
		const county = getCountyName(line);
		if (county) {
			accum._currentCounty = county;
			accum._currentSection = 'zip';
			accum[county] = [];
			return accum;
		}

		if (line === 'Total') {
			accum._currentSection = 'counts';
			accum._countIndex = 0;
		}

		if (isZipCode(line) && accum._currentSection === 'zip') {
			const newZip = {
				zip: line
			};
			accum[accum._currentCounty].push(newZip);
			return accum;
		}

		if (isCaseCount(line) && accum._currentSection === 'counts') {
			if (accum[accum._currentCounty][accum._countIndex]) {
				accum[accum._currentCounty][accum._countIndex].positive = line;
				accum._countIndex = accum._countIndex + 1;
			} else {
				console.log(333, line)
			}
		}

		return accum;
	}, {});

	const cleanedOutput = removePrivateProps(output);

	await writeFile(outputFilename, JSON.stringify(cleanedOutput, null, 2));
}



casesToJSON('../data/2020-04-03.txt', '../data/2020-04-03.json');

