'use strict';

const path = require('path');

module.exports = class UrlSkip {

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

    static get VIDEO_EXTENSIONS() {
        return [
            '.mp4',
            '.avi',
            '.flv',
            '.ogg',
            '.amv'
        ];
    }

    static get AUDIO_EXTENSIONS() {
        return [
            '.mp2',
            '.mp3',
            '.raw'
        ];
    }

    constructor(url, req) {
        this.url = url;
        this.req = req;
    }

    isToSkip() {
        return this._isOnResources() ||
            this._isEquals(false) ||
            this._isEquals(true) ||
            this._isContains(false) ||
            this._isContains(true) ||
            this._isPattern() ||
            this._isFunctionToSimulate();
    }

    _isOnResources() {
        const extension = this._getExtension();
        if (extension == '')
            return false;

        let resources = [];

        try {
            resources = this.req.body.skip.resources;
        } catch (exception) {
            resources = [];
        }

        if (resources == undefined)
            resources = [];

        if (!(resources instanceof Array))
            throw new Error('request.skip.resources JSON parameters must be an array');

        for (const resource of resources){
            switch (resource) {
                case 'image':
                    return UrlSkip.IMAGE_EXTENSIONS.includes(extension);
                case 'video':
                    return UrlSkip.VIDEO_EXTENSIONS.includes(extension);
                case 'audio':
                    return UrlSkip.AUDIO_EXTENSIONS.includes(extension);
                case 'css':
                    return extension == '.css';
                case 'javascript':
                    return extension == '.js';
                default:
                    throw new Error(`request.skip.resources JSON parameters with value [${resource}] is not supported`);
            }
        }
        
        return false;
    }

    _getExtension() {
        this.url = this.url.split('#')[0].split('?')[0];
        return path.extname(this.url).toLowerCase();
    }

    _isEquals(ignoreCase) {
        let listEquals = [];

        try {
            if (ignoreCase)
                listEquals = this.req.body.skip.url.equalsIgnoreCase;
            else
                listEquals = this.req.body.skip.url.equals;
        } catch (exception) {
            listEquals = [];
        }

        if (listEquals == undefined)
            listEquals = [];

        if (!(listEquals instanceof Array))
            throw new Error('request.skip.url.equals JSON parameters must be an array');

        if (listEquals.length == 0)
            return false;

        if (ignoreCase) {
            return listEquals.map((equals) => {
                if (equals == null)
                    return null;

                return equals.toLowerCase()
            }).includes(this.url.toLowerCase());
        }

        return listEquals.includes(this.url);
    }

    _isContains(ignoreCase) {
        let listContains = [];

        try {
            if (ignoreCase)
                listContains = this.req.body.skip.url.containsIgnoreCase;
            else
                listContains = this.req.body.skip.url.contains;
        } catch (exception) {
            listContains = [];
        }

        if (listContains == undefined)
            listContains = [];

        if (!(listContains instanceof Array))
            throw new Error('request.skip.url.contains JSON parameters must be an array');

        if (listContains.length == 0)
            return false;

        for (let contains of listContains) {
            if (contains == null)
                continue;

            let urlToTest = this.url;
            if (ignoreCase) {
                contains = contains.toLowerCase();
                urlToTest = this.url.toLowerCase();
            }

            if (urlToTest.includes(contains))
                return true;
        }

        return false;
    }

    _isFunctionToSimulate(){
        let functionToSimulate = '';

        try {
            functionToSimulate = this.req.body.skip.url.function;
        } catch (exception){
            functionToSimulate = '';
        }

        if (functionToSimulate == undefined || functionToSimulate == '' || functionToSimulate == null)
            return false;

        functionToSimulate = `functionToSimulate = ${functionToSimulate}`;
        eval(functionToSimulate);
        return functionToSimulate(this.url);
    }

    _isPattern(){
        let patterns = [];

        try {
            patterns = this.req.body.skip.url.patterns;
        } catch (exception){
            patterns = [];   
        }

        if (patterns == undefined)
            patterns = [];

        for (const pattern of patterns){
            if (new RegExp(pattern).test(this.url))
                return true;
        }

        return false;
    }
}