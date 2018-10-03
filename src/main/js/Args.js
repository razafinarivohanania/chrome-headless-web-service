'use strict';

/**
 * Manages args to inject natively into Chromium
 * 
 * @class
 */
module.exports = class Args {

    /**
     * Constructor needs request
     * 
     * @public
     * 
     * @constructor
     * 
     * @param {Request} req 
     * 
     * @returns {Args}
     */
    constructor(req) {
        this.req = req;
        this.args = new Set();
        this._buildProxy();
        this._addOtherArgs();
    }

    /**
     * Get all args as array type
     * 
     * @public
     * 
     * @return {Array}
     */
    getArgs() {
        const argsAsArray = [];

        if (this.args.size == 0)
            return argsAsArray;

        this.args.forEach(arg => argsAsArray.push(arg));
        return argsAsArray;
    }

    /**
     * @private
     * 
     * @return {undefined}
     */
    _buildProxy() {
        let proxy;

        try {
            proxy = this.req.body.proxy;
        } catch (exception) {
        }

        if (proxy == undefined)
            return;

        if (!(proxy instanceof Object))
            throw new Error('proxy on JSON parameters must be an object');

        const host = proxy.host;
        if (host == undefined || host == null || host == '')
            throw new Error('proxy.host on JSON parameters is empty');

        const port = proxy.port;
        if (isNaN(port))
            throw new Error('proxy.port on JSON parameters must be a number');

        this.args.add(`--proxy-server=${host}:${port}`);
    }

    /**
     * @private
     * 
     * @return {undefined}
     */
    _addOtherArgs() {
        let args;

        try {
            args = this.req.body.args;
        } catch (exception) {
        }

        if (args == undefined)
            return;

        if (!(args instanceof Array))
            throw new Error('args on JSON parameters must be an array');

        args.forEach(arg => this.args.add('' + arg));
    }
}