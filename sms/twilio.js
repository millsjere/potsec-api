const client = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

exports.sendSMS = async (phone, copy) => {
  try {
    await client(accountSid, authToken).messages
      .create({
        body: copy,
        from: '+13148865841',
        to: `+233${phone}`
      })

  } catch (error) {
    console.log(error)
    throw Error('Could not send SMS')
  }

}

