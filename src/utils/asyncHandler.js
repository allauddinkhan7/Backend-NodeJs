const asyncHandler = (reqHandler) => {
  console.log("this is asyncHandler",reqHandler)
  return (req, res, next) => {
    Promise.resolve(reqHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

/*The asyncHandler utility wraps your controller function to handle asynchronous operations and ensure any errors are passed to the next middleware.
 This is a pattern to avoid using try/catch blocks manually in each controller. 
 
 next: The next function used to pass control to the next middleware.


 Promise.resolve(reqHandler(req, res, next)) is used to execute the asynchronous controller function.

Since controller function is an async function (it contains await), it will return a Promise.
Promise.resolve() ensures that the function can handle both synchronous and asynchronous



If any error occurs inside the controller function, asyncHandler will catch it and pass it to next(err).
This sends the error to the next middleware, which in this case would be an error-handling middleware that handles all errors centrally in your application.

 */
