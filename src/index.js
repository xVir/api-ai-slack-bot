// Module must be started with parameters
//
//  --accesskey="api.ai client access key"
//  --subscriptionkey="api.ai subscription key"
//  --slackkey="slack bot key"
//

'use strict';

const Botkit = require('botkit');

const apiai = require('apiai');
const uuid = require('node-uuid');
const argv = require('minimist')(process.argv.slice(2));

const Entities = require('html-entities').XmlEntities;
const decoder = new Entities();

const apiAiService = apiai(argv.accesskey, argv.subscriptionkey);

var sessionIds = {};

const controller = Botkit.slackbot({
    debug: false
    //include "log: false" to disable logging
});

var bot = controller.spawn({
    token: argv.slackkey
}).startRTM();

function isDefined(obj) {
    if(typeof obj == 'undefined') {
        return false;
    }

    if (!obj) {
        return false;
    }

    return obj != null;
}

controller.hears(['.*'], ['direct_message', 'direct_mention', 'mention', 'ambient'], function (bot, message) {

    console.log(message.text);

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
                        bot.reply(message, responseText);
                    }

                }
            });

            request.on('error', function (error) {
                console.log(error);
            });

            request.end();
        }
    }
});