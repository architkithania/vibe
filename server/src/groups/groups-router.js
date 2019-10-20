import express from "express";
import bodyParser from "body-parser";
import db from "../firebase/firestore";
import FirestoreDeletionServices from "../firebase/FirestoreDeletionServices";
import Joi from "joi";

const groups = express.Router();

groups.use(bodyParser.json());

/**
 * Endpoint to create a new hangout group. Internally, the endpoint creates a new document in the "groups" collection and
 * initializes the document with the request body provided. The request body must contain the following information:
 * - name: the name of the group.
 * - creator: an object containing information about the creator of the group.
 *   -> id: id of the group creator
 *   -> name: full name of the creator of the group
 * - tags: an array of tags describing the groups. Atleast 3 tags must be used.
 *
 * Response codes:
 * - 201: Group successfully created
 * - 400: One or more provided keys contains an error. Refer to the thrown error message for more information.
 */
groups.post("/create", (req, res) => {
  const BreakException = {};
  try {
    // An object defining the proporties of a correct request body.
    const schema = Joi.object().keys({
      name: Joi.string().required(),
      creator: Joi.object().keys({
        name: Joi.string().required(),
        id: Joi.string().required()
      }),
      tags: Joi.array()
        .required()
        .min(3)
        .unique()
        .items(Joi.string()),
      session: Joi.object().keys({
        id: Joi.string().required(),
        token: Joi.string().required()
      }).required()
    });
    // Validates the passed request body with the above specified schema, terminates and returns at the first encounted violation.
    Joi.validate(req.body, schema, err => {
      if (err) {
        res.status(400).send(err.name + ": " + err.message);
        throw BreakException;
      }
    });
    // The response object was successfully parsed...
    (async function() {
      try {
        const requiredParams = req.body;
        delete requiredParams.auth;
        const creatorMember = {
          id: requiredParams.creator.id,
          name: requiredParams.creator.name,
          isAdmin: true
        };
        requiredParams["hasActiveEvents"] = false;
        const groupDoc = await db.collection("groups").add(requiredParams);
        const docWrite1 = groupDoc
          .collection("members")
          .doc(creatorMember.id)
          .set(creatorMember);
        const docWrite2 = db
          .collection("users")
          .doc(creatorMember.id)
          .collection("groups")
          .doc(groupDoc.id)
          .set({
            id: groupDoc.id,
            name: req.body.name,
            hasActiveEvents: false
          });
        await Promise.all([docWrite1, docWrite2]);
        groupDoc.update({ id: groupDoc.id });
        res.status(201).send("Group created successfully");
      } catch (err) {
        if (err !== BreakException) console.log(1, err.name);
      }
    })().catch(err => console.log(2, err));
  } catch (err) {
    if (err !== BreakException) console.log(err);
  }
});

/**
 * An endpoint to enlist a user in a pre-existing group. The endpoint enlists the user as a member in the group doc's "members"
 * subcollection. Also enlists the group in the user doc's "groups" subcollection. The request body must contain the following keys:
 * - userId: the userId of the joining user.
 * - groupId: the groupId of the group wanting to join.
 *
 * Response codes:
 * 200: User successfully joined group.
 * 400: userId or groupId already provided OR userId or groupId not found.
 */
groups.post("/join", (req, res) => {
  const BreakException = {};
  try {
    // An object defining the proporties of a correct request body.
    const schema = Joi.object().keys({
      userId: Joi.string().required(),
      groupId: Joi.string().required(),
      session: Joi.object().keys({
        id: Joi.string().required(),
        token: Joi.string().required()
      }).required()
    });
    // Validates the passed request body with the above specified schema, terminates and returns at the first encounted violation.
    Joi.validate(req.body, schema, err => {
      if (err) {
        res.status(400).send(err.name + ": " + err.message);
        throw BreakException;
      }
    });
    const userDocRef = db.collection("users").doc(req.body.userId);
    const groupDocRef = db.collection("groups").doc(req.body.groupId);
    db.runTransaction(t => {
      return t.getAll(userDocRef, groupDocRef).then(snapshot => {
        // Snapshot[0] refers to userDocRef, Snapshot[1] refers to groupDocRef
        let notExists = 0;
        if (!snapshot[0].exists && !snapshot[1].exists) notExists = 2;
        else if (!snapshot[0].exists) notExists = -1;
        else if (!snapshot[1].exists) notExists = 1;

        switch (notExists) {
          case 2:
            res.status(404).send("user and group don't exist");
            break;
          case -1:
            res.status(404).send("user does not exist");
            break;
          case 1:
            res.status(404).send("group does not exist");
            break;
        }
        if (notExists != 0) throw BreakException;

        const { firstName, lastName } = snapshot[0].data();
        const { name, hasActiveEvents } = snapshot[1].data();
        // Prepares the docRefs to be bulk written at a later point.
        const userGroupsDocRef = db
          .collection("users")
          .doc(req.body.userId)
          .collection("groups")
          .doc(req.body.groupId);
        const groupMemberDocRef = db
          .collection("groups")
          .doc(req.body.groupId)
          .collection("members")
          .doc(req.body.userId);
        // New information that must be added to the group doc.
        const newMemberInfo = {
          name: `${firstName} ${lastName}`,
          id: req.body.userId,
          isAdmin: false
        };
        // New information that must be added to the user doc.
        const newGroupInfo = {
          id: req.body.groupId,
          name: name,
          hasActiveEvents: hasActiveEvents
        };
        /**
         * Write to the files, fails if the user is already in the group. SHOULD NOT be used as a way to check user membership.
         * Refer to the "users" endpoint for more information on membership detection.
         */
        try {
          t.create(userGroupsDocRef, newGroupInfo);
          t.create(groupMemberDocRef, newMemberInfo);
        } catch {
          res.status(400).send("User is already in group");
          throw BreakException;
        }
      });
    });
    res.status(200).send("User successfully joined group");
  } catch (err) {
    if (err !== BreakException) console.log(err);
  }
});

