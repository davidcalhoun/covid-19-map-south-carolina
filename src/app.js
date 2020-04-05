import React, { Fragment, useEffect } from "react";
import {
	BrowserRouter as Router,
	Switch,
	Route,
	Link,
	Redirect,
	useRouteMatch,
	useParams
} from "react-router-dom";
import { hot } from "react-hot-loader/root";
import ReactDOM from "react-dom";
import { createStore, applyMiddleware } from "redux";
import { Provider } from "react-redux";
import thunk from "redux-thunk";
import { createLogger } from "redux-logger";

import { Root } from "./pages";
import { Header } from "./components";
import "./shared.css";
import styles from "./app.css";
import { BREAKPOINTS } from "./consts";
import { useWindowResize } from "./utils";

const middleware = [thunk];
if (process.env.NODE_ENV !== "production") {
	middleware.push(createLogger());
}

function App() {
	const [{ width, height, breakpoint }] = useWindowResize(BREAKPOINTS);
	document.documentElement.classList.remove("loading");

	return (
		<Router basename="/a/methane-emissions">
			<React.StrictMode>
				<Header breakpoint={breakpoint} />
				<Switch>
					<Route exact path={`/`}>
						<Root breakpoint={breakpoint} />
					</Route>
					<Route path={`/year/:year`}>
						<Root breakpoint={breakpoint} />
					</Route>
				</Switch>
			</React.StrictMode>
		</Router>
	);
}

export default hot(App);
