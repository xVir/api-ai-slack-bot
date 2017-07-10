// Module must be started with environment variables
//
//  accesskey="api.ai client access key"
//  slackkey="slack bot key"
//

'use strict';

const Botkit = require('botkit');

const apiai = require('apiai');
const uuid = require('node-uuid');

const http = require('http');

const Entities = require('html-entities').XmlEntities;
const decoder = new Entities();

const apiAiAccessToken = process.env.accesstoken;
const slackBotKey = process.env.slackkey;

const devConfig = process.env.DEVELOPMENT_CONFIG == 'true';

const apiaiOptions = {};
if (devConfig) {
    apiaiOptions.hostname = process.env.DEVELOPMENT_HOST;
    apiaiOptions.path = "/api/query";
}

const apiAiService = apiai(apiAiAccessToken, apiaiOptions);

const sessionIds = new Map();

const controller = Botkit.slackbot({
    debug: false
    //include "log: false" to disable logging
});

var bot = controller.spawn({
    token: slackBotKey
}).startRTM();

function isDefined(obj) {
    if (typeof obj == 'undefined') {
        return false;
    }

    if (!obj) {
        return false;
    }

    return obj != null;
}

function messageIsFromThisBot(message) {
    return message.user == bot.identity.id;
}

function messageIsDirectMention(message) {
    return message.text.indexOf("<@U") == 0 && message.text.indexOf(bot.identity.id) == -1;
}

controller.hears(['.*'], ['direct_message', 'direct_mention', 'mention', 'ambient', 'bot_message'], (bot, message) => {
    try {
        if (message.type != 'message') {
            console.log(`(message=${JSON.stringify(message)}): skipping incorrect message type ${message.type}`);
            return;
        }

        if (messageIsFromThisBot(message)) {
            return;
        }

        if (messageIsDirectMention(message)) {
            return;
        }

        let requestText = decoder.decode(message.text);
        requestText = requestText.replace("’", "'");

        let channel = message.channel;
        let messageType = message.event;
        let botId = '<@' + bot.identity.id + '>';
        let userId = message.user;

        console.log(`(message=${JSON.stringify(message)}): processing Slack message`);
        console.log(`(requestText=${requestText}): processing request text`);

        if (requestText.indexOf(botId) > -1) {
            requestText = requestText.replace(botId, '');
        }

        if (!sessionIds.has(channel)) {
            sessionIds.set(channel, uuid.v1());
        }

        let request = apiAiService.textRequest(requestText,
            {
                sessionId: sessionIds.get(channel),
                contexts: [
                    {
                        name: "generic",
                        parameters: {
                            slack_user_id: userId,
                            slack_channel: channel
                        }
                    }
                ]
            });

        request.on('response', (response) => {
            console.log(`(response=${JSON.stringify(response)}: received API.AI response`);

            if (!isDefined(response.result)) {
                console.error('response result was not defined');
                return;
            }

            let responseText = response.result.fulfillment.speech;
            let responseData = response.result.fulfillment.data;
            let action = response.result.action;

            if ((!isDefined(responseData) || !isDefined(responseData.slack)) && isDefined(responseText)) {
                console.error(`(response=${JSON.stringify(response)}): response had no data and slack data but had response text ${responseText}`, err);

                bot.reply(message, responseText, (err, resp) => {
                    if (err) {
                        console.error(`(response=${JSON.stringify(response)}): response had no data and slack data but had response text ${responseText}`, err);

                    }
                });

                return;
            }

            try {
                bot.reply(message, responseData.slack);
                console.log(`(${responseData.slack}): bot replied with message`);
            } catch (err) {
                bot.reply(message, err.message);
                console.error(`(${err.message}): bot replied with error`, err);
            }

        });

        request.on('error', (error) => console.error(error));
        request.end();
    } catch (err) {
        console.error(err);
    }
});


//Create a server to prevent Heroku kills the bot
const server = http.createServer((req, res) => res.end());

//Lets start our server
server.listen((process.env.PORT || 5000), () => console.log("Listening for chats"));
