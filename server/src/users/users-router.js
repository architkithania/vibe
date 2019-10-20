import express from 'express'
import bodyParser from 'body-parser'

const users = express.Router();

users.use(bodyParser.json());

var urlencodedParser = bodyParser.urlencoded({ extended: false });

/**
 * DEBUGGING ENDPOINT. USER SHOULD NOT ACCESS.
 * 
 * An endpoint to search for the user using the user's userId. Log's the user's id if it 
 * exists.
 */
users.get("/:userId", (req, res) => {
  const resData = {};

  db.collection("users")
    .doc(req.params.userId)
    .get()
    .then(doc => {
      if (!doc.exists) {
        console.log(`User with ID: ${req.params.userId} not found.`);
        res.status(404).send("No User Found");
      }

      const dataNeeded = JSON.parse(req.query.data);
      console.log(dataNeeded);
      const userData = doc.data();

      dataNeeded.forEach(val => {
        resData[val] = userData[val];
      });

      res.send(resData);
    })
    .catch(err => console.log(err));
});

/**
 * An endpoint to update the user's information with the provided `data`.
 */
users.post("/update", urlencodedParser, (req, res) => {
  const newData = req.body.profilePicture;
  console.log(newData);

  const setDoc = db
    .collection("users")
    .doc("testUser123")
    .set({ profilePicture: newData }, { merge: true });

  res.send("received");
});

export default users;
