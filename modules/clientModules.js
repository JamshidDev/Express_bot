const {Composer, Keyboard} = require("grammy")
const {Menu} = require("@grammyjs/menu")
const {I18n} = require("@grammyjs/i18n")
var numeral = require('numeral')
const {
    conversations,
    createConversation,
} = require("@grammyjs/conversations")
const {
    getMonthEv,
    loginUserEv,
    chekUserEv,
    checkSalaryEv,
} = require("../service/services/ApiService")
const repl = require("node:repl")
const channel_id = -1001490133717
const client_bot = new Composer()
const i18n = new I18n({
    defaultLocale: "uz",
    useSession: true,
    directory: "locales",
    globalTranslationContext(ctx) {
        return {first_name: ctx.from?.first_name ?? ""}
    },
})
client_bot.use(i18n)

const pm = client_bot.chatType("private")

const channle_btn = new Menu("channle_btn").url(
    "➕ A'zo bo'lish",
    "https://t.me/Toshkent_MTU"
)
pm.use(channle_btn)

pm.use(conversations())

pm.use(createConversation(salary_show_conversation))
pm.use(createConversation(register_conversations))
pm.use(createConversation(main_menu_conversation))
let loginBtn = new Keyboard()
    .text("🔒 Tizimga kirish")
    .resized()

// conversations

function escapeMarkdownV2(text) {
    return text?.toString().replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&")
}

async function register_conversations(conversation, ctx) {
    await ctx.reply(
        `
    <b>✍️ Passport JSHSHIR raqamingizni kiriting!</b>
    `,
        {
            parse_mode: "HTML",
            reply_markup: {
                remove_keyboard: true,
            },
        }
    )
    ctx = await conversation.wait()
    if (isNaN(ctx.message.text) || ctx.message.text.length !== 14) {
        do {
            await ctx.reply(
                `
<b>⚠️ Noto'g'ri ma'lumot kiritildi</b> 

<i>✍️ Passport JSHSHIR raqamingizni kiriting!</i>
            `,
                {
                    parse_mode: "HTML",
                }
            )
            ctx = await conversation.wait()
        } while (isNaN(ctx.message.text) || ctx.message.text.length !== 14)
    }

    conversation.session.session_db.client.pin = ctx.message.text
    let phone_keyboard = new Keyboard()
        .requestContact("📞 Telefon raqam yuborish")
        .resized()
    await ctx.reply(
        `
    <b>📞 Telefon raqamingizni yuboring!</b>
    `,
        {
            parse_mode: "HTML",
            reply_markup: phone_keyboard,
        }
    )
    ctx = await conversation.wait()
    if (!ctx.message?.contact) {
        do {
            await ctx.reply(
                `
<b>⚠️ Noto'g'ri ma'lumot kiritildi</b> 
            
<i>📞 Telefon raqamingizni yuboring!</i>`,
                {
                    parse_mode: "HTML",
                }
            )
            ctx = await conversation.wait()
        } while (!ctx.message?.contact)
    }
    console.log(ctx.message.contact.phone_number.toString().slice(-9))
    conversation.session.session_db.client.phone = ctx.message.contact.phone_number.toString().slice(-9);

    conversation.session.session_db.client.chat_id = ctx.from.id
    let data = conversation.session.session_db.client

    let [error, resData] = await loginUserEv({data})
    if (resData?.uuid) {
        conversation.session.session_db.isAuth = true
        conversation.session.session_db.uuid = resData.uuid
        console.log(resData)
        return await main_menu_conversation(conversation, ctx)
    } else {
        await ctx.reply('⚠️ Tizimda xodim topilmadi', {
            parse_mode: "HTML",
            reply_markup: loginBtn,
        })
    }


}

