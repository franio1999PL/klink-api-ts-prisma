"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getPocket_1 = __importDefault(require("./getPocket"));
const express_1 = __importDefault(require("express"));
const stdio_1 = require("stdio");
const options = (0, stdio_1.getopt)({
    'consumer_key': {
        key: 'c',
        description: 'GetPocket consumer key',
        mandatory: true,
        args: 1
    },
    'host': {
        key: 'h',
        description: 'Host name or IP address',
        args: 1,
        default: '127.0.0.1'
    },
    'port': {
        key: 'p',
        description: 'Listening port',
        args: 1,
        default: '8080'
    }
});
const cfg = {
    consumer_key: options.consumerkey,
    request_token: '',
    access_token: '',
    user_name: '',
    redirect_uri: 'http://localhost:8080/redirect'
};
const pocket = new getPocket_1.default(cfg);
const app = (0, express_1.default)();
app.get('/', function (req, res) {
    const params = {
        redirect_uri: cfg.redirect_uri
    };
    app.locals.res = res;
    console.log('Asking GetPocket for request token ...');
    console.log('params: ', params);
    pocket.getRequestToken(params, function (err, resp, body) {
        if (err) {
            console.log('Failed to get request token: ' + err);
            app.locals.res.send('<p>' + 'Failed to get request token: ' + err + '</p>');
        }
        else if (resp.statusCode !== 200) {
            app.locals.res.send('<p>Oops, Pocket said ' + resp.headers.status + ', ' + resp.headers['x-error'] + '</p>');
        }
        else {
            const json = JSON.parse(body);
            cfg.request_token = json.code;
            console.log('Received request token: ' + cfg.request_token);
            const url = pocket.getAuthorizeURL(cfg);
            console.log('Redirecting to ' + url + ' for authentication');
            app.locals.res.redirect(url);
        }
    });
});
app.get('/redirect', function (req, res) {
    console.log('Authentication callback active ...');
    console.log('Asking GetPocket for access token ...');
    app.locals.res = res;
    const params = {
        request_token: cfg.request_token
    };
    console.log('params: ', params);
    pocket.getAccessToken(params, function access_token_handler(err, resp, body) {
        if (err) {
            console.log('Failed to get access token: ' + err);
            app.locals.res.send('<p>' + 'Failed to get access token: ' + err + '</p>');
        }
        else if (resp.statusCode !== 200) {
            app.locals.res.send('<p>Oops, Pocket said ' + resp.headers.status + ', ' + resp.headers['x-error'] + '</p>');
        }
        else {
            const json = JSON.parse(body);
            cfg.access_token = json.access_token;
            cfg.user_name = json.username;
            console.log('Received access token: ' + cfg.access_token + ' for user ' + cfg.user_name);
            const config = {
                consumer_key: cfg.consumer_key,
                access_token: cfg.access_token
            };
            app.locals.res.send('<p>Pocket says "yes"</p>' +
                '<p>Your <code>GetPocket</code> configuration should look like this ...</p>' +
                '<p><code>var config = ' + JSON.stringify(config, undefined, 2) + ';</code></p>');
        }
    });
});
const server = app.listen(options.port, options.host, function () {
    console.log('Now listening at http://%s:%s', server.address().address, server.address().port);
});
