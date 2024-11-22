const axios = require('axios')
const https = require('https')

// At instance level
const AxiosInstance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    })
});


const sendSMS = async (phone, message) => {
    await AxiosInstance.post(
        `${process.env.SMS_HANDLER}?senderhandle=POTSEC
        &recipients=${phone}&msg=${message}
        &accountemail=${process.env.SMS_ACC_EMAIL}
        &accountemailpwd=${process.env.SMS_ACC_PASSWORD}`
    )
}


const checkSMSCredit = async () => {
    const res = await AxiosInstance.get(
        `${process.env.SMS_CREDIT}?tsk=getBalance&eml=${process.env.SMS_ACC_EMAIL}&emlpwd=${process.env.SMS_ACC_PASSWORD}`
    )
    return res
}


module.exports = { sendSMS, checkSMSCredit }

