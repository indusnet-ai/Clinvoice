
export const clearStorage = () => {
  // localStorage.remove
  localStorage.clear();
  var res = document.cookie;
  var multiple = res.split(";");
  for (var i = 0; i < multiple.length; i++) {
    var key = multiple[i].split("=");
    document.cookie = key[0] + " =; expires = Thu, 01 Jan 1970 00:00:00 UTC";
  }
};
/**
 * Promise returns response object.
 * @param {Object} response The response object from Fetch API.
 */

export const handleHeaders = (response: any) =>
  new Promise((resolve, reject) => {
    if (!response) {
      reject(new Error("No response returned from fetch."));
    }
    resolve(response);
  });
/**
 * Promise returns Errors checking the API Status else resolve ok.
 * @param {Object} response The response object from Fetch API.
 */
export const handleErrors = (response: any) =>
  new Promise((resolve, reject) => {
    if (!response) {
      reject(new Error("No response returned from fetch."));
      return;
    }
    if (response.ok || response.status === 204) {
      resolve(response);
      return;
    }
    if (response.status === 401) {
      clearStorage();
      if (window.location.pathname !== "/login") {
        window.location = "/login" as any;
      } else {
        reject({
          status: 401,
          message: "Invalid Login Credentials",
        });
      }
    }
    response
      .json()
      .then((json: any) => {
        switch (response.status) {
          case 422:
            return reject({
              status: response.status,
              message: json.error.msg,
            });

          case 400:
            if (Array.isArray(json.message)) {
              return reject({
                status: 400,
                message: Array.isArray(json.message[0].error)
                  ? json.message[0].error[0]
                  : json.message[0].error,
              });
            } else {
              return reject({
                status: 400,
                message: json.message,
              });
            }

          case 404:
            return reject({
              status: 404,
              message: json.message,
            });
          case 403:
            return reject({
              status: 404,
              message: json.message,
            });
          case 409:
            return reject({
              status: response.status,
              message: json.message || "",
            });
          case 503:
          case 500:
          case 501:
            return reject({
              status: response.status,
              message: "Internal Server Error.",
            });
          default:
            return reject({
              status: null,
              message: response.statusText,
            });
        }
      })
      .catch(() => {
        reject({
          status: 500,
          message: "Response not JSON",
        });
      });
  });
/**
 * Promise returns the JSON Body as a promise from the API response.
 * @param {Object} response The response object from Fetch API.
 */
export const getResponseBody = (response: any) => {
  const bodyIsEmpty = response.status === 204;
  if (bodyIsEmpty) {
    return Promise.resolve();
  }
  return response.json();
};
