'use strict';

const Express = require('express');
const compression = require('compression');
const bodyParser = require("body-parser");

const configuration = require('../configuration-loader.js');
const Error = require('./error.js');
const Connection = require('./connection.js');

function interceptError(err, req, res, next) {
    if (err)
        sendError(err, res);
    else
        next();
}

function loadServer() {
    const app = new Express();

    app.use(bodyParser.json());

    app.use(interceptError);

    app.use(compression());

    app.get(configuration.server.paths.home, (req, res) => {
        res.send(`<!DOCTYPE html>
            <html>
                <head>
                    <title>Test</title>
                    <meta charset='utf-8'/>
                </head>
                <body>
                    <div id='welcome'>
                        Welcome!
                    </div>
                </body>
                <script>
                    document.querySelector('#welcome').innerHTML = 'Hello world';
                </script>
            </html>`);
    });

    app.get(configuration.server.paths.test, (req, res) => {
        res.send(`<!DOCTYPE html>
            <html>
                <head>
                    <title>Test</title>
                    <meta charset='utf-8'/>
                </head>
                <body>
                    <div id='welcome'>
                        Welcome!
                    </div>
                    <div>
                        <a href='/'>Home</a>
                        <a href='/documentation'>Documentation</a>
                    </div>
                </body>
                <script>
                    document.querySelector('#welcome').innerHTML = 'Hello world';
                </script>
            </html>`);
    });

    app.post(configuration.server.paths.home, (req, res) => {
        res.send('' + JSON.stringify(req.headers));
    });

    app.get(configuration.server.paths.documentation, (req, res) => {
        res.send('Documentation');
    })

    app.get(configuration.server.paths.connection, async (req, res) => {
        const connection = new Connection(req, res, Connection.GET)
        await connection.connect();
    })

    app.post(configuration.server.paths.connection, async (req, res) => {
        const connection = new Connection(req, res, Connection.POST)
        await connection.connect();
    })

    app.listen(configuration.server.port, () => {
        console.log(`Server runs on port ${configuration.server.port}`);
    });
}

module.exports = loadServer;