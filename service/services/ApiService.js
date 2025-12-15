const axios = require("../index");



const getMonthEv = async (payload) => {
    return await axios.get(`/v1/economist/telegram/months`, { params: payload.params }).then((res) => {
        return [null, res.data?.months]
    }).catch((error) => {
        console.log(payload)
        return [error, null]
    })
}

const loginUserEv = async (payload) => {
    return await axios.post(`/v1/economist/telegram/login`, payload.data).then((res) => {
        return [null, res.data]
    }).catch((error) => {
        return [error, null]
    })
}

const checkSalaryEv = async (payload) => {
    console.log(payload)
    return await axios.get(`/v1/economist/telegram/salary`,{ params: payload.params }).then((res) => {
        return [null, res.data?.salary]
    }).catch((error) => {
        return [error, null]
    })
}

const chekUserEv = async (payload) => {
    return await axios.get(`/v1/economist/telegram/check-user`, {params:payload.params}).then((res) => {
        return [null, res]
    }).catch((error) => {
        return [error, null]
    })
}

const logout_user = async (payload) => {
    return await axios.post(`/api/logout-telegram-user`, payload.data).then((res) => {
        return [null, res.data]
    }).catch((error) => {
        return [error, null]
    })
}




module.exports = { getMonthEv, loginUserEv, checkSalaryEv,chekUserEv, logout_user }