const blurr = require('../build/main/index.js');
global.window.blurr = { ...blurr };
module.exports = { ...blurr };