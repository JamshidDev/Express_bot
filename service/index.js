const axios = require("axios");
const customLogger = require("../config/customLogger");
require('dotenv').config()

const BASE_URL = process.env.BASE_URL;
const BOT_TOKEN = process.env.BOT_TOKEN;
const instance = axios.create({
    baseURL: BASE_URL,
});

instance.interceptors.request.use(function (config) {
    config.headers['Bot-Token'] = BOT_TOKEN
    return config;
})

instance.interceptors.response.use(
    response => response,
    error => {
        return Promise.reject(error)
    }
);

module.exports = instance