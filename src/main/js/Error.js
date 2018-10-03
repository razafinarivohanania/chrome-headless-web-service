'use trict';

/**
 * Send any error occured to client
 * 
 * @type {Object}
 */
const Error = {

    /**
     * Constant saying that POST method only is authorized
     * 
     * @public
     * 
     * @constant
     * 
     * @type {string}
     */
    POST_ONLY_AUTHORIZED: 'POST method only authorized',

    /**
     * Convert any error occured to JSON
     * Set status to 400 or 500 depending context
     * 
     * @public
     * 
     * @returns {undefined}
     */
    sendError: (err, res) => {
        err = '' + err;

        if (err.includes('SyntaxError'))
            res.status(400);
        else 
            res.status(500);

        res.set('content-type', 'application/json');
        res.send(JSON.stringify({
            error: '' + err
        }));
    }
}

module.exports = Error;