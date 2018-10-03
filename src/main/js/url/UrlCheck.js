'use strict';

const path = require('path');

/**
 * Abstract class inherited by UrlAllow and UrlSkip classes
 * 
 * @abstract
 * 
 * @class
 */
module.exports = class UrlCheck {

    /**
     * List of all available image formats 
     * 
     * @public
     * 
     * @returns {Array}
     */
    static get IMAGE_EXTENSIONS() {
        return [
            '.jpg',
            '.jpeg',
            '.jfif',
            '.exif',
            '.tiff',
            '.gif',
            '.bmp',
            '.svg',
            '.png',
            '.ico'
        ];
    }

    /**
     * List of all available video formats 
     * 
     * @public
     * 
     * @returns {Array}
     */
    static get VIDEO_EXTENSIONS() {
        return [
            '.mp4',
            '.avi',
            '.flv',
            '.ogg',
            '.amv'
        ];
    }

    /**
     * List of all available audio formats 
     * 
     * @public
     * 
     * @returns {Array}
     */
    static get AUDIO_EXTENSIONS() {
        return [
            '.mp2',
            '.mp3',
            '.raw'
        ];
    }

    /**
     * Constructor needs url, request and type of treatment
     *  
     * @public
     * 
     * @constructor
     * 
     * @param {string} url
     * @param {Request} req
     * @param {string} type only accepts two kinds of value "skip" or "allow"
     * 
     * @returns {UrlCheck}
     */
    constructor(url, req, type) {
        if (new.target === Abstract)
            throw new TypeError('Cannot construct Abstract instances directly');

        if (type != 'skip' && type != 'allow')
            throw new Error(`type [${type}] is not supported`);

        this.url = url;
        this.req = req;
        this.type = type;
    }

    /**
     * Check if url is to skip or to allow depending the specified type on constructor
     * 
     * @public
     * 
     * @returns {boolean}
     */
    check() {
        return this._isOnResources() ||
            this._isEquals() ||
            this._isContains() ||
            this._isPattern() ||
            this._isFunctionToSimulate();
    }

    /**
     * @private
     * 
     * @returns {boolean}
     */
    _isOnResources() {
        const extension = this._getExtension();
        if (extension == '')
            return undefined;

        let resources = [];

        try {
            resources = this.req.body[this.type].resources;
        } catch (exception) {
            return undefined;
        }

        if (resources == undefined)
            return undefined;

        if (!(resources instanceof Array))
            throw new Error(`${this.type}.resources JSON parameters must be an array`);

        resources = resources.map(resource => {
            return resource != undefined && resource != null ?
                resource.toLowerCase() :
                resource;
        });

        for (const resource of resources) {
            switch (resource) {
                case 'image':
                    if (UrlCheck.IMAGE_EXTENSIONS.includes(extension))
                        return true;
                    break;
                case 'video':
                    if (UrlCheck.VIDEO_EXTENSIONS.includes(extension))
                        return true;
                    break;
                case 'audio':
                    if (UrlCheck.AUDIO_EXTENSIONS.includes(extension))
                        return true;
                    break;
                case 'css':
                    if (extension == '.css')
                        return true;
                    break;
                case 'javascript':
                    if (extension == '.js')
                        return true;
                    break;
                default:
                    throw new Error(`${this.type}.resources JSON parameters with value [${resource}] is not supported`);
            }
        }

        return false;
    }

    /**
     * @private
     * 
     * @returns {string}
     */
    _getExtension() {
        this.url = this.url.split('#')[0].split('?')[0];
        return path.extname(this.url).toLowerCase();
    }

    /**
     * @private
     * 
     * @returns {boolean}
     */
    _isEquals() {
        let listEquals = [];

        try {
            listEquals = this.req.body[this.type].url.equals;
        } catch (exception) {
            return undefined;
        }

        if (listEquals == undefined)
            return undefined;

        if (!(listEquals instanceof Array))
            throw new Error(`${this.type}.url.equals JSON parameters must be an array`);

        if (listEquals.length == 0)
            return undefined;

        return listEquals.includes(this.url);
    }

    /**
     * @private
     * 
     * @returns {boolean}
     */
    _isContains() {
        let listContains = [];

        try {
            listContains = this.req.body[this.type].url.contains;
        } catch (exception) {
            return undefined;
        }

        if (listContains == undefined)
            return undefined;

        if (!(listContains instanceof Array))
            throw new Error(`${this.type}.url.contains JSON parameters must be an array`);

        if (listContains.length == 0)
            return undefined;

        for (let contains of listContains) {
            if (contains == null)
                continue;

            if (this.url.includes(contains))
                return true;
        }

        return false;
    }

    /**
     * @private
     * 
     * @returns {boolean}
     */
    _isFunctionToSimulate() {
        let functionToSimulate = '';

        try {
            functionToSimulate = this.req.body[this.type].url.function;
        } catch (exception) {
            return undefined;
        }

        if (functionToSimulate == undefined || functionToSimulate == '' || functionToSimulate == null)
            return undefined;

        functionToSimulate = `functionToSimulate = ${functionToSimulate}`;
        eval(functionToSimulate);
        return functionToSimulate(this.url);
    }

    /**
     * @private
     * 
     * @returns {boolean}
     */
    _isPattern() {
        let patterns = [];

        try {
            patterns = this.req.body[this.type].url.patterns;
        } catch (exception) {
            return undefined;
        }

        if (patterns == undefined)
            return undefined;

        if (!(patterns instanceof Array))
            throw new Error(`${this.type}.url.patterns JSON parameters must be an array`);

        if (patterns.length == 0)
            return undefined;

        for (const pattern of patterns) {
            if (new RegExp(pattern).test(this.url))
                return true;
        }

        return false;
    }
}