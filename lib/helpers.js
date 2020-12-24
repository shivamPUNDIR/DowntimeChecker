/**
 * Helper functions
 */
// Dependencies
var crypto = require('crypto');
var config = require('./config');
var querystring=require('querystring');
var https=require('https');
//Container
var helpers = {};
//create a SHA256 hash
helpers.hash = (password) => {
    if (typeof (password) == 'string' && password.length > 0) {
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(password).digest('hex');
        return hash;
    } else {
        return false;
    }
};
//Json to object
helpers.parseTsonToObject = (buffer) => {
    try {
        var obj = JSON.parse(buffer);
        return obj;
    } catch (error) {
        return {};
    }
};
//Create random String
helpers.createRandomString = (l) => {
    l = typeof (l) == 'number' && l > 0 ? l : false;
    if (l) {
        return crypto.randomBytes(l).toString('hex').slice(0, l);
    }
    else {
        return false;
    }
};
//Send message to twilio
helpers.sendTwilioSms = (phone, msg, callback) => {
    //validate parameters
    phone = typeof (phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
    msg = typeof (msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1000 ? msg.trim() : false;
    if (phone && msg) {
        //Configure the request payload
        var payload={
            'From':config.twilio.fromPhone,
            'To':'+91'+phone,
            'Body':msg
        }
        //stringify payload
        var stringifyPayload=querystring.stringify(payload);

        //Configure the request details
        var requestDetails={
            'protocol':'https',
            'hostname':'api.twilio.com',
            'method':'POST',
            'path':'',
            'auth':'',
            'headers':{
                'Content-Type':'application/x-www-form-urlencoded',
                'Content-Length':Buffer.byteLength(stringifyPayload);
            }
        }
    } else {
        callback(400, "given parameter were missing or invalid!");
    }
}
//Export the container
module.exports = helpers;