async function salary_show_conversation(conversation, ctx) {
    const monthObj = {
        1: "Yanvar",
        2: "Fevral",
        3: "Mart",
        4: "Aprel",
        5: "May",
        6: "Iyun",
        7: "Iyul",
        8: "Avgust",
        9: "Sentyabr",
        10: "Oktyabr",
        11: "Noyabr",
        12: "Dekabr",
    }
    const uuid = conversation.session.session_db.uuid
    console.log('user- '+ uuid)
    const {message_id:msgId} = await ctx.reply(`⏳ Yuklanmoqda...`)
    let [error, month] = await getMonthEv({params: {uuid}})
    await ctx.api.deleteMessage(ctx.from.id, msgId)

    if (!Array.isArray(month) || month.length === 0) {
        await ctx.reply("Ma'lumot yo'q")
        return
    }

    const years = Array.from(new Set(month.map((item) => item.year)))
    const keyboard = new Keyboard()
    years.forEach((year) => {
        keyboard.text(year)
        keyboard.row()
    })
    keyboard.text('🔴 Bekor qilish')
    keyboard.resized()
    await ctx.reply('Yilni tanlang', {
        parse_mode: "HTML",
        reply_markup: keyboard,
    })


    ctx = await conversation.wait()
    const selectedYear = ctx.message.text
    const salaryMonth = month.filter((v) => Number(v.year) === Number(selectedYear))
    const monthKeyboard = new Keyboard()
    salaryMonth.forEach((item, idx) => {
        if (idx % 2 === 0 && idx !== 0) {
            monthKeyboard.row()
        }
        monthKeyboard.text(monthObj[item.month])
    })
    monthKeyboard.row()
    monthKeyboard.text('⬅️ Orqaga')
    await ctx.reply('Oyni tanlang', {
        parse_mode: "HTML",
        reply_markup: monthKeyboard,
    })
    ctx = await conversation.wait()
    const selectedMonth = Object.keys(monthObj).find(k => monthObj[k] === ctx.message.text)
    const {message_id} = await ctx.reply(`⏳ Tekshirilmoqda...`)


    let [_, salaryData] = await checkSalaryEv({
        params: {
            uuid,
            year: selectedYear,
            month: selectedMonth
        }
    })
    await ctx.api.deleteMessage(ctx.from.id, message_id)
    if (!Array.isArray(salaryData) || salaryData.length === 0) {
        await ctx.reply("Ma'lumot yo'q")
        return
    }
    for (const v of salaryData) {

        let inText = ""
        let outText = ""
        let cardMoney = ""

        for (const item of v.in) {
            inText += `\n>🔹${escapeMarkdownV2(item.code)} \\- ${escapeMarkdownV2(item.type)} \\- ${escapeMarkdownV2(item.amount)} so'm`
        }
        inText +=`\n\n>⚡️Jami hisoblandi\\: ${v.in_total} so'm`


        for (const item of v.out) {
            outText += `\n>🔸${escapeMarkdownV2(item.code)} \\- ${escapeMarkdownV2(item.type)} \\- ${escapeMarkdownV2(item.amount)} so'm`
        }
        outText +=`\n\n>⚡️Jami ushlanma\\: ${v.out_total} so'm`

        cardMoney = `\n\n\n\n>💳${v?.in_card?.code} \\: *${escapeMarkdownV2(numeral(v.in_card?.amount).format('0,0'))}* so'm `


        const msgMarkdown2 =
            `
*OYLIK HISOBOT*

👤 Ism: *${escapeMarkdownV2(v.worker?.full_name)}*
💰 Oklad: *${escapeMarkdownV2(numeral(v.worker?.main_salary).format('0,0'))} so'm*
🏅 Lavozim: *${escapeMarkdownV2(v.worker?.position)}* 
🌐 Korxona: *${escapeMarkdownV2(v.worker?.organization)}*

📆 Ish soati: *${escapeMarkdownV2(v.worker?.work_time)} soat*
 ` + '\n *🔹KIRIMLAR🔹*'
            + inText
            + '\n\n *🔸CHIQIMLAR🔸*'
            + outText
            +cardMoney


        await ctx.reply(msgMarkdown2, {
            parse_mode: "MarkdownV2",
            reply_markup: {
                remove_keyboard: true,
            },
        })
    }
    return await main_menu_conversation(conversation, ctx)


}

async function main_menu_conversation(conversation, ctx) {
    let main_menu = new Keyboard()
        .text("💰 Ish haqi ma'lumotlarim")
        .row()
        .text("⚙️ Sozlamalar")
        .text("☎️ Kontaktlar")
        .row()
        .text("ℹ️ Biz haqimizda")
        .text("🚪 Chiqish")
        .resized()

    await ctx.reply("⚡️ Asosiy menu ⚡️", {
        reply_markup: main_menu,
    })
    return
}


pm.command("start", async (ctx) => {
    const isAuth = ctx.session.session_db.isAuth
    if(isAuth) {
        await ctx.conversation.enter("main_menu_conversation")
        return
    }
    let [error, res] = await chekUserEv({
        params: {chat_id: ctx.from.id},
    })
    if (res?.status) {
        ctx.session.session_db.isAuth = true
        await ctx.conversation.enter("main_menu_conversation")
    } else {
        await ctx.reply(
            `
👋 Salom ${ctx.from.first_name}. Oylik maosh botiga xush kelibsiz!    
Tizimga kirish uchun <b>[🔒 Tizimga kirish]</b> tugmasini bosing.`,
            {
                parse_mode: "HTML",
                reply_markup: loginBtn,
            }
        )
    }
})

pm.filter(async (ctx)=>ctx.config.isAuth).hears("💰 Ish haqi ma'lumotlarim", async (ctx) => {
    await ctx.conversation.enter("salary_show_conversation")
})
pm.hears("🔴 Bekor qilish", async (ctx) => {
    await ctx.conversation.enter("main_menu_conversation")
})
pm.hears("🚪 Chiqish", async (ctx) => {
    await ctx.reply(
        `
Tizmdan chiqdindiz!   
Tizimga kirish uchun <b>[🔒 Tizimga kirish]</b> tugmasini bosing.`,
        {
            parse_mode: "HTML",
            reply_markup: loginBtn,
        }
    )
})


pm.hears("⚙️ Sozlamalar", async (ctx) => {
    await ctx.reply("🛠 Bu bo'lim tez orqada ishga tushishi reja qilingan")
})
pm.hears("☎️ Kontaktlar", async (ctx) => {
    await ctx.reply("🛠 Bu bo'lim tez orqada ishga tushishi reja qilingan")
})
pm.hears("ℹ️ Biz haqimizda", async (ctx) => {
    await ctx.reply("🛠 Bu bo'lim tez orqada ishga tushishi reja qilingan")
})
pm.hears("⬅️ Orqaga", async (ctx) => {
    await ctx.conversation.enter("salary_show_conversation")
})
pm.hears("🔒 Tizimga kirish", async (ctx) => {
    await ctx.conversation.enter("register_conversations")
})

module.exports = {client_bot}

