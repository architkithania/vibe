import express from "express";
import bodyParser from "body-parser";
import calendarApi from "./calendars/calendar-router";
import authuser from "./users/authuser";
import users from "./users/users-route";
import groups from "./groups/groups-router";
import events from "./events/events-router";
import friends from "./friends/friends-router";
import randToken from "rand-token";

// Initial Setup of an express app.
const app = express();

// Initialize Global Variables.
global.RunTimeUsers = new Map();
global.masterSession = null;

//Set up Master Session
do{
  masterSession = randToken.generate(16);
} while (RunTimeUsers.has(masterSession));
RunTimeUsers.set(masterSession, "masterSession");
console.log(`Master Session: ${masterSession}`);

// Middleware to parse post requests into JSON objects.
app.use(bodyParser.json());

/**
 * All POST endpoints MUST pass through this middleware. Authenthicates a request with a
 * randomly generated pre defined token and only carries the request if the token is 
 * authenthicated. Terminates the request immediately if the token is not found or if 
 * the token is expired.
 */
app.use("/", (req, res, next) => {
  if (
    !["/api/authuser/login", "/api/authuser/signup"].includes(
      req.originalUrl
    ) &&
    req.method == "POST"
  ) {
    if (
      req.body.session !== undefined &&
      req.body.session.id == RunTimeUsers.get(req.body.session.token)
    ) {
      next();
    } else {
      res.status(403).send("Expired or Invalid Token");
    }
  } else {
    next();
  }
});

// Calendars Router
app.use("/api/calendars", calendarApi);

// Users Router
app.use("/api/users", users);

// Autherization Router
app.use("/api/authuser", authuser);

// Groups Router
app.use("/api/groups", groups);

// Events Router
app.use("/api/events", events);

// Friends Router
app.use("/api/friends", friends);

// Hosting app on port 8000.
app.listen(8000, () => {
  console.log("Hosting on http://localhost:8000");
});