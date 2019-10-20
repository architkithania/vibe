import express from "express";
import bodyParser from "body-parser";
import db from "../firebase/firestore";
import Joi from "joi";
import bcrypt from "bcrypt";
import randToken from "rand-token";

// Initial setup of an express router
const authuser = express.Router();
// Middleware to parse post requests into JSON objects
authuser.use(bodyParser.json());

/**
 * Singleton endpoint for new user signups. Creates a new document for a newly signed up user.
 * The request must pass in the following information:
 * - userId
 * - firstName
 * - lastName
 * - email
 * Response Codes:
 * - 400: Missing one of the request parameters
 * - 409: User Conflict
 * - 201: user doc created
 */
authuser.post("/signup", (req, res) => {
  const BreakException = {};
  const schema = Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string()
      .email()
      .required(),
    userName: Joi.string().required(),
    password: Joi.string().required()
  });

  // Checks if none of the needed elements are null. Sends an error 400 if one is.
  Joi.validate(req.body, schema, err => {
    if (err) {
      res.status(400).send(err.name + ": " + err.message);
      throw BreakException;
    }
  });
  const { firstName, lastName, email, userName, password } = req.body;

  db.collection("passwords")
    .where("userName", "==", userName)
    .get()
    .then(snapshot => {
      if (snapshot.size != 0) {
        res.status(409).send("User name already in use");
        throw BreakException;
      }
    })
    .then(_ => {
      bcrypt
        .hash(password, 10)
        .then(hash => {
          const userPasswordFile = {
            userName: userName,
            password: hash
          };

          db.collection("passwords")
            .add(userPasswordFile)
            .then(docRef => {
              const userConfig = {
                firstName: firstName,
                lastName: lastName,
                email: email,
                userId: docRef.id,
                userName: userName,
                profilePicture: null,
                isCalLinked: false
              };

              db.collection("users")
                .doc(userConfig.userId)
                .set(userConfig)
                .then(_ => res.status(201).send("User info added to database"))
                .catch(err => {
                  if (err !== BreakException) {
                    console.log(err);
                  }
                });
            });
        })
        .catch(err => {
          if (err !== BreakException) console.log(BreakException);
        });
    })
    .catch(err => {
      if (err !== BreakException) console.log(err);
    });
});

authuser.post("/login", (req, res) => {
  const BreakException = {};
  const schema = Joi.object().keys({
    userName: Joi.string().required(),
    password: Joi.string().required()
  });

  try {
    Joi.validate(req.body, schema, err => {
      if (err !== null) {
        res.status(400).send(err.name + ": " + err.message);
        throw BreakException;
      }
    });

    db.collection("passwords")
      .where("userName", "==", req.body.userName)
      .get()
      .then(snapshot => {
        if (snapshot.size == 0) {
          res.status(404).send("User not found");
          throw BreakException;
        }
        snapshot.forEach(async doc => {
          const hash = await doc.data().password;
          const result = await bcrypt.compare(req.body.password, hash);
          if (result) {
            let token;
            do {
              token = randToken.generate(16);
            } while (RunTimeUsers.has(token));
            RunTimeUsers.set(token, doc.id);
            db.collection('users').doc(doc.id).get().then(userDoc => {
              const resObj = {
                session: {
                  id: userDoc.id,
                  token: token
                },
                firstName: userDoc.data().firstName,
                lastName: userDoc.data().lastName,
                email: doc.data().email,
                id: userDoc.id
              }
              res.status(200).send(resObj);
            });
          } else res.status(403).send("Credentials are invalid");
        });
      })
      .catch(err => {
        if (err !== BreakException) console.log(err);
      });
  } catch (err) {
    if (err !== BreakException) console.log(err);
  }
});

authuser.post("/logout", (req, res) => {
  RunTimeUsers.delete(req.body.auth.token);
  res.status(200).send("Successfully Logged Out");
});

export default authuser;
