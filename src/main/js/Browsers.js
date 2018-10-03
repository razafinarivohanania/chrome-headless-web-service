'use strict';

const urlFromRequire = require('url');

const configuration = require('./configuration-loader');
const Browser = require('./Browser');
const Args = require('./Args');

/**
 * Manage all instances of browsers
 * 
 * @class
 */
module.exports = class Browsers {

    /**
     * Constructor does not need parameter
     * 
     * @public
     * 
     * @constructor
     * 
     * @returns {Browsers}
     */
    constructor() {
        this.browsers = new Map();
    }

    /**
     * Load browser which responds the same args from request parameters
     * Otherwise attempts to create new instance of browser
     * 
     * @public
     * 
     * @param {Request} req
     * 
     * @returns {Browser}
     */
    loadBrowser(req) {
        this._closeBrowserToClose();
        
        const idBrowser = this._buildIdBrowser(req);
        const browser = this.browsers.get(idBrowser);

        return browser == undefined ?
            this._createBrowser(idBrowser) :
            browser;
    }

    /**
     * @private
     * 
     * @param {Request} req 
     * 
     * @returns {string}
     */
    _buildIdBrowser(req) {
        let url = null;
        try {
            url = req.body.request.url;
        } catch (exception) {
            throw new Error('request.url on JSON parameters is not found');
        }

        if (url == null || url == '')
            throw new Error('request.url on JSON parameters is empty');

        const hostname = urlFromRequire.parse(url).hostname;
        if (hostname == null)
            throw new Error('request.url on JSON parameters is malformed');

        const args = new Args(req).getArgs();
        args.sort();
        return hostname + args.join('-');
    }

    /**
     * @private
     * 
     * @param {string} idBrowser 
     * 
     * @returns {Browser}
     */
    _createBrowser(idBrowser) {
        if (this.browsers.size >= configuration.browser.maxInstances)
            throw new Error(`Max instances browsers [${this.browsers.size}] reached.`);

        const browser = new Browser(idBrowser);
        this.browsers.set(idBrowser, browser);
        return browser;
    }

    /**
     * @private
     * 
     * @returns {undefined}
     */
    _closeBrowserToClose() {
        const ids = [];

        this.browsers.forEach((browser, id) => {
            if (browser.isToClose && browser.pagesCounter == 0) {
                browser.close();
                ids.push(id);
            }
        });

        ids.forEach(id => this.browsers.delete(id));
    }
}