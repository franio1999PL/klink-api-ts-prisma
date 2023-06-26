"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const getPocket_1 = __importDefault(require("./getPocket"));
const client_1 = require("@prisma/client");
const resend_1 = require("resend");
const dotenv_1 = __importDefault(require("dotenv"));
// Prisma and Resend initialization
const prisma = new client_1.PrismaClient();
const resend = new resend_1.Resend(process.env.RESEND_TOKEN);
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
// Setup config for connection with getpocket api
const pocketConfig = {
    consumerKey: process.env.POCKET_CONSUMER_KEY || '',
    accessKey: process.env.POCKET_ACCESS_KEY || ''
};
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // GetPocket API connection to retrieve posts
    const getDataFromPocket = (consumer_key, access_token) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('starting getpocket function...');
        const pocket = new getPocket_1.default({
            consumer_key,
            access_token
        });
        const params = {
            favorite: 1,
            count: 1000,
            sort: 'newest',
            detailType: 'complete'
        };
        yield pocket.get(params, (err, response) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                console.log(err.message);
                try {
                    const data = yield resend.emails.send({
                        from: 'notification@blady.dev',
                        to: 'sikorafranek@gmail.com',
                        subject: 'Knotz.link api error',
                        html: `<strong>Error with pocket connection!</strong> Error log: ${err}`
                    });
                    console.log(data);
                    return;
                }
                catch (err) {
                    console.log('We cant send notification with error' + err);
                }
            }
            const posts = response.list;
            const postsFromPocketApi = Object.values(posts).map(({ item_id: id, given_url: url, resolved_title: title, excerpt: description, time_favorited: time_added, 
            //   time_to_read: read_time,
            word_count, tags }) => ({
                id,
                url,
                title,
                description,
                time_added,
                word_count,
                tags: tags && Object.keys(tags).length > 0 ? tags : {}
            }));
            const savePostWithTags = () => __awaiter(void 0, void 0, void 0, function* () {
                const items = yield prisma.item.createMany({
                    data: postsFromPocketApi,
                    skipDuplicates: true
                });
                console.log(items);
            });
            savePostWithTags();
            console.log(postsFromPocketApi.length);
            res.send(postsFromPocketApi);
        }));
    });
    getDataFromPocket(pocketConfig.consumerKey, pocketConfig.accessKey);
}));
app.get('/posts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield prisma.item.findMany();
        console.log(data.length);
        res.send(data);
    }
    catch (error) {
        res.send({
            code: 501,
            message: error.message
        });
    }
}));
app.get('/tag', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tag = req.query.tag;
    console.log(tag);
    try {
        const data = yield prisma.item.findMany();
        const searchByTag = (data, tag) => {
            const filteredData = data.filter((item) => {
                return item.tags && item.tags[tag];
            });
            return filteredData;
        };
        const itemsWithTag = searchByTag(data, tag);
        res.send(itemsWithTag);
    }
    catch (error) {
        res.send({
            code: 501,
            message: error.message
        });
    }
}));
app.get('/tags', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield prisma.item.findMany();
        const getAllTags = (data) => {
            console.log(data);
            const tagsSet = new Set();
            for (const item of data) {
                const tags = item.tags;
                if (tags && Object.keys(tags).length > 0) {
                    for (const tagKey in tags) {
                        const tag = tags[tagKey].tag;
                        tagsSet.add(tag);
                    }
                }
            }
            return Array.from(tagsSet);
        };
        const tags = yield getAllTags(data);
        res.send(tags);
    }
    catch (error) {
        res.send({ code: 501, error: error.message });
        console.log(error);
    }
}));
app.get('/delete', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletePosts = () => __awaiter(void 0, void 0, void 0, function* () {
            yield prisma.item.deleteMany();
        });
        deletePosts();
        res.send({ msg: 'Posts and tags deleted successfully' });
    }
    catch (error) {
        res.send({ msg: error.message });
    }
}));
app.listen(3000);
