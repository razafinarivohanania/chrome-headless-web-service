'use strict';

const urlFromRequire = require('url');
const fs = require('fs');

const configuration = require('./configuration-loader');

/**
 * Manage temporary html file to load on Chromium
 * 
 * @class
 */
module.exports = class HtmlLocalFile {

    /**
     * Constructor needs request
     * 
     * @public
     * 
     * @constructor
     * 
     * @param {Request} req 
     * 
     * @returns {HtmlLocalFile}
     */
    constructor(req) {
        this.req = req;
        this._saveHtml();
    }

    /**
     * Count html files since the server was run
     * It avoids to create two or many differents files with same name
     * 
     * @public
     * 
     * @static
     * 
     * @returns {number}
     */
    static count() {
        if (this.count == undefined)
            this.count = 0;

        this.count++;
    }

    /**
     * Check if file exists or not
     * 
     * @public
     * 
     * @returns {boolean}
     */
    hasFile() {
        return this.fileName != undefined &&
            this.fileName != null &&
            this.fileName != '';
    }

    /**
     * Get the filename
     * 
     * @public
     * 
     * @returns {string}
     */
    getFileName() {
        return this.fileName;
    }

    /**
     * Remove file
     * 
     * @public
     * 
     * @returns {undefined}
     */
    removeFile() {
        fs.unlinkSync(this.fileName);
    }

    /**
     * @private
     * 
     * @returns {undefined}
     */
    _saveHtml() {
        let html = '';

        try {
            html = this.req.body.request.html;
        } catch (exception) {
            html = '';
        }

        if (html == undefined || html == null || html == '')
            return;

        if (typeof html != 'string')
            throw new Error('request.html JSON parameters must be a string');

        this._buildFileName();
        fs.writeFileSync(this.fileName, html, 'utf-8');
    }

    /**
     * @private
     * 
     * @returns {undefined}
     */
    _buildFileName() {
        const url = this.req.body.request.url;
        const identifier = url.replace(/[^a-zA-Z-_\d]+/g, '');
        const hostname = urlFromRequire.parse(url).hostname;
        this.fileName = `${process.cwd().replace("\\", "/")}/${configuration.server.directoryTemporaryFile}/${hostname}-${identifier}-temp-file-${this.count}.html`;
    }
}