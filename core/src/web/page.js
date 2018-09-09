'use strict';

const urlFromRequire = require('url');

const cookieFromRequire = require('cookie');
const UrlSkip = require('./url-skip.js');
const configuration = require('../configuration-loader.js');

module.exports = class Page {

    constructor(page, req) {
        this.page = page;
        this.req = req;
        this.headers = this._extractHeaders();

        this.userAgent = this._extractUserAgent();
        this.method = this._extractMethod();
        this.cookies = this._extractCookies();
        this.postParameters = this._extractPostParameters();
    }

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
                notRenderedPageAlreadyGot: false
            };

            this.page.on('request', this._interceptRequest);

            this.page.on('response', this._interceptNotRenderedResponse);

            await this.page.goto(this.req.body.request.url, { waitUntil: 'networkidle2', timeout: configuration.browser.timeout });

            await this._loadScript();

            const cookies = await this.page.cookies();
            const content = await this.page.content();

            this.renderedResponse = {
                cookie: cookies,
                content: content
            }

            if (this.page.currentInstance.exception != undefined)
                throw this.page.currentInstance.exception;
        } catch (exception) {
            await this.close();

            console.log(exception);
            throw exception;

        }
    }

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

    getResponseScript(){
        return this.responseScript == undefined ?
            null :
            this.responseScript;
    }

    async close() {
        try {
            await this.page.close();
        } catch (pageException) {
        }
    }

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

    getNotRenderedResponse() {
        return this.page.currentInstance.notRenderedResponse;
    }

    getRenderedResponse() {
        return this.renderedResponse;
    }

    getRequestHeaders() {
        return this.page.currentInstance.requestHeaders;
    }

    _interceptRequest(request) {
        try {
            if (new UrlSkip(request.url(), this.currentInstance.req).isToSkip()) {
                request.abort();
                return;
            }

            if (!request.isNavigationRequest()) {
                request.continue();
                return;
            }

            const override = {
                method: this.currentInstance.method.toUpperCase(),
                headers: this.currentInstance._alterHeaders(request.headers(), this.currentInstance.headers)
            };

            this.currentInstance.requestHeaders = override.headers;

            if (this.postParameters != '')
                override.postData = this.currentInstance.postParameters;

            request.continue(override);
        } catch (exception) {
            this.currentInstance.exception = exception;
            request.abort();
        }
    }

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

    _alterHeaders(headers, newHeaders) {
        for (const key in newHeaders)
            headers[key] = newHeaders[key];

        return headers;
    }

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

    _getKey(keyToSearch) {
        for (const key in this.headers) {
            if (key != null && key.toLocaleLowerCase().trim() == keyToSearch)
                return key;
        }

        return null;
    }

    _getKeyUserAgent() {
        return this._getKey('user-agent');
    }

    _getKeyCookie() {
        return this._getKey('cookie');
    }

    _extractUserAgent() {
        let userAgent = null;

        const keyUserAgent = this._getKeyUserAgent();

        if (keyUserAgent != null) {
            userAgent = this.headers[keyUserAgent];
            delete this.headers[keyUserAgent];
        }

        return userAgent;
    }

    _extractCookies(key) {
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
}