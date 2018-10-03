'use strict';

const UrlCheck = require('./UrlCheck');

/**
 * Check if current url is allowed to be requested or not by Chromium
 * 
 * @class
 */
module.exports = class UrlAllow extends UrlCheck {

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
     * @returns {UrlCheck}
     */
    constructor(url, req) {
        super(url, req, 'allow')
    }

    /**
     * Check if current url is allowed to be requested or not by Chromium
     * Based on configuration from request parameters, it decides the action to do
     * 
     * @public
     * 
     * @returns {boolean}
     */
    isToAllow() {
        const isOnResources = this._isOnResources();
        if (isOnResources != undefined)
            return isOnResources;

        const isEquals = this._isEquals(false);
        if (isEquals != undefined)
            return isEquals;

        const isEqualsIgnoreCase = this._isEquals(true);
        if (isEqualsIgnoreCase != undefined)
            return isEqualsIgnoreCase;

        const isContains = this._isContains(false);
        if (isContains != undefined)
            return isContains;

        const isPattern = this._isPattern();
        if (isPattern != undefined)
            return isPattern;

        const isFunctionToSimulate = this._isFunctionToSimulate();
        return isFunctionToSimulate == undefined || isFunctionToSimulate;
    }
}