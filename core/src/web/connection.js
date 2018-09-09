'use strict';

const Error = require('./error.js');
const Browsers = require('./browsers.js');
const browsers = new Browsers();

module.exports = class Connection {
    static get GET() {
        return 'GET';
    }

    static get POST() {
        return 'POST';
    }

    constructor(req, res, method) {
        this.req = req;
        this.res = res;
        this.method = method;
    }

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
