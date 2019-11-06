#!/usr/bin/env node
<<<<<<< HEAD
// swaggerproxy
// node server.js --swagger_url https://llsams.qhhrly.cn/v2/api-docs --proxy_url https://llsams.qhhrly.cn --sso_url https://lls-sso.qhhrly.cn --username wby --password 1

=======

const argv = require('yargs').argv
>>>>>>> 44f60f3733c24b5eb2190f8a0edaf3476835b45a
const path = require('path');
const Url = require('url-parse');
const express = require('express');
const axios = require('axios');
const proxy = require('http-proxy-middleware');

console.log('argv is: ' + JSON.stringify(argv));

const app = express();

let { swagger_url, proxy_url, listen_to, sso_url, username, password } = argv;
listen_to = listen_to || 9000;

if (!swagger_url) {
    console.error("swagger_url not set, please start with 'swaggerproxy --swagger_url xxx --proxy_url xxx --sso_url xxx --username xxx --password xxx' ");
    return;
}
if (!proxy_url) {
    console.error("proxy_url not set, please start with 'swaggerproxy --swagger_url xxx --proxy_url xxx --sso_url xxx --username xxx --password xxx' ");
    return;
}

const surl = new Url(swagger_url);
const purl = new Url(proxy_url);

let swagger_content;
axios.get(swagger_url).then(res => {
    swagger_content = res.data;
    swagger_content.host = 'localhost:'+listen_to;
    swagger_content = JSON.stringify(swagger_content);
})

if (!sso_url) {
    startServer();
    return;
}

if (!username) {
    console.error("username not set, please start with 'swaggerproxy --swagger_url xxx --proxy_url xxx --sso_url xxx --username xxx --password xxx' ");
    return;
}
if (!password) {
    console.error("password not set, please start with 'swaggerproxy --swagger_url xxx --proxy_url xxx --sso_url xxx --username xxx --password xxx' ");
    return;
}

axios.get(`${sso_url}/sso-web/doLogin?username=${username}&password=${password}&ifRemember=true`).then(response => {
    if (response.status != 200) {
        console.error(response.statusText);
        return;
    }
    if (response.data.code != '200') {
        console.error(response.data.message);
        return;
    }
    startServer(response.headers['set-cookie']);
});

function startServer(cookies) {
    app.use('/swagger-ui/env.js', (req, res) => {
        if (cookies) {
            cookies.forEach(cookie => {
                let cookieArr = cookie.split(';')[0].split('=');
                res.cookie(cookieArr[0], cookieArr[1] || '');
            });
        }
        res.send('(function(){window.swagger_api_docs="'+surl.pathname+surl.query+'"})()')
    });
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
}
