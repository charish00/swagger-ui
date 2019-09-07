#!/usr/bin/env node

const argv = require('yargs').argv
const path = require('path');
const Url = require('url-parse');
const express = require('express');
const axios = require('axios');
const proxy = require('http-proxy-middleware');

console.log('argv is: ' + JSON.stringify(argv));

const app = express();

const swagger_url = argv.swagger_url; //'http://localhost:9000/v2/api-docs'
const proxy_url = argv.proxy_url; // 'http://localhost:8090'
const listen_to = argv.listen_to || 9000;

const surl = new Url(swagger_url);
const purl = new Url(proxy_url);
// console.log(surl)

let swagger_content;

axios.get(swagger_url).then(res => {
    swagger_content = res.data;
    swagger_content.host = 'localhost:'+listen_to;
    swagger_content = JSON.stringify(swagger_content);
})

app.use('/swagger-ui/env.js', (req, res) => res.send('(function(){window.swagger_api_docs="'+surl.pathname+surl.query+'"})()'));
app.use('/swagger-ui', express.static(path.join(__dirname, 'frontend')));
app.use(surl.pathname, (req, res) => res.send(swagger_content));
app.use('/', proxy({ 
    target: purl.origin, 
    pathRewrite: {
        '/': purl.pathname
    },
    changeOrigin: true 
}));
app.listen(listen_to);

console.log('proxy server start up: http://localhost:' + listen_to + '/swagger-ui/index.html');