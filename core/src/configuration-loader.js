'use strict';

const fs = require('fs');

let configuration = JSON.parse(fs.readFileSync('./core/resources/configuration.json', 'utf-8'));
module.exports = configuration;