'use strict';

const UrlCheck = require('./UrlCheck');

/**
 * Check if current url is to skip or not from request by Chromium
 * 
 * @class
 */
module.exports = class UrlSkip extends UrlCheck {

    /**
     * Constructor needs url and request
     * 
     * @public
     * 
     * @constructor
     * 
     * @param {string} url 
     * @param {Request} req 
     * 
     * @return {UrlCheck}
     */
    constructor(url, req) {
        super(url, req, 'skip')
    }

    /**
     * Check if url is to skip or not from request by Chromium
     * 
     * @public
     * 
     * @return {boolean}
     */
    isToSkip() {
        return this._isOnResources() ||
            this._isEquals(false) ||
            this._isEquals(true) ||
            this._isContains(false) ||
            this._isContains(true) ||
            this._isPattern() ||
            this._isFunctionToSimulate();
    }
}