/**
 * An endpoint to deep-delete a group. Since the deletion of a group DOES NOT delete its subcollections, the subcollections
 * are deleted recurssivly. This endpoint also updates the user docs of all its members. A user must have admin privelages to
 * delete a group. The following keys are required in the request body:
 * - groupId: the groupId of the group wanting to be deleted.
 * - userId: the user id of the user performing the delete action. The user must be am admin of the group.
 *
 * NOTE: This is a time consuming procedure and therefore should be called with caution.
 *
 * Response Codes:
 * 200: Group has been deleted.
 * 400: userId or groupId not provided
 * 403: user is not authorized to perform a delete procedure.
 * 404: invalid userId or groupId provided.
 */
groups.post("/delete", (req, res) => {
  const BreakException = {};
  try {
    // An object defining the proporties of a correct request body.
    const schema = Joi.object().keys({
      userId: Joi.string().required(),
      groupId: Joi.string().required()
    });
    // Validates the passed request body with the above specified schema, terminates and returns at the first encounted violation.
    Joi.validate(req.body, schema, err => {
      if (err) {
        res.status(400).send(err.name + ": " + err.message);
        throw BreakException;
      }
    });

    // DocRef to the specific group doc.
    const groupDocRef = db.collection("groups").doc(req.body.groupId);
    groupDocRef.get().then(doc => {
      // Group not found exception
      if (!doc.exists) {
        res.status(404).send("Group not found");
        throw BreakException;
      }
      // Check if user has admin access.
      doc.ref
        .collection("members")
        .doc(req.body.userId)
        .get()
        .then(userDoc => {
          try {
            if (!userDoc.exists) {
              res.status(404).send("User is not in group");
              throw BreakException;
            } else if (userDoc.data().isAdmin) {
              // Create an array of all the members of a group to update their respective user doc.
              const userIds = [];
              doc.ref
                .collection("members")
                .get()
                .then(snapshot => {
                  snapshot.forEach(uidDoc => userIds.push(uidDoc.data().id));
                })
                .then(_ => {
                  userIds.forEach(uId => {
                    db.collection("users")
                      .doc(uId)
                      .collection("groups")
                      .doc(req.body.groupId)
                      .delete();
                  });
                });
              // Creates a new DeletionService Object and performs a deep-delete.
              const service = new FirestoreDeletionServices();
              service
                .deepDeleteDoc(db, `groups/${req.body.groupId}`, 10)
                .then(_ => {
                  userIds.forEach(uid =>
                    db
                      .collection("users")
                      .doc(uid)
                      .collection("groups")
                      .doc(req.body.groupId)
                      .delete()
                  );
                })
                .then(_ => res.status(200).send("Group has been deleted"));
            } else {
              res.status(403).send("User is not authorized to delete group");
            }
          } catch (err) {
            if (err !== BreakException) console.log(err);
          }
        });
    });
  } catch (err) {
    if (err !== BreakException) console.log(err);
  }
});

/**
 * An endpoint to update the low-level contents of the current group doc. This endpoint takes the following keys:
 * - id: groupId of the group needing update.
 * - changes: an object that oulines the changes needed to be performed.
 *   -> name: a new name for the group
 *   -> tags: an object allowing the tags be changed. It is the callers responsibilty to maintain atleast 3 tags.
 *      -> addTags: [] of tags wanting to be added.
 *      -> deleteTags: [] of tags wanting to be deleted.
 *
 * NOTE: This function must update the user's doc for each member and is therefore an expensive procedure. Call with care.
 *
 * Response Codes:
 * 200: Successfully updated
 * 400: groupId or a changes object with keys <= 1 not provided.
 * 403: trying to change an unauthorized property.
 */
