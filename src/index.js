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
            console.log(`(message=${message}): skipping incorrect message type ${message.type}`);
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

        console.log(requestText);
        console.log(messageType);

        if (requestText.indexOf(botId) > -1) {
            requestText = requestText.replace(botId, '');
        }

        if (!sessionIds.has(channel)) {
            sessionIds.set(channel, uuid.v1());
        }

        console.log(`(requestText=${requestText}): handling text`);
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
            console.log(response);

            if (isDefined(response.result)) {
                let responseText = response.result.fulfillment.speech;
                let responseData = response.result.fulfillment.data;
                let action = response.result.action;

                if (isDefined(responseData) && isDefined(responseData.slack)) {
                    try {
                        bot.reply(message, responseData.slack);
                    } catch (err) {
                        bot.reply(message, err.message);
                    }
                } else if (isDefined(responseText)) {
                    bot.reply(message, responseText, (err, resp) => {
                        if (err) {
                            console.error(err);
                        }
                    });
                }

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
