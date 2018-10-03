'use strict';

const Error = require('./Error.js');
const Browsers = require('./Browsers.js');
const browsers = new Browsers();

/**
 * Manage connection on headless browser
 * 
 * @class
 */
module.exports = class Connection {

    /**
     * GET connection type
     * 
     * @public
     * 
     * @returns {String}
     */
    static get GET() {
        return 'GET';
    }

    /**
     * POST connection type
     * 
     * @public
     * 
     * @returns {String}
     */
    static get POST() {
        return 'POST';
    }

    /**
     * Constructor needs request, response and method
     * 
     * @public
     * 
     * @constructor
     * 
     * @param {Request} req 
     * @param {Response} res 
     * @param {string} method 
     * 
     * @returns {Connection}
     */
    constructor(req, res, method) {
        this.req = req;
        this.res = res;
        this.method = method;
    }

    /**
     * Attempts to connect on headless browser
     * Sends response to client
     * 
     * @public
     * 
     * @returns {Promise<Response>}
     */
    async connect() {
        try {
            if (this.method != Connection.POST) {
                Error.sendError(Error.POST_ONLY_AUTHORIZED, this.res);
                return;
            }

            const browser = browsers.loadBrowser(this.req);

            browser.isAgainUsed = true;
            const response = await browser.loadPage(this.req);
            browser.isAgainUsed = false;

            this.res.set('content-type', 'application/json; charset=utf-8')
            this.res.send(JSON.stringify(response));
        } catch (exception) {
            Error.sendError(exception, this.res);
        }
    }
}
