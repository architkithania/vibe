import "whatwg-fetch";

/**
 * A simple class to make get and post requests easily without the clutter of header files.
 * Methods return a promise and need to be awaited or be joined with '.then'
 * Methods are static so can be called directly using the class name. (Does not require an instance)
 */
class Requests {
  
  /**
   * Performs a simple GET request. Returns a Promise.
   * @param {string} url the address of the query url.
   * @param {boolean} needBody whether the content of the response is needed. If false, only 
   * status of the response is returned. Setting false saves time required for parsing a JSON 
   * or text. True by default.
   */
  static async get(url, needBody = true) {
    let response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      });
    } catch (err) {
      throw err;
    }
    const resClone = response.clone();
    if (response !== null) {
      const resObj = {
        status: response.status
      };
      if (!needBody) return resObj;
      try {
        resObj.body = await response.json();
      } catch {
        resObj.body = await resClone.text();
      }
      return resObj;
    }
  }

  /**
   * Performs a simple POST request. Returns a Promise
   * @param {string} url the address of the query url.
   * @param {Object} options the body of the request.
   * @param {boolean} needBody whether the content of the response is needed. If false, only 
   * status of the response is returned. Setting false saves time required for parsing a JSON 
   * or text. True by default.
   */
  static async post(url, options = {}, needBody = true) {
    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(options)
      });
    } catch (err) {
      throw err;
    }

    const resObj = {
      status: response.status
    };
    if (!needBody) return resObj;
    const resClone = response.clone();
    try {
      resObj.body = await response.json();
    } catch {
      resObj.body = await resClone.text();
    }
    return resObj;
  }

}

export default Requests;
