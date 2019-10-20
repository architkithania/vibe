import express from "express";
import bodyParser from "body-parser";
import db from "../firebase/firestore";
import FirestoreDeletionServices from "../firebase/FirestoreDeletionServices";
import Joi from "joi";
import schedule from "node-schedule";
import {getUserGCalEvents} from "../calendars/gcapis_helper";
import bubblesort from "bubblesort";
import quicksort from "optimized-quicksort";

const events = express.Router();

events.use(bodyParser.json());

events.use(bodyParser.json());

/**
 * An endpoint to load the event information of a given event of a given group. The endpoint
 * requires the user to pass in both the groupId and the eventId as query parameters. Also 
 * requires the user to pass a 'data' array with atleast length 1 as a query string.
 * 
 * Response Code:
 * - 200: Successful Request
 * - 400: Bad Request
 * - 404: Event Not Found
 */
events.get("/load/:groupId/:eventId", (req, res) => {
  if (req.query.data == undefined || req.query.data.length == 0) {
    res.status(400).send("Missing required 'data' array or 'data' array empty");
  } else {
    const keys = JSON.parse(req.query.data);
    const resObj = {};
    db.collection("groups")
      .doc(req.params.groupId)
      .collection("events")
      .doc(req.params.eventId)
      .get()
      .then(doc => {
        if (!doc.exists) {
          res.status(404).send("Event not found");
        } else {
          new Promise((resolve, reject) => {
            try {
              keys.forEach(async key => {
                if (key !== "attendees") {
                  resObj[key] = doc.data()[key];
                } else {
                  const mems = [];
                  await doc.ref
                    .collection(key)
                    .get()
                    .then(snapshot => {
                      snapshot.forEach(mem => mems.push(mem.data()));
                    });
                  resObj[key] = [];
                  resObj[key] = [...mems];
                  return resolve(resObj);
                }
                return resolve(resObj);
              });
            } catch (err) {
              return reject(err);
            }
          })
            .then(obj => res.status(200).json(obj))
            .catch(err => {
              res.status(400).send("Something went wrong");
              console.log(err);
            });
        }
      });
  }
});

/**
 * An endpoint to create an event for a given group. The request body must contain the 
 * following fields:
 * - groupId: the groupId of the group where the event is being created
 * - eventName: the name of the event
 * - host: an object containing the host information (refer to the schema below)
 * - startTime: ISO Formatted date string marking the start time of the event.
 * - endTime: ISO Formatted date string marking the end time of the event.
 * - hammerDropTime: ISO Formatted date string marking the hammer drop time of the event.
 * - duration: The duration of the event
 * - location: the location of the event
 * - description: A short description about the event
 * 
 * Response Codes:
 * 201: Event Created
 * 400: Bad Request
 */
events.post("/create", (req, res) => {
  const BreakException = {};
  const schema = Joi.object().keys({
    groupId: Joi.string().required(),
    eventName: Joi.string().required(),
    host: Joi.object()
      .keys({
        id: Joi.string().required(),
        name: Joi.string().required()
      })
      .required(),
    startTime: Joi.date()
      .iso()
      .required(),
    endTime: Joi.date()
      .iso()
      .required(),
    hammerDropTime: Joi.date()
      .iso()
      .required(),
    duration: Joi.number().required(),
    location: Joi.string().required(),
    type: Joi.string().required(),
    description: Joi.string().required(),
    session: Joi.object()
      .keys({
        id: Joi.string().required(),
        token: Joi.string().required()
      })
      .required()
  });
  try {
    Joi.validate(req.body, schema, err => {
      if (err) {
        res.status(400).send(err.name + ": " + err.message);
        throw BreakException;
      }
    });

    db.collection("groups")
      .doc(req.body.groupId)
      .get()
      .then(async doc => {
        if (!doc.exists) {
          res.status(404).send("Group does not exist");
        } else {
          const groupFields = {
            isResolved: false
          };
          Object.entries(req.body).forEach(entry => {
            const [key, val] = entry;
            if (key !== "session") {
              groupFields[key] = val;
            }
          });
          await Promise.all([
            doc.ref.update({ hasActiveEvents: true }),
            doc.ref
              .collection("events")
              .add(groupFields)
              .then(async eventDoc => {
                const eventStr = `events.${eventDoc.id}`;
                const eventsUpdate = {
                  hasActiveEvents: true
                };
                eventsUpdate[eventStr] = true;
                await Promise.all[
                  ((eventDoc.update({ id: eventDoc.id, attendees: 1 }),
                  db
                    .collection("groups")
                    .doc(req.body.groupId)
                    .collection("events")
                    .doc(eventDoc.id)
                    .collection("attendees")
                    .doc(req.body.host.id)
                    .set({ id: req.body.host.id, name: req.body.host.name })),
                  db
                    .collection("users")
                    .doc(req.body.host.id)
                    .collection("groups")
                    .doc(req.body.groupId)
                    .update(eventsUpdate),
                  db
                    .collection("events")
                    .doc(eventDoc.id)
                    .set({
                      name: req.body.eventName,
                      id: eventDoc.id,
                      type: req.body.type,
                      groupId: req.body.groupId
                    }))
                ];
              })
          ]);
          res.status(201).send("Event Created");
          const scheduledDate = new Date(Date.now());
          scheduledDate.setMinutes(scheduledDate.getMinutes() + 1);          
          schedule.scheduleJob(scheduledDate, () => {
            // calculateAvailabilities();
          });
        }
      });
  } catch (err) {
    if (err !== BreakException) console.log(err);
  }
});

