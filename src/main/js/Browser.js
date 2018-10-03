'use strict';

const puppeteer = require('puppeteer');

const configuration = require('./configuration-loader');
const Page = require('./Page');
const ResponseBuilder = require('./ResponseBuilder');
const Args = require('./Args');

/**
 * Manage one instance of browser
 * 
 * @class
 */
module.exports = class Browser {
    
    /**
     * Constructor needs id
     * 
     * @public
     * 
     * @param {String} id 
     * 
     * @return {Browser}
     */
    constructor(id) {
        this.pagesCounter = 0;
        this.id = id;
        this._programClosing();
    }

    /**
     * Get id of browser
     * 
     * @public
     * 
     * @return {String}
     */
    getId() {
        return this.id;
    }

    /**
     * Close native instance of browser
     * 
     * @public
     * 
     * @return {undefined}
     */
    close() {
        if (this.browser != undefined)
            this.browser.close();
    }

    /**
     * Attempt to open new page (or tab) on the current instance of browser with request context
     * It returns the content of page
     * 
     * @public
     * 
     * @param {Request} req 
     * 
     * @returns {Promise<ResponseBuilder>}
     */
    async loadPage(req) {
        if (this.pagesCounter >= configuration.browser.maxPages)
            throw new Error(`Max pages for this instance of browser is reached [${this.pagesCounter}]`);

        const browserParameters = { headless: configuration.browser.headless, timeout: configuration.browser.timeout };
        const args = new Args(req).getArgs();
        if (args.length > 0)
            browserParameters.args = args;

        if (this.browser == undefined)
            this.browser = await puppeteer.launch(browserParameters);

        const nativePage = await this.browser.newPage();
        this.pagesCounter++;
        const page = new Page(nativePage, req);
        await page.launch();
        await page.close();
        this.pagesCounter--;

        return new ResponseBuilder(page, req).build();
    }

    /**
     * @private
     * 
     * @return {undefined}
     */
    _programClosing() {
        this.isToClose = false;

        setTimeout(() => {
            this.isToClose = true;
        }, configuration.browser.delayBeforeToClose)
    }
}