import React, { useState, useEffect } from "react";
import {
	BrowserRouter as Router,
	Switch,
	Route,
	Link,
	Redirect,
	useRouteMatch,
	useParams
} from "react-router-dom";
import { withStyles } from '@material-ui/core/styles';

import styles from "./header.css";
import { SITE_NAME } from "../../consts";

function Header({ breakpoint }) {
	useEffect(() => {
		document.documentElement.classList.remove("no-js");
	}, []);

	return (
		<header className={styles.container}>
			<Link to="/" replace>
				<h1 className={styles.title}>{ SITE_NAME }</h1>
			</Link>
		</header>
	);
}

export default Header;
