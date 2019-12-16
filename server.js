#!/usr/bin/env node

const argv = require('yargs').argv
const path = require('path');
const Url = require('url-parse');
const express = require('express');
const axios = require('axios');
const proxy = require('http-proxy-middleware');
const opn = require('opn');

console.log('argv is: ' + JSON.stringify(argv));

const app = express();

let { swagger_url, proxy_url, listen_to } = argv;
listen_to = listen_to || 9000;

if (!swagger_url) {
    console.error("swagger_url not set, please start with 'swaggerproxy --swagger_url xxx --proxy_url xxx' ");
    return;
}
if (!proxy_url) {
    console.error("proxy_url not set, please start with 'swaggerproxy --swagger_url xxx --proxy_url xxx' ");
    return;
}

const surl = new Url(swagger_url);
const purl = new Url(proxy_url);

axios.get(swagger_url).then(res => {
    let swagger_content = res.data;
    swagger_content.host = 'localhost:' + listen_to;
    swagger_content = JSON.stringify(swagger_content);

    app.use('/swagger-ui/env.js', (req, res) => {
        res.send(`(function(){window.swagger_api_docs="${surl.pathname + surl.query}"})()`)
    });
    app.use('/swagger-ui', express.static(path.join(__dirname, 'frontend')));
    app.use(surl.pathname, (req, res) => res.send(swagger_content));
    app.use('/', proxy({
        target: purl.origin,
        pathRewrite: {
            '/': purl.pathname
        },
        changeOrigin: true,
        onProxyReq(proxyReq, req, res) {
            let authCode = req.headers.authcode;
            if (authCode) {
                proxyReq.setHeader('auth-code', authCode);
                req.headers['auth-code'] = authCode;
            }
        }
    }));
    app.listen(listen_to);

    const loginview = `http://localhost:${listen_to}/index.html`;
    const swaggerView = `http://localhost:${listen_to}/swagger-ui/index.html`;
    opn(loginview, { app: 'chrome' });
    opn(swaggerView, { app: 'chrome' }).then(() => {
        console.log(swaggerView);
    });
})