groups.post("/update", (req, res) => {
  const BreakException = {};
  try {
    const schema = Joi.object().keys({
      id: Joi.string().required(),
      changes: Joi.object()
        .keys({
          name: Joi.string(),
          tags: Joi.object()
            .keys({
              addTags: Joi.array()
                .min(1)
                .items(Joi.string()),
              deleteTags: Joi.array()
                .min(1)
                .items(Joi.string())
            })
            .or("addTags", "deleteTags")
        })
        .or("name", "tags")
        .required()
    });
    Joi.validate(req.body, schema, err => {
      if (err) {
        res.status(400).send(err.name + ": " + err.message);
        throw BreakException;
      }
    });

    const groupDocRef = db.collection("groups").doc(req.body.id);
    // Start of a bulk read-write operation
    db.runTransaction(t => {
      return t.get(groupDocRef).then(doc => {
        if (!doc.exists) {
          res.status(404).send("Group not found");
          throw BreakException;
        }
        // Create a set of tags to neglect duplicate tags.
        const tags = new Set(doc.data().tags);
        let tagsToDelete = undefined;
        if (
          req.body.changes.tags !== undefined &&
          req.body.changes.tags.deleteTags !== undefined
        )
          tagsToDelete = req.body.changes.tags.deleteTags;
        const newName = req.body.changes.name;
        if (newName !== undefined) {
          const userIds = [];
          doc.ref
            .collection("members")
            .get()
            .then(snapshot => {
              snapshot.forEach(memDoc => {
                userIds.push(memDoc.data().id);
              });
            })
            .then(_ => {
              userIds.forEach(uId => {
                db.collection("users")
                  .doc(uId)
                  .collection("groups")
                  .doc(req.body.id)
                  .update({ name: newName });
              });
            });
        }
        if (tagsToDelete !== undefined && tagsToDelete.length != 0) {
          for (const tag of tags) {
            // Break if there are only 3 tags left. Ensures there will always be atleast 3 tags associated.
            if (tags.size == 3) break;
            tags.delete(tag);
          }
        }
        if (
          req.body.changes.tags !== undefined &&
          req.body.changes.tags.addTags !== undefined
        ) {
          req.body.changes.tags.addTags.forEach(tag => tags.add(tag));
        }
        // Spreads the tags set into an array.
        const arrTags = [...tags.values()];
        // update groupDoc.
        if (newName !== undefined)
          groupDocRef.update({ name: newName, tags: arrTags });
        else groupDocRef.update({ tags: arrTags });
      });
    }).then(_ => res.status(200).send("The information has been updated"));
  } catch (err) {
    if (err !== BreakException) console.log(err);
  }
});

/**
 * An endpoint that returns a JSON object as a response of a database query using the required query search string, queryString.
 * Optional Parameters:
 * - count: number of successive calls inorder to configure offset. (starts from 0)
 * - max: max number of results to output, defaults to 15 if a number greater than 15 or undefined is provided.
 *
 * NOTE: the same "max" parameters must be provided if offset calls are being made.
 */
groups.get("/search/:queryString", (req, res) => {
  const resArr = [];
  const limitRes =
    req.query.max == undefined || parseInt(req.query.max) >= 15
      ? 15
      : parseInt(req.query.max);
  const count = req.query.max == undefined ? 0 : parseInt(req.query.count);
  db.collection("groups")
    .where("name", ">=", req.params.queryString)
    .limit(limitRes)
    .offset(limitRes * count)
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => resArr.push({id: doc.data().id, name: doc.data().name, creator: doc.data().creator.name }));
    })
    .then(_ => res.status(200).json(resArr));
});

/**
 * An endpoint to load a group document information as dictated by the required changes array query.
 * Parameters:
 * - groupId: the groupId of the group being loaded.
 *
 * Queries:
 * - data: [] of data that needs to be loaded.
 *
 * Response Code:
 * 200: Successful data return
 * 400: Missing 'data' array
 * 404: Group not found
 */
groups.get("/load/:groupId", (req, res) => {
  if (req.query.data == undefined || req.query.data.length == 0) {
    res.status(400).send("Missing required 'data' array or 'data' array empty");
  } else {
    const keys = JSON.parse(req.query.data);
    const resObj = {};
    db.collection("groups")
      .doc(req.params.groupId)
      .get()
      .then(doc => {
        if (!doc.exists) {
          res.status(404).send("Group not found");
        } else {
          new Promise((resolve, reject) => {
            try {
              keys.forEach(async key => {
                if (key !== "members" && key !== "events") {
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

export default groups;
