const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // Check if error has a status code
    const statusCode = err.statusCode || 500;
    
    // Prepare error response
    const errorResponse = {
        error: {
            message: err.message || 'Internal Server Error',
            status: statusCode
        }
    };

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.error.stack = err.stack;
    }

    res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
