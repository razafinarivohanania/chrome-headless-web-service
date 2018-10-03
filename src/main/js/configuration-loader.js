'use strict';

const fs = require('fs');

/**
 * Build path of configuration.json file
 * 
 * @public
 * 
 * @function
 * 
 * @returns {string}
 */
function buildPathConfiguration(){
    const paths = __dirname.split(/[/\\]/);
    paths.pop();
    return `${paths.join('/')}/resources/configuration.json`;
}

/**
 * Load configuration from configuration.json file
 * 
 * @type {Object}
 */
const configuration = JSON.parse(fs.readFileSync(buildPathConfiguration(), 'utf-8'));
module.exports = configuration;