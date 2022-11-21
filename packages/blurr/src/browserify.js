/* eslint-disable no-undef */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const blurr = require('../build/main/index.js');
global.window.blurr = { ...blurr };
module.exports = { ...blurr };