/**
 * An endpoint allowing users to join an event. The endpoint requires that the user passes
 * the following fields:
 * - id: the user's id
 * - name: The user's full name in "First Last" format.
 * - groupId: the groupId of the group that the event belongs to. 
 * - eventId: the eventId of the event that the user wants to join.
 * 
 * Response Codes:
 * 200: User has joined the event
 * 400: Bad Request
 * 404: Group or Event not found.
 */
events.post("/join", (req, res) => {
  const BreakException = {};
  const schema = Joi.object().keys({
    id: Joi.string().required(),
    name: Joi.string().required(),
    groupId: Joi.string().required(),
    eventId: Joi.string().required(),
    session: Joi.object()
      .keys({
        id: Joi.string().required(),
        token: Joi.string().required()
      })
      .required()
  });

  try {
    Joi.validate(req.body, schema, err => {
      if (err) {
        res.status(400).send(err.name + ": " + err.message);
        BreakException;
      }
    });

    db.collection("groups")
      .doc(req.body.groupId)
      .get()
      .then(group => {
        if (!group.exists) {
          res.status(404).send("Group not found");
        } else {
          group.ref
            .collection("events")
            .doc(req.body.eventId)
            .get()
            .then(async event => {
              if (!event.exists) {
                res.status(404).send("Event not found");
              } else {
                const eventStr = `events.${req.body.eventId}`;
                const eventsUpdate = {
                  hasActiveEvents: true
                };
                eventsUpdate[eventStr] = true;
                await Promise.all[
                  (event.ref.update({ attendees: event.data().attendees + 1 }),
                  (event.ref
                    .collection("attendees")
                    .doc(req.body.id)
                    .set({ id: req.body.id, name: req.body.name }),
                  db
                    .collection("users")
                    .doc(req.body.id)
                    .collection("groups")
                    .doc(req.body.groupId)
                    .update({ hasActiveEvents: true }),
                  db
                    .collection("users")
                    .doc(req.body.id)
                    .collection("groups")
                    .doc(req.body.groupId)
                    .update(eventsUpdate)))
                ];
                res.status(200).send("User added to event");
              }
            });
        }
      });
  } catch (err) {
    if (err !== BreakException) console.log(err);
  }
});

/**
 * An endpoint to search all the known active events against a querystring. This endpoint
 * requires the user to pass in a queryString as a request parameter.
 * Responds with an array of objects that match the query string. 
 * 
 * Response Code:
 * 200: queryString successfully searched.
 * 400: Bad Request.
 */
events.get("/search/:queryString", (req, res) => {
  const resArr = [];
  const limitRes =
    req.query.max == undefined || parseInt(req.query.max) >= 15
      ? 15
      : parseInt(req.query.max);
  const count = req.query.max == undefined ? 0 : parseInt(req.query.count);
  db.collection("events")
    .where("type", "==", req.params.queryString)
    .limit(limitRes)
    .offset(limitRes * count)
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => resArr.push(doc.data()));
    })
    .then(_ => res.status(200).json(resArr));
});

events.post("/delete", (req, res) => {
  const BreakException = {};
  try {
    const schema = Joi.object().keys({
      groupId: Joi.string().required(),
      eventId: Joi.string().required()
    });

    Joi.validate(req.body, schema, err => {
      if (err) {
        res.status(400).send(err.name + ": " + err.message);
        throw BreakException;
      }
    })(async function() {
      const eventPath = `groups/${req.body.groupId}/events/${req.body.eventId}`;
      await new FirestoreDeletionServices().deepDeleteDoc(db, eventPath, 10);
      res.status(200).send("Event Deleted");
    })();
  } catch (err) {
    if (err !== BreakException) console.log(err);
  }
});

