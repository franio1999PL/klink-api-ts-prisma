import request from 'request';

const ROOT_URL = 'https://getpocket.com';
const ADD_URL = '/v3/add';
const SEND_URL = '/v3/send';
const GET_URL = '/v3/get';
const OAUTH_REQUEST_URL = '/v3/oauth/request';
const OAUTH_TOKEN_URL = '/auth/authorize';
const OAUTH_ACCESS_URL = '/v3/oauth/authorize';

interface GetPocketConfig {
    consumer_key: string;
    access_token?: string;
}

class GetPocket {
    private config: GetPocketConfig;
    private headers = {
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Accept': 'application/json'
    };

    constructor(config: GetPocketConfig) {
        this.config = config;
    }

    refreshConfig(config: GetPocketConfig) {
        this.config = config;
    }

    getRequestToken(params: { redirect_uri: string, consumer_key: string }, callback: (error: Error | null, response: any, body: any) => void) {
        if (!params.redirect_uri) {
            callback(new Error('400 Bad Request - missing params.redirect_uri'), null, null);
            return false;
        }
        const options = { ...params };
        options.consumer_key = this.config.consumer_key;
        const url = ROOT_URL + OAUTH_REQUEST_URL;
        const opts = {
            uri: url,
            headers: this.headers,
            body: JSON.stringify(options)
        };
        return request.post(opts, callback);
    }

    getAuthorizeURL(params: { request_token: string, redirect_uri: string }) {
        return ROOT_URL + OAUTH_TOKEN_URL + '?request_token=' + params.request_token + '&redirect_uri=' + params.redirect_uri;
    }

    getAccessToken(params: { request_token: string, consumer_key: string, code: any }, callback: (error: Error | null, response: any, body: any) => void) {
        if (!params.request_token) {
            callback(new Error('400 Bad Request - missing params.request_token'), null, null);
            return false;
        }

        const options = { ...params };
        options.consumer_key = this.config.consumer_key;
        options.code = params.request_token;
        const url = ROOT_URL + OAUTH_ACCESS_URL;
        const opts = {
            uri: url,
            headers: this.headers,
            body: JSON.stringify(options)
        };
        return request.post(opts, callback);
    }

    add(params: { url: string, title?: string, tags?: string, tweet_id?: string, consumer_key: string, access_token: string | undefined }, callback: (error: Error | null, response: any) => void) {
        if (!params.url) {
            callback(new Error('400 Bad Request - missing params.url'), null);
            return false;
        }

        const options = { ...params };
        options.consumer_key = this.config.consumer_key;
        options.access_token = this.config.access_token;
        const url = ROOT_URL + ADD_URL;
        const opts = {
            uri: url,
            headers: this.headers,
            body: JSON.stringify(options)
        };

        request.post(opts, (error:any, response:any, body:any) => {
            this._callbackHandler(error, response, body, callback);
        });
    }

    send(params: { actions: any[], consumer_key?: string, access_token?: string | undefined }, callback: (error: Error | null, response: any) => void) {
        if (!params.actions) {
            callback(new Error('400 Bad Request - missing params.actions'), null);
            return false;
        }

        const options = { ...params };
        options.consumer_key = this.config.consumer_key;
        options.access_token = this.config.access_token;
        const url = ROOT_URL + SEND_URL;
        const opts = {
            uri: url,
            headers: this.headers,
            body: JSON.stringify(options)
        };

        request.post(opts, (error:any, response:any, body:any) => {
            this._callbackHandler(error, response, body, callback);
        });
    }

    modify(params: { actions: any[] }, callback: (error: Error | null, response: any) => void) {
        // alias for send
        return this.send(params, callback);
    }

    get(params: { [key: string]: any }, callback: (error: Error | null, response: any) => void) {
        const options = params || {};
        options.consumer_key = this.config.consumer_key;
        options.access_token = this.config.access_token;
        const url = ROOT_URL + GET_URL;

        const opts = {
            uri: url,
            headers: this.headers,
            body: JSON.stringify(options)
        };

        request.post(opts, (error:any, response:any, body:any) => {
            this._callbackHandler(error, response, body, callback);
        });
    }

    retrieve(params: { [key: string]: any }, callback: (error: Error | null, response: any) => void) {
        // alias for get
        return this.get(params, callback);
    }

    archive(params: { item_id?: string }, callback: (error: Error | null, response: any) => void) {
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

    private _callbackHandler(error: any, response: any, body: any, callback: (error: Error | null, response: any) => void) {
        if (error) {
            callback(error, undefined);
        } else if (response.statusCode !== 200) {
            callback(new Error(response.statusCode), undefined);
        } else {
            try {
                const payload = JSON.parse(body);
                callback(null, payload);
            } catch (e) {
                callback(new Error('Could not interpret response from getpocket.com as JSON. Sorry ' + e), undefined);
            }
        }
    }
}

export = GetPocket;
