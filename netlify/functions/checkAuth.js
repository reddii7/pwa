// netlify/functions/checkAuth.js

exports.handler = async (event, context) => {
    // Get the password from the request body
    const { password } = JSON.parse(event.body);

    // Check if the provided password matches the one in our environment variables
    if (password === process.env.ADMIN_PASSWORD) {
        // If it matches, send back a success message
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Authentication successful' }),
        };
    } else {
        // If it doesn't match, send back an unauthorized error
        return {
            statusCode: 401,
            body: JSON.stringify({ message: 'Invalid password' }),
        };
    }
};