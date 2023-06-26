"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const request_1 = __importDefault(require("request"));
const ROOT_URL = 'https://getpocket.com';
const ADD_URL = '/v3/add';
const SEND_URL = '/v3/send';
const GET_URL = '/v3/get';
const OAUTH_REQUEST_URL = '/v3/oauth/request';
const OAUTH_TOKEN_URL = '/auth/authorize';
const OAUTH_ACCESS_URL = '/v3/oauth/authorize';
class GetPocket {
    constructor(config) {
        this.headers = {
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Accept': 'application/json'
        };
        this.config = config;
    }
    refreshConfig(config) {
        this.config = config;
    }
    getRequestToken(params, callback) {
        if (!params.redirect_uri) {
            callback(new Error('400 Bad Request - missing params.redirect_uri'), null, null);
            return false;
        }
        const options = Object.assign({}, params);
        options.consumer_key = this.config.consumer_key;
        const url = ROOT_URL + OAUTH_REQUEST_URL;
        const opts = {
            uri: url,
            headers: this.headers,
            body: JSON.stringify(options)
        };
        return request_1.default.post(opts, callback);
    }
    getAuthorizeURL(params) {
        return ROOT_URL + OAUTH_TOKEN_URL + '?request_token=' + params.request_token + '&redirect_uri=' + params.redirect_uri;
    }
    getAccessToken(params, callback) {
        if (!params.request_token) {
            callback(new Error('400 Bad Request - missing params.request_token'), null, null);
            return false;
        }
        const options = Object.assign({}, params);
        options.consumer_key = this.config.consumer_key;
        options.code = params.request_token;
        const url = ROOT_URL + OAUTH_ACCESS_URL;
        const opts = {
            uri: url,
            headers: this.headers,
            body: JSON.stringify(options)
        };
        return request_1.default.post(opts, callback);
    }
    add(params, callback) {
        if (!params.url) {
            callback(new Error('400 Bad Request - missing params.url'), null);
            return false;
        }
        const options = Object.assign({}, params);
        options.consumer_key = this.config.consumer_key;
        options.access_token = this.config.access_token;
        const url = ROOT_URL + ADD_URL;
        const opts = {
            uri: url,
            headers: this.headers,
            body: JSON.stringify(options)
        };
        request_1.default.post(opts, (error, response, body) => {
            this._callbackHandler(error, response, body, callback);
        });
    }
    send(params, callback) {
        if (!params.actions) {
            callback(new Error('400 Bad Request - missing params.actions'), null);
            return false;
        }
        const options = Object.assign({}, params);
        options.consumer_key = this.config.consumer_key;
        options.access_token = this.config.access_token;
        const url = ROOT_URL + SEND_URL;
        const opts = {
            uri: url,
            headers: this.headers,
            body: JSON.stringify(options)
        };
        request_1.default.post(opts, (error, response, body) => {
            this._callbackHandler(error, response, body, callback);
        });
    }
    modify(params, callback) {
        // alias for send
        return this.send(params, callback);
    }
    get(params, callback) {
        const options = params || {};
        options.consumer_key = this.config.consumer_key;
        options.access_token = this.config.access_token;
        const url = ROOT_URL + GET_URL;
        const opts = {
            uri: url,
            headers: this.headers,
            body: JSON.stringify(options)
        };
        request_1.default.post(opts, (error, response, body) => {
            this._callbackHandler(error, response, body, callback);
        });
    }
    retrieve(params, callback) {
        // alias for get
        return this.get(params, callback);
    }
    archive(params, callback) {
        if (!params || !params.item_id) {
            callback(new Error('400 Bad Request - missing params.item_id'), null);
            return false;
        }
        const actions = [
            {
                action: 'archive',
                item_id: params.item_id,
                time: new Date().getTime()
            }
        ];
        const options = {
            actions: actions
        };
        this.send(options, callback);
    }
    _callbackHandler(error, response, body, callback) {
        if (error) {
            callback(error, undefined);
        }
        else if (response.statusCode !== 200) {
            callback(new Error(response.statusCode), undefined);
        }
        else {
            try {
                const payload = JSON.parse(body);
                callback(null, payload);
            }
            catch (e) {
                callback(new Error('Could not interpret response from getpocket.com as JSON. Sorry ' + e), undefined);
            }
        }
    }
}
module.exports = GetPocket;
