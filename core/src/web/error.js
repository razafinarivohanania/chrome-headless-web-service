'use trict';

const Error = {
    POST_ONLY_AUTHORIZED: 'POST method only authorized',
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