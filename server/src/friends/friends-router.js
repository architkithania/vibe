import express from "express";
import bodyPareser from "body-parser";
import Joi from "joi";
import db from "../firebase/firestore";

const friends = express.Router();

friends.use(bodyPareser.json());

/**
 * An endpoint to send a friend request from one account to another.
 * 
 * Response Codes:
 * 201: Request Added
 * 400: Bad Request
 * 403: User Doc Forbidden
 * 404: User not found
 */
friends.post("/sendrequest", (req, res) => {
  const BreakException = {};
  const schema = Joi.object().keys({
    id: Joi.string().required(),
    friendId: Joi.string().required(),
    friendName: Joi.string().required()
  });

  try {
    Joi.validate(req.body, schema, err => {
      if (err) {
        res.status(400).send(err.name + ": " + err.message);
        throw BreakException;
      }
    });

    db.collection('users').doc(req.body.id).get().then(doc => {
      if (!doc.exists) {
        res.status(403).send("Doc not found");
      }
      else {
        db.collection('users').doc(req.body.friendId).get().then(friendDoc => {
          if (!friendDoc.exists) {
            res.status(403).status("Doc not found");
          }
          else {
            (async function() {
              const write1 = doc.ref.collection('friends').doc(req.body.friendId).set({
                accepted: false,
                id: req.body.friendId,
                name: req.body.friendName
              });
              const idPtr = `pendingRequests.${req.body.id}`;
              const options = {};
              options[idPtr] = true;
              const write2 = friendDoc.ref.update(options);
              Promise.all([write1, write2]);
              res.status(201).send("Created");
            })();
          }
        });
      }
    });
  }
  catch (err) {
    if (err !== BreakException) console.log(err);
  }
});

export default friends;
