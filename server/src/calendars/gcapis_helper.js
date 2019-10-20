import { google } from "googleapis";
import db from "../firebase/firestore";
import request from "request";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];
/**
 * Generates an authorization link which can be visited to generate the oAuth2 token for verification
 * on google cloud platforms such as Google Calendar.
 * @param {string} credentials The server credentials accessed from the Google API Console
 * @param {string} userName The username of the person for whom the token should be generated.
 */
export function getAccessToken(credentials, userName) {
  try {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[1] + `?userId=${userName}`
    );
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES
    });
    return authUrl;
  } catch (err) {
    console.log(err);
  }
}

/**
 * Generates an oAuth2 object using the authorization code accessed from Google and generates a
 * token.json using that object. Writes that file locally to tokens/<user-name>.json
 * @param {string} credentials The server credentials accessed from the Google API Console.
 * @param {string} code The authorization code returned by Google's oAuth2 verification after
 *                      user login.
 * @param {string} user The name of the user for whom the token should be generated.
 */
export function setGoogleCode(credentials, code, user) {
  // Returns a promise that resolves after the token is written to a file.
  return new Promise((resolve, reject) => {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[1] + `?userId=${user}`
    );
    oAuth2Client.getToken(code, async (err, token) => {
      if (err) console.log(err);
      else {
        const tokenData = {
          userId: user,
          token: token
        };
        const userDocRef = db.collection("users").doc(user);
        const tokenDocRef = db.collection("tokens").doc(user);
        await db.runTransaction(t => {
          return t.getAll(userDocRef, tokenDocRef).then(snapshot => {
            t.update(snapshot[0].ref, { isCalLinked: true });
            t.set(snapshot[1].ref, tokenData);
          });
        });
        resolve();
      }
    });
  });
}

export function getUserGCalEvents(userId, startTime, endTime) {
  return new Promise((resolve, reject) => {
    request.post(
      "http://localhost:8000/api/calendars/accesscalendar",
      {
        json: {
          userId: userId,
          eventConfig: {
            timeMin: startTime,
            timeMax: endTime,
            singleEvent: true,
            orderBy: "startTime"
          },
          session: {
            id: "masterSession",
            token: masterSession
          }
        }
      },
      (err, res, body) => {
        if (err) reject(err);
        else resolve(body);
      }
    );
  });
}
