const urlFromRequire = require('url');

const configuration = require('../configuration-loader.js');
const Browser = require('./browser.js');

module.exports = class Browsers {

    constructor() {
        this.browsers = new Map();
    }

    loadBrowser(req) {
        this._closeBrowserToClose();
        
        const idBrowser = this._buildIdBrowser(req);
        const browser = this.browsers.get(idBrowser);

        return browser == undefined ?
            this._createBrowser(idBrowser) :
            browser;
    }

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

        return hostname;
    }

    _createBrowser(idBrowser) {
        if (this.browsers.size >= configuration.browser.maxInstances)
            throw new Error(`Max instances browsers [${this.browsers.size}] reached.`);

        const browser = new Browser(idBrowser);
        this.browsers.set(idBrowser, browser);
        return browser;
    }

    _closeBrowserToClose() {
        const ids = [];

        this.browsers.forEach((browser, id) => {
            if (browser.isToClose && !browser.isAgainUsed) {
                browser.close();
                ids.push(id);
            }
        });

        ids.forEach(id => this.browsers.delete(id));
    }
}