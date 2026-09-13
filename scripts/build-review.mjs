// The two browser modules have no runtime dependencies. Keep this bundle explicit.
import fs from 'node:fs';
const model = fs.readFileSync('dist/review-model.js', 'utf8').replace(/\r\n/g, '\n');
const app = fs.readFileSync('dist/review-app.js', 'utf8').replace(/\r\n/g, '\n');
if (/^import /m.test(model) || (app.match(/^import /gm) || []).length !== 1 || !app.includes("from './review-model.js'")) throw new Error('Review browser dependencies changed; inspect bundling.');
const code = `(function () {\n'use strict';\n${model.replace(/^export /gm, '')}\n${app.replace(/^import .*;\n/m, '')}\n})();\n`;
fs.writeFileSync('dist/review-browser.js', code);
fs.copyFileSync('src/review-ui.css', 'dist/review-ui.css');
