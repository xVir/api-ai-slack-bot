// Module must be started with parameters
//
//  --accesskey="api.ai client access key"
//  --subscriptionkey="api.ai subscription key"
//  --slackkey="slack bot key"
//  --filterambient="true or false to filter ambient messages processing (not all)"
//

'use strict';

var Botkit = require('botkit');

var apiai = require('apiai');
var uuid = require('node-uuid');
var argv = require('minimist')(process.argv.slice(2));

var Entities = require('html-entities').XmlEntities;
var decoder = new Entities();

var apiAiService = apiai(argv.accesskey, argv.subscriptionkey);
var filterAmbient = (argv.filterambient === 'true');

var sessionIds = {};

var controller = Botkit.slackbot({
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
        else if (message.text.indexOf("<@U") == 0) {
            // skip other users direct mentions
        }
        else {
            var requestText = decoder.decode(message.text);

            var channel = message.channel;
            var messageType = message.event;

            console.log(messageType);

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
                    var actionIncomplete = response.result.actionIncomplete;

                    console.log("a: " + action + " incomplete: " + actionIncomplete);

                    if (messageType == 'ambient' && filterAmbient) {
                        console.log('ambient, check for action type');

                        if (isDefined(action) &&
                            action.indexOf('smalltalk.') == 0 ||
                            action.indexOf('translate.') == 0 ||
                            action.indexOf('wisdom.') == 0 ||
                            action.indexOf('entertainment.') == 0 ||
                            action.indexOf('weather.') == 0) {

                            console.log('action for ambient');

                            if (isDefined(responseText)) {
                                bot.reply(message, responseText);
                            }
                        }
                    }
                    else {
                        console.log('not ambient, post answer');

                        if (isDefined(responseText)) {
                            bot.reply(message, responseText);
                        }
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