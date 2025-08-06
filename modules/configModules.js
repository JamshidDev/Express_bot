const { Composer, MemorySessionStorage, session } = require("grammy");
const { Menu, MenuRange } = require("@grammyjs/menu");
const { I18n, hears } = require("@grammyjs/i18n");
const {
    conversations,
} = require("@grammyjs/conversations");
const {logout_user  } = require("../service/services/ApiService");
const { chatMembers } = require("@grammyjs/chat-members")
require('dotenv').config()


const config_bot = new Composer();
const CHANNELS_IDS = JSON.parse(process.env.SUBSCRIBES_CHANNELS || "[]")


const adapter = new MemorySessionStorage();

const i18n = new I18n({
    defaultLocale: "uz",
    useSession: true,
    directory: "locales",
    globalTranslationContext(ctx) {
        return { first_name: ctx.from?.first_name ?? "" };
    },
});
config_bot.use(i18n);

config_bot.use(session({
    type: "multi",
    session_db: {
        initial: () => {
            return {
                client: {
                    phone: null,
                    pin: null,
                    chat_id: null,
                },
                salary:{
                    year:null,
                    month:null,
                },
                uuid:null,
                isAuth:false,
                channels:[],
            }
        },
        storage: new MemorySessionStorage(),
    },
    conversation: {},
    __language_code: {},
}));
config_bot.use(chatMembers(adapter));


config_bot.use(conversations());

const subscribeButton = new Menu("subscribeButton")
    .dynamic(async (ctx,range)=>{
        let list = await ctx.session.session_db.channels
        list.forEach((item)=>{
            range
                .url("➕ Obuna bo'lish", item.type ==='channel'? `https://t.me/${item.link}` : item.link)
                .row()
        })
    })

config_bot.use(subscribeButton)

config_bot.on("my_chat_member", async (ctx) => {
    if (ctx.update.my_chat_member.new_chat_member.status == "kicked") {
        const stats = await ctx.conversation.active();
        for (let key of Object.keys(stats)) {
            await ctx.conversation.exit(key);
        }
        await logout_user({data:{
            chat_id:ctx.from.id,
        }})
    }

})
config_bot.use(async (ctx, next) => {
    let permissions = ['🔴 Bekor qilish', '⬅️ Orqaga', '/start', '🚪 Chiqish']
    if (permissions.includes(ctx.message?.text)) {
        const stats = await ctx.conversation.active();
        for (let key of Object.keys(stats)) {
            await ctx.conversation.exit(key);
        }
    }
    ctx.config = {
        is_admin: true
    }
    await next()
})

config_bot.use(async (ctx, next)=>{
    if(Array.isArray(CHANNELS_IDS) && CHANNELS_IDS.length === 0){
        await next()
    }


    let subscribeStatus = false
    ctx.session.session_db.channels = []
    if(Array.isArray(CHANNELS_IDS) && CHANNELS_IDS.length > 0){
        for(const channel of CHANNELS_IDS){
            const chatMembers = await ctx.chatMembers.getChatMember(channel.id, ctx.from.id)
            if(chatMembers.status === 'left'){
                subscribeStatus = true
                ctx.session.session_db.channels.push({
                    link:channel.link,
                    type:'channel'
                })
            }
        }


        if(subscribeStatus){
            await ctx.api.sendMessage(ctx.from.id,`
<i>🙅‍♂️ Kechirasiz <a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a> botimizdan foydalanish uchun ushbu kanallarga a'zo bo'lishingiz shart!</i>

<i>🔹Keyin qayta /start buyrug'ini yuboring botga</i>
        `, {
                reply_markup:subscribeButton,
                parse_mode:"HTML"
            })

        }else{
            await next()
        }
    }
})


























module.exports = {config_bot}