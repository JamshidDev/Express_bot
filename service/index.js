const axios = require("axios");
require("dotenv").config();

const BASE_URL = process.env.BASE_URL;
const BOT_TOKEN ='6310622509:AAGsBL3-dfMKjiKzxHtpoWKLzigEMA39X3g' || process.env.BOT_TOKEN;
const DEBUG_API = true;

const instance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000, // 10s timeout qo'shdik
});

instance.interceptors.request.use(function (config) {
    config.headers["Bot-Token"] = BOT_TOKEN;

    // ⏱️ Request vaqtini belgilash
    if (DEBUG_API) {
        config.metadata = { startTime: Date.now() };
    }

    return config;
});

instance.interceptors.response.use(
    (response) => {
        // ✅ Success profiling
        if (DEBUG_API && response.config.metadata) {
            const ms = Date.now() - response.config.metadata.startTime;
            const status = ms > 1000 ? "🔴" : ms > 500 ? "🟡" : "🟢";
            const url = response.config.url;
            const method = response.config.method.toUpperCase();

            console.log(`${status} API [${ms}ms] ${method} ${url}`);

            if (ms > 1000) {
                console.log(`   📦 Response size: ${JSON.stringify(response.data).length} bytes`);
            }
        }

        return response;
    },
    (error) => {
        // ❌ Error profiling
        if (DEBUG_API && error.config?.metadata) {
            const ms = Date.now() - error.config.metadata.startTime;
            const url = error.config?.url || "unknown";

            console.error(`❌ API [${ms}ms] ${url} - ${error.message}`);
        }

        return Promise.reject(error);
    }
);

module.exports = instance;