const puppeteer = require('puppeteer');

const configuration = require('../configuration-loader.js');
const UrlSkip = require('./url-skip.js');
const Page = require('./page.js');
const ResponseBuilder = require('./response-builder.js');

module.exports = class Browser {
    constructor(id) {
        this.pages = [];
        this.id = id;
        this._programClosing();
    }

    getId() {
        return this.id;
    }

    close() {
        if (this.browser != undefined)
            this.browser.close();
    }

    async loadPage(req) {
        if (this.pages.length >= configuration.browser.maxPages)
            throw new Error(`Max pages for this instance of browser is reached [${this.pages.length}]`);

        if (this.browser == undefined)
            this.browser = await puppeteer.launch({ headless: configuration.browser.headless, timeout: configuration.browser.timeout });

        const nativePage = await this.browser.newPage();
        const page = new Page(nativePage, req);
        this.pages.push(page);
        await page.launch();
        await page.close();
        this.pages.pop();

        return new ResponseBuilder(page, req).build();
    }

    _programClosing() {
        this.isToClose = false;

        setTimeout(() => {
            this.isToClose = true;
        }, configuration.browser.delayBeforeToClose)
    }
}