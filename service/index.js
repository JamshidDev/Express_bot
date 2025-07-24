const axios = require("axios");
const customLogger = require("../config/customLogger");

const instance = axios.create({
    baseURL: 'http://192.168.136.78:8004/api'
});

instance.interceptors.request.use(function (config) {
    config.headers['Bot-Token'] = 'test'
    return config;
})

instance.interceptors.response.use(
    response => response,
    error => {
        return Promise.reject(error)
    }
);

module.exports = instance