/**
 * An endpoint that runs the scheduling algorithm for a given event of a given group and
 * responds with the `n` most suitable times that will maximize the number of attendees who
 * can attend that event.
 * 
 * Note: `n` is determined by the `num` parameter which is passed along in the request body
 * and defaults to 3 if no value is provided.
 * 
 * Response Codes:
 * 200: Successfully calculated the `n` most suitable times.
 * 400: Bad Request.
 */
events.post("/getbesttimes", async (req, res) => {
  const BreakException = {};
  const schema = Joi.object().keys({
    groupId: Joi.string().required(),
    eventId: Joi.string().required(),
    num: Joi.number().integer(),
    session: Joi.object().keys({
      id: Joi.string().required(),
      token: Joi.string().required()
    })
  });

  Joi.validate(req.body, schema, err => {
    if (err) {
      res.status(400).send(err.name + ": " + err.message);
      throw BreakException;
    }
  });

  let numOfEvents = req.body.num ? req.body.num : 3;

  let freqTable;
  freqTable = await calculateAvailabilities(req.body.groupId, req.body.eventId);
  const bestTimes = {};

  for(let element in freqTable){
    bestTimes[element] = freqTable[element];
    numOfEvents--;
    if(numOfEvents == 0) break;
  }
  res.status(200).send(bestTimes);
});

/**
 * Calculates the availablties of all the people who are attending the events and returns
 * an availability hashmap that can be queried in average `O(n)` time.
 * 
 * @param {string} groupId 
 * @param {string} eventId 
 */
function calculateAvailabilities(groupId, eventId){
  return new Promise((res, rej) => {
    let freqTable = {};
  const eventRef = db.collection("groups").doc(groupId).collection("events").doc(eventId);
  eventRef.get().then(event => {
    const startTime = new Date(event.data().startTime);
    const endTime = new Date(event.data().endTime);
    const duration = event.data().duration * 60 * 60 * 1000;
    const interval = 900000;

    let currentTime = startTime;
    while(currentTime.getTime() + duration <= endTime.getTime()){
      freqTable[currentTime.getTime()] = 0;

      currentTime = new Date(currentTime.getTime() + interval);
    }

    const eventAttendeesRef = eventRef.collection("attendees");
    eventAttendeesRef.get().then(attendeeCollection => {
      const numberOfAttendees = attendeeCollection.size;
      attendeeCollection.forEach(userDoc => {
        getUserGCalEvents(userDoc.data().id, startTime, endTime).then(events => {
          events.forEach(eventCal => {
            const eventObj = {};
            if(eventCal.start.dateTime){
              eventObj.startTime = new Date(eventCal.start.dateTime).valueOf();
              eventObj.endTime = new Date(eventCal.end.dateTime).valueOf();
            }
            else{
              eventObj.startTime = new Date(eventCal.start.date).valueOf();
              eventObj.endTime = new Date(eventCal.end.date).valueOf();
            }
            Object.entries(freqTable).forEach(entry => {
              const [key, val] = entry;
              if(isClashing(key, parseInt(key) + duration, eventObj.startTime, eventObj.endTime)){
                freqTable[key] += 1;
              }
            });
            
          });
          const sorter = [];
          Object.entries(freqTable).forEach(entry => {
            sorter.push([entry[0], entry[1]]);
          });
          bubblesort(sorter, (a, b) => {
            return a[1]-b[1];
          })
          freqTable = {};
          sorter.forEach(element => {
            // console.log(`${new Date(parseInt(element[0])).toUTCString()} : ${element[1]}`);
            freqTable[element[0]] = (numberOfAttendees - element[1]) / numberOfAttendees * 100;
          });
          res(freqTable);

          // Object.entries(freqTable).forEach(entry => {
          //   const [key, val] = entry;
          //   console.log(`${(new Date(parseInt(key))).toUTCString()} -> ${(new Date(parseInt(key) + duration)).toUTCString()}: ${val}`);
          // });
        }).catch(rej => console.log("User has not linked Google Calendar"));
      });
    });

  });
  });
}

/**
 * Checks if two given times are clashing.
 * 
 * @param {int} event1Start 
 * @param {int} event1End 
 * @param {int} event2Start 
 * @param {int} event2End 
 */
function isClashing(event1Start, event1End, event2Start, event2End){
  return event1Start < event2End && event2Start < event1End;
}

export default events;
