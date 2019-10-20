import express from "express";
import bodyPareser from "body-parser";
import db from '../firebase/firestore'
import Joi from "joi";

const users = express.Router();

users.use(bodyPareser.json());

/**
 * An endpoint to load the user data of a given user. This endpoint requires a resquest body
 * that adheres to the schema provided below. 
 * 
 * Response Codes:
 * 200: User data loaded.
 * 400: Bad Request
 */
users.post("/load", (req, res) => {
  const schema = Joi.object().keys({
    id: Joi.string().required(),
    dataNeeded: Joi.array()
      .required()
      .unique()
      .items(Joi.string()),
    session: Joi.object()
      .keys({
        id: Joi.string().required(),
        token: Joi.string().required()
      })
      .required()
  });
  const BreakException = {};
  try {
    Joi.validate(req.body, schema, err => {
      if (err) {
        res.status(400).send(err.name + ": " + err.message);
        throw BreakException;
      }
    })

    const resObj = {};
    db.collection('users').doc(req.body.id).get().then(doc => {
      if (!doc.exists) {
        res.status(404).send('User not found');
        throw BreakException;
      }
      req.body.dataNeeded.forEach(need => {
        if (need === 'groups' || need === 'friends') {
          ;
        }
        else {
          resObj[need] = doc.data()[need]
        }
      });
      if (req.body.dataNeeded.includes('groups')) {
        resObj.groups = {};
        doc.ref.collection('groups').get().then(snapshot => {
          snapshot.forEach(subdoc => {
            resObj.groups[subdoc.id] = {};
            resObj.groups[subdoc.id].id = subdoc.data().id;
            resObj.groups[subdoc.id].name = subdoc.data().name;
            resObj.groups[subdoc.id].hasActiveEvents = subdoc.data().hasActiveEvents;
            resObj.groups[subdoc.id].events = subdoc.data().events;
          })
          res.status(200).send(resObj);
        })
      }
      else {
        res.status(200).send(resObj);
      }
    }).catch(err => {
      if (err !== BreakException) console.log(err);
    })
  }
  catch(err) {
    if (err !== BreakException) console.log(err);
  }
});

export default users;