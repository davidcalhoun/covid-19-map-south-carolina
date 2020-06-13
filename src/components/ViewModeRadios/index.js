import React, { useState, useEffect, useMemo } from "react";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";

import styles from "./viewModeRadios.css";

const defaultView = "all";

export default function ViewModeRadios(props) {
	const { onChange } = props;
	const [view, setView] = useState(defaultView);

	const handleChange = (event) => {
		setView(event.target.value);
		onChange(event.target.value);
	};

	return (
		<FormControl component="fieldset" className={styles.container}>
			<FormLabel component="legend">View By:</FormLabel>
			<RadioGroup
				aria-label="view mode"
				name="viewmode"
				value={view}
				onChange={handleChange}
			>
				<FormControlLabel
					value={defaultView}
					control={<Radio />}
					label="All Cases"
				/>
				<FormControlLabel
					value="percapita"
					control={<Radio />}
					label="Per Capita"
				/>
				<FormControlLabel
					value="change"
					control={<Radio />}
					label="Daily Change %"
				/>
			</RadioGroup>
		</FormControl>
	);
}
