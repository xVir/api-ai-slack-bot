// Module must be started with environment variables
//
//  accesskey="api.ai client access key"
//  subscriptionkey="api.ai subscription key"
//  slackkey="slack bot key"
//

'use strict';

const Botkit = require('botkit');

const apiai = require('apiai');
const uuid = require('node-uuid');

const Entities = require('html-entities').XmlEntities;
const decoder = new Entities();

const apiAiAccessToken = process.env.accesstoken;
const apiAiSubscriptionKey = process.env.subscriptionkey;
const slackBotKey = process.env.slackkey;

const apiAiService = apiai(apiAiAccessToken, apiAiSubscriptionKey);

var sessionIds = {};

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

controller.hears(['.*'], ['direct_message', 'direct_mention', 'mention', 'ambient'], function (bot, message) {

    try {
        if (message.type == 'message') {
            if (message.user == bot.identity.id) {
                // message from bot can be skipped
            }
            else if (message.text.indexOf("<@U") == 0 && message.text.indexOf(bot.identity.id) == -1) {
                // skip other users direct mentions
            }
            else {

                var requestText = decoder.decode(message.text);
                requestText = requestText.replace("’", "'");

                var channel = message.channel;
                var messageType = message.event;
                var botId = "<@" + bot.identity.id + ">";

                console.log(requestText);
                console.log(messageType);

                if (requestText.indexOf(botId) > -1) {
                    requestText = requestText.replace(botId, '');
                }

                if (!(channel in sessionIds)) {
                    sessionIds[channel] = uuid.v1();
                }

                var request = apiAiService.textRequest(requestText,
                    {
                        sessionId: sessionIds[channel]
                    });

                request.on('response', function (response) {
                    console.log(response);

                    if (isDefined(response.result)) {
                        var responseText = response.result.fulfillment.speech;
                        var action = response.result.action;

                        if (isDefined(responseText)) {
                            bot.reply(message, responseText, function(err,resp) {
                                console.log(err,resp);
                            });
                        }

                    }
                });

                request.on('error', function (error) {
                    console.error(error);
                });

                request.end();
            }
        }
    } catch (err) {
        console.error(err);
    }

});