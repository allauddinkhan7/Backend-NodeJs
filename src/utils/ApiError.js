class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        // Call the parent Error constructor with the message
        super(message);

        this.statusCode = statusCode;
        this.errors = errors;   
        this.data = null;
        this.success = false;

        // If a custom stack trace is provided, set it
        if (stack) {
            this.stack = stack;
        } else {
            // Default to the error's stack trace
           Error.captureStackTrace(this, this.constructor)
        }
    }
}
