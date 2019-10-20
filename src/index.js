import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import "bootstrap/dist/css/bootstrap.min.css";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faCompass,
  faCoffee,
  faBirthdayCake,
  faChess,
  faTableTennis,
  faCocktail,
  faUtensils,
  faHiking,
  faHandshake,
  faGraduationCap
} from "@fortawesome/free-solid-svg-icons";

// Importing icons
library.add( 
  faCompass,
  faCoffee,
  faBirthdayCake,
  faChess,
  faTableTennis,
  faCocktail,
  faUtensils,
  faHiking,
  faHandshake,
  faGraduationCap
);

// Entry point for react app
ReactDOM.render(<App />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
