'use strict';

const Express = require('express');
const compression = require('compression');
const bodyParser = require("body-parser");

const configuration = require('./configuration-loader');
const Error = require('./Error');
const Connection = require('./Connection');

/**
 * Load express server
 * 
 * @public
 * 
 * @function
 * 
 * @returns {undefined}
 */
function loadServer() {
    const app = new Express();

    app.use(bodyParser.json({ limit: configuration.request.maxPostParametersSize, extended: true }));
    app.use(Express.static(_buildPathStatics()));
    app.use(_interceptError);
    app.use(compression());

    app.set('view engine', 'ejs');
    app.set('views', _buildPathViews());

    app.get(configuration.server.paths.home, (req, res) => {
        res.render('home', {
            documentationPath: configuration.server.paths.documentation,
            testPath: configuration.server.paths.test
        });
    });

    app.get(configuration.server.paths.test, (req, res) => {
        res.render('test', {
            documentationPath: configuration.server.paths.documentation,
            connectionPath: configuration.server.paths.connection
        });
    });

    app.get(configuration.server.paths.documentation, (req, res) => {
        res.render('documentation', {
            connectionPath : configuration.server.paths.connection
        });
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

/**
 * @private
 * 
 * @function
 * 
 * @param {Error} err 
 * @param {Request} req 
 * @param {Resquest} res 
 * @param {function} next Callback to call when all things are success
 * 
 * @returns {undefined}
 */
function _interceptError(err, req, res, next) {
    if (err)
        Error.sendError(err, res);
    else
        next();
}

/**
 * @private
 * 
 * @function
 * 
 * @returns {string}
 */
function _buildPathViews() {
    const paths = __dirname.split(/[/\\]/);
    paths.pop();
    return `${paths.join('/')}/resources/pages`;
}


/**
 * @private
 * 
 * @function
 * 
 * @returns {string}
 */
function _buildPathStatics(){
    const paths = __dirname.split(/[/\\]/);
    paths.pop();
    return `${paths.join('/')}/resources/statics`;
}

module.exports = loadServer;