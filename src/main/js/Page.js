'use strict';

const urlFromRequire = require('url');

const cookieFromRequire = require('cookie');
const UrlSkip = require('./url/UrlSkip');
const UrlAllow = require('./url/UrlAllow');
const configuration = require('./configuration-loader');
const HtmlLocalFile = require('./HtmlLocalFile');

/**
 * Manage native Chromium page
 * 
 * @class
 */
module.exports = class Page {

    /**
     * Constructor needs native page from puppeter and request
     * 
     * @param {Page} page Native page from puppeter not this instance
     * @param {Request} req 
     * 
     * @returns {Page} This instance
     */
    constructor(page, req) {
        this.page = page;
        this.req = req;
        this.headers = this._extractHeaders();
        this.userAgent = this._extractUserAgent();
        this.method = this._extractMethod();
        this.cookies = this._extractCookies();
        this.postParameters = this._extractPostParameters();
    }

    /**
     * Get script loaded natively by Chromium
     * 
     * @public
     * 
     * @returns {any} Depends on script loaded
     */
    getResponseScript() {
        return this.responseScript == undefined ?
            null :
            this.responseScript;
    }

    /**
     * Get content response from website server
     * 
     * @public
     * 
     * @return {string}
     */
    getNotRenderedResponse() {
        return this.page.currentInstance.notRenderedResponse;
    }

    /**
     * Get final rendered html when all script loaded and ajax request is done
     * 
     * @public
     * 
     * @return {string}
     */
    getRenderedResponse() {
        return this.renderedResponse;
    }

    /**
     * Get native request headers
     * 
     * @public
     * 
     * @returns {Object}
     */
    getRequestHeaders() {
        return this.page.currentInstance.requestHeaders;
    }

    /**
     * Get list of urls connected by Chromium on the current page
     * 
     * @public
     * 
     * @returns {Array}
     */
    getUrlsConnected() {
        return this.page.currentInstance.urls.connected;
    }

    /**
     * Get list of urls skipped by Chromium on the current page
     * 
     * @public
     * 
     * @return {Array}
     */
    getUrlsSkipped() {
        return this.page.currentInstance.urls.skipped;
    }

    /**
     * Attempts to close native page
     * 
     * @public
     * 
     * @returns {Promise<undefined>}
     */
    async close() {
        try {
            await this.page.close();
        } catch (pageException) {
        }
    }

    /**
     * Open native page (or tab)
     * Retrieve data
     * Close it at the end
     * 
     * @public
     * 
     * @returns {Promise<undefined>}
     */
    async launch() {
        try {
            await this.page.setRequestInterception(true);

            if (this.userAgent != null && this.userAgent != '')
                await this.page.setUserAgent(this.userAgent);

            if (this.cookies != null && this.cookies.length > 0)
                await this.page.setCookie(...this.cookies);

            this.page.currentInstance = {
                req: this.req,
                headers: this.headers,
                method: this.method,
                postParameters: this.postParameters,
                _alterHeaders: this._alterHeaders,
                notRenderedPageAlreadyGot: false,
                configuration: configuration,
                _isMaxConnectionReached: this._isMaxConnectionReached,
                urls: {
                    connected: [],
                    skipped: []
                }
            };

            this.page.on('request', this._interceptRequest);

            this.page.on('response', this._interceptNotRenderedResponse);

            await this._goto();

            await this.page.waitFor(1000);
            await this._loadScript();

            const cookies = await this.page.cookies();
            const content = await this.page.content();

            this.renderedResponse = {
                cookie: cookies,
                content: content
            }

            if (this.page.currentInstance.exception != undefined)
                throw new Error(this.page.currentInstance.exception);
        } catch (exception) {
            await this.close();

            console.log(exception);
            throw exception;
        }
    }

    /**
     * @private
     * 
     * @param {Response} response 
     */
    _interceptNotRenderedResponse(response) {
        if (response.status() == 301 ||
            response.status() == 302 ||
            this.currentInstance.notRenderedPageAlreadyGot)
            return;

        this.currentInstance.notRenderedPageAlreadyGot = true;

        response.text().then(responseText => {
            this.currentInstance.notRenderedResponse = {
                status: response.status(),
                content: responseText,
                headers: response.headers()
            };
        });
    }

    /**
     * @private
     * 
     * @param {Response} response 
     */
    _extractMethod() {
        let method = null;
        try {
            method = this.req.body.request.method;
        } catch (exception) {
            throw new Error('request.method on JSON parameter is not found');
        }

        if (method == null || method == '')
            throw new Error('request.method on JSON parameter is empty');

        method = method.toLowerCase().trim();
        if (method != 'get' && method != 'post')
            throw new Error(`request.method on JSON parameter is not supported [${method}]`);

        return method;
    }

    /**
     * @private
     * 
     * @param {Request} request 
     * 
     * @return {undefined}
     */
    _interceptRequest(request) {
        try {
            if (this.currentInstance._isMaxConnectionReached(this.currentInstance) ||
                new UrlSkip(request.url(), this.currentInstance.req).isToSkip() ||
                !(new UrlAllow(request.url(), this.currentInstance.req).isToAllow())) {

                this.currentInstance.urls.skipped.push(request.url());
                request.abort();
                return;
            }

            if (!request.isNavigationRequest()) {
                this.currentInstance.urls.connected.push(request.url());
                request.continue();
                return;
            }

            const override = {
                method: this.currentInstance.method.toUpperCase(),
                headers: this.currentInstance._alterHeaders(request.headers(), this.currentInstance.headers)
            };

            this.currentInstance.requestHeaders = override.headers;

            if (override.method == 'post' && this.currentInstance.postParameters != '')
                override.postData = this.currentInstance.postParameters;

            this.currentInstance.urls.connected.push(request.url());
            request.continue(override);
        } catch (exception) {
            console.log(exception);
            this.currentInstance.exception = exception;
            request.abort();
        }
    }

    /**
     * @private
     * 
     * @param {Object} currrentInstance Represents some parts of this current instance. Created because of circular JSON error on puppeter when direct injection of "this"
     */
    _isMaxConnectionReached(currrentInstance) {
        if (currrentInstance.connectionCount == undefined)
            currrentInstance.connectionCount = 0;

        currrentInstance.connectionCount++;

        if (currrentInstance.connectionCount > currrentInstance.configuration.browser.maxConnectionCountPerPage)
            throw new Error(`Max connection [${this.connectionCount}]of the current page reached`);

        let maxConnection = 0;

        try {
            maxConnection = currrentInstance.req.body.skip.maxConnection;
        } catch (exception) {
            return false;
        }

        if (maxConnection == undefined)
            return false;

        if (isNaN(maxConnection))
            throw new Error('skip.maxConnection JSON parameters must be a number');

        return currrentInstance.connectionCount > maxConnection;
    }

    /**
     * @private
     * 
     * @returns {string}
     */
    _extractPostParameters() {
        let postParameters = '';

        try {
            postParameters = this.req.body.request.parameters;
        } catch (exception) {
            postParameters = '';
        }

        if (postParameters == undefined)
            postParameters = '';

        if (typeof postParameters != 'string')
            throw new Error('request.parameters JSON parameters must be a string');

        return postParameters;
    }

    /**
     * @private
     * 
     * @param {Object} headers 
     * @param {Object} newHeaders 
     * 
     * @returns {Object}
     */
    _alterHeaders(headers, newHeaders) {
        for (const key in newHeaders)
            headers[key] = newHeaders[key];

        return headers;
    }

    /**
     * @private
     * 
     * @returns {Object}
     */
    _extractHeaders() {
        let headers = {};

        try {
            headers = this.req.body.request.headers;
        } catch (exception) {
            headers = {};
        }

        if (headers == undefined)
            headers = {};

        if (!(headers instanceof Object))
            throw new Error('request.headers JSON parameters must be an object');

        return headers;
    }

    /**
     * @private
     * 
     * @param {string} keyToSearch 
     * 
     * @returns {string}
     */
    _getKey(keyToSearch) {
        for (const key in this.headers) {
            if (key != null && key.toLocaleLowerCase().trim() == keyToSearch)
                return key;
        }

        return null;
    }

    /**
     * @private
     * 
     * @returns {string}
     */
    _getKeyUserAgent() {
        return this._getKey('user-agent');
    }

    /**
     * @private
     * 
     * @return {string}
     */
    _getKeyCookie() {
        return this._getKey('cookie');
    }

    /**
     * @private
     * 
     * @return {string}
     */
    _extractUserAgent() {
        let userAgent = null;

        const keyUserAgent = this._getKeyUserAgent();

        if (keyUserAgent != null) {
            userAgent = this.headers[keyUserAgent];
            delete this.headers[keyUserAgent];
        }

        return userAgent;
    }

    /**
     * @private
     * 
     * @return {Object}
     */
    _extractCookies() {
        const keyCookie = this._getKeyCookie();
        if (keyCookie == null)
            return null;

        const rawCookie = this.headers[keyCookie];
        delete this.headers[keyCookie];

        if (rawCookie == null || rawCookie == '')
            return null;

        let cookies = cookieFromRequire.parse(rawCookie);
        if (cookies == null)
            return null;

        const domain = urlFromRequire.parse(this.req.body.request.url).hostname;

        const fullCookies = [];
        for (const key in cookies) {
            fullCookies.push({
                name: key,
                value: cookies[key],
                domain: domain
            });
        }

        return fullCookies;
    }

    /**
     * @private
     * 
     * @return {Promise<undefined>}
     */
    async _goto() {
        const htmlLocalFile = new HtmlLocalFile(this.req);

        if (htmlLocalFile.hasFile()) {
            await this.page.goto(`file://${htmlLocalFile.getFileName()}`, { waitUntil: 'networkidle2', timeout: configuration.browser.timeout });
            htmlLocalFile.removeFile();
            return;
        }

        await this.page.goto(this.req.body.request.url, { waitUntil: 'networkidle2', timeout: configuration.browser.timeout });
    }

    /**
     * @private
     * 
     * @return {Promise<undefined>}
     */
    async _loadScript() {
        let script = '';

        try {
            script = this.req.body.script;
        } catch (exception) {
            script = '';
        }

        if (script == undefined || script == null)
            script = '';

        if (script == '')
            return;

        script = 'this.scriptToLoad = () => { try {' + script + "} catch (exception) { return '' + exception;}}";
        eval(script);
        this.responseScript = await this.page.evaluate(this.scriptToLoad);
    }
}