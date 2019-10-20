import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import { getAccessToken, setGoogleCode } from './gcapis_helper';
import { google } from 'googleapis';
import db from '../firebase/firestore';
import Joi from 'joi';

// Initial Setup of an express router.
const calendarApi = express.Router();
// Server credentials generated from Google Cloud Console. Accessed locally from credentials.json
const CREDENTIALS = JSON.parse(fs.readFileSync('server/keys/credentials.json'));
// Middleware to parse post requests into JSON objects.
calendarApi.use(bodyParser.json());

/**
 * Initlal endpoint accessed by the front-end. Requires the POST method body to include an entry of 'userId'
 * along with the userIdId.
 * If a token for the userId exists, queries the Google Calendar API and returns the events object.
 * If token doesn't exist, redirects to token generation at '/api/generate' along with 'userId'.
 * The caller can also optionally pass an eventConfig object to get a more personalized response.
 * The following proporties can be customized:
 *
 *  - calendarId : string
 *  - timeMin : ISOString
 *  - timeMax : ISOString
 *  - maxResult : int
 *  - singleEvents: boolean
 *  - orderBy: "startTime" OR "updated"
 *
 * Full list of configrations can be found at https://developers.google.com/calendar/v3/reference/events/list.
 */
calendarApi.post('/accesscalendar', (req, res) => {
  // Checks if the required 'user' query string is passed. Returns 400 otherwise.
  const schema = Joi.object().keys({
    userId: Joi.string().required(),
    eventConfig: Joi.object()
      .keys({
        calendarId: Joi.string(),
        timeMin: Joi.date().iso(),
        timeMax: Joi.date().iso(),
        maxResults: Joi.number(),
        singleEvent: Joi.boolean(),
        orderBy: Joi.string().valid('startTime', 'updated')
      })
      .min(1),
    session: Joi.object()
      .keys({
        id: Joi.string().required(),
        token: Joi.string().required()
      })
      .required()
  });
  const valid = Joi.validate(req.body, schema);
  if (valid.error !== null)
    res.status(400).send(valid.error.name + ': ' + valid.error.message);
  else {
    db.collection('tokens')
      .doc(req.body.userId)
      .get()
      .then(doc => {
        if (!doc.exists) {
          res
            .status(403)
            .send('User not authorized to access Google Calendars');
        } else {
          // Token found, query the API and respond with the events object.
          const {
            client_secret,
            client_id,
            redirect_uris
          } = CREDENTIALS.installed;
          const auth = new google.auth.OAuth2(
            client_id,
            client_secret,
            redirect_uris[1]
          );
          auth.setCredentials(doc.data().token);
          async function listEvents(auth) {
            const calendar = google.calendar({ version: 'v3', auth });
            // Config the events object as required by the API caller.
            const eventConfig = {
              calendarId: 'primary',
              timeMin: new Date().toISOString(),
              singleEvents: true,
              orderBy: 'startTime'
            };
            if (req.body.eventConfig != null) {
              await Object.entries(req.body.eventConfig).forEach(entry => {
                const [key, val] = entry;
                eventConfig[key] = val;
              });
            }
            await calendar.events.list(eventConfig, async (err, events) => {
              if (err) return console.log('The API returned an error: ' + err);
              res.status(200).send(events.data.items);
            });
          }
          listEvents(auth);
        }
      });
  }
});

/**
 * Redirection endpoint if the token of a userId does not exist.
 * Creates the authorization link
 * for oAuth2 verification and redirects to the generated authroization link.
 * Caller of endpoint can optinally pass a 'redirect' query
 * which accepts a boolean that decides
 * whether to redirect the newly created userId to the accesscalendar endpoint.
 */
calendarApi.use('/generate', (req, res) => {
  const valid = Joi.validate(
    req.query,
    Joi.object().keys({ userId: Joi.string().required() })
  );
  if (valid.error !== null) {
    res.status(400).send(valid.error.name + ': ' + valid.error.message);
  } else {
    const authUrl = getAccessToken(CREDENTIALS, req.query.userId);
    res.status(200).send(authUrl);
  }
});

/**
 * Landing point used by Google Calendar API to recall the calendarApi.after a userId has successfully logged
 * in to their google accounts. Has an calendarApi.nded 'code' and 'userId' that is used to generate the
 * token.json.
 */
calendarApi.use('/landpage/', (req, res) => {
  setGoogleCode(CREDENTIALS, req.query.code, req.query.userId).then(_ =>
    res
      .status(201)
      .redirect("http://localhost:3000")
  );
});

export default calendarApi;
