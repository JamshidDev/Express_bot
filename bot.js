const { Bot, session, MemorySessionStorage, Keyboard, InlineKeyboard, InputFile, InputMediaDocument, InputMediaBuilder } = require("grammy");
const { Menu, MenuRange } = require("@grammyjs/menu");
require('dotenv').config()
const customLogger = require("./config/customLogger");
const { get_organizations, chek_user, chek_user_salary, chek_register_user } = require("./service/services/ApiService");

const { client_bot } = require("./modules/clientModules");
const { config_bot } = require("./modules/configModules")

const bot_token = process.env.BOT_TOKEN;







const bot = new Bot(bot_token);

bot.use(config_bot)

bot.use(client_bot)

bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${JSON.stringify(ctx.update)}`);
    const message = err.error;
    console.log(message)
    customLogger.log({
        level: 'error',
        message: message
    });
});



bot.start({
    allowed_updates: ["my_chat_member", "chat_member", "message", "callback_query", "inline_query"],
    drop_pending_updates: true,
})