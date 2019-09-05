const path = require('path');
const express = require('express');
const proxy = require('http-proxy-middleware');
const argv = require('yargs').argv

console.log('argv is: ' + JSON.stringify(argv));

const app = express();

const swagger_url = argv.swagger_url; //'http://localhost:9000/v2/api-docs'
const proxy_url = argv.proxy_url; // 'http://localhost:8090'

app.use('/swagger-ui/env.js', (req, res) => res.send('(function(){window.swagger_api_docs="'+swagger_url+'"})()'));
app.use('/swagger-ui', express.static(path.join(__dirname, 'dist')));
app.use('**', proxy({ target: proxy_url, changeOrigin: true }));
app.listen(9000);