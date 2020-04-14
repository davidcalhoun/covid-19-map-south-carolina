import { fileURLToPath } from "url";
import { dirname, normalize } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { promises as fs } from "fs";

const { readFile, writeFile } = fs;

const stripQuotes = str => str.replace(/"|'/g, '');

async function getSCZips(inputFilename, outputFilename) {
	let zips;
	try {
		zips = await readFile(inputFilename, "utf8");
	} catch (e) {
		console.error(`Could not find file ${inputFilename}`);
		return;
	}

	// Iterates through each line in the file sequentially.
	const output = zips.split("\n").reduce((accum, line) => {
		const [
			zip,
			lat,
			lng,
			city,
			stateCode,
			stateName,
			zcta,
			parent_zcta,
			population,
			density,
			county_fips,
			county_name,
			county_weights,
			county_names_all,
			county_fips_all,
			imprecise,
			military,
			timezone
		] = line.split("\",\"");

		if (stateCode === 'SC') {
			accum[stripQuotes(zip)] = {
				zip: stripQuotes(zip),
				city: stripQuotes(city),
				countyNames: stripQuotes(county_names_all).split('|'),
				population: stripQuotes(population)
			};
		}

		return accum;
	}, {});

	await writeFile(outputFilename, JSON.stringify(output, null, 2));
}

getSCZips(
	normalize(`${__dirname}/../src/data/uszips.csv`),
	normalize(`${__dirname}/../src/data/scZipMeta.json`)
);
