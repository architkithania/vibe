import * as admin from "firebase-admin";

export default class FirestoreDeletionServices {

  /**
   * Recursivly deletes a document and all its underlying collections. deletes
   * `batchSize` documents at a time as to not overflow memory.
   * 
   * @param {FireStoreRef} db 
   * @param {string} docPath 
   * @param {int} batchSize 
   */
  deepDeleteDoc(db, docPath, batchSize) {
    const doc = db.doc(docPath);
    return doc.get().then(snap => {
      if (snap.exists) {
        // Check if this doc has subcollections
        return snap.ref
          .getCollections()
          .then(subCollections => {
            const promises = [];
            if (subCollections) {
              for (const subCollection of subCollections) {
                const subQuery = subCollection
                  .orderBy("__name__")
                  .limit(batchSize);
                const subPromise = new Promise((res, rej) => {
                  // Delete all sub collection docs
                  this.deleteQueryBatch(db, subQuery, batchSize, res, rej);
                });
                promises.push(subPromise);
              }
            }

            return Promise.all(promises);
          })
          .then(() => {
            // And delete the document only if all subcollections deleted succesfully
            return doc.delete();
          });
      }
    });
  }

  /**
   * Deep deletes a collection and all of its underlying documents.
   * 
   * @param {FirebaseRef} db 
   * @param {string} collectionPath 
   * @param {int} batchSize 
   */
  deepDeleteCollection(db, collectionPath, batchSize) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy("__name__").limit(batchSize);

    return new Promise((resolve, reject) => {
      this.deleteQueryBatch(db, query, batchSize, resolve, reject);
    });
  }

  deleteQueryBatch(db, query, batchSize, resolve, reject) {
    query
      .get()
      .then(snapshot => {
        // When there are no documents left, we are done
        if (snapshot.size === 0) {
          return 0;
        }

        // Delete documents in a batch
        const batch = db.batch();
        const subCollectionPromises = [];

        for (const doc of snapshot.docs) {
          // Check if this doc has subcollections
          const subCollectionPromise = doc.ref
            .getCollections()
            .then(subCollections => {
              const promises = [];

              if (subCollections) {
                for (const subCollection of subCollections) {
                  const subQuery = subCollection
                    .orderBy("__name__")
                    .limit(batchSize);
                  const subPromise = new Promise((res, rej) => {
                    // Delete all sub collection docs
                    this.deleteQueryBatch(db, subQuery, batchSize, res, rej);
                  });
                  promises.push(subPromise);
                }
              }

              return Promise.all(promises);
            })
            .then(() => {
              // And delete the document only if all subcollections deleted succesfully
              batch.delete(doc.ref);
            });

          subCollectionPromises.push(subCollectionPromise);
        }

        return Promise.all(subCollectionPromises).then(() => {
          return batch.commit().then(() => {
            return snapshot.size;
          });
        });
      })
      .then(numDeleted => {
        if (numDeleted === 0) {
          resolve();
          return;
        }

        // Recurse on the next process tick, to avoid
        // exploding the stack.
        process.nextTick(() => {
          this.deleteQueryBatch(db, query, batchSize, resolve, reject);
        });
      })
      .catch(reject);
  }
}
