// Module must be started with parameters
//
//  --accesskey="api.ai client access key"
//  --subscriptionkey="api.ai subscription key"
//  --slackkey="slack bot key"
//

'use strict';

var Botkit = require('botkit');

var apiai = require('apiai');
var uuid = require('node-uuid');
var argv = require('minimist')(process.argv.slice(2));

var apiAiService = apiai(argv.accesskey, argv.subscriptionkey);

var sessionIds = {};

var controller = Botkit.slackbot({
    debug: false
    //include "log: false" to disable logging
});

var bot = controller.spawn({
    token: argv.slackkey
}).startRTM();

controller.hears(['.*'], ['direct_message', 'direct_mention', 'mention', 'ambient'], function (bot, message) {

    console.log(message.text);

    if (message.type == 'message') {
        if (message.user == bot.identity.id) {
            // message from bot can be skipped
        }
        else {
            var requestText = message.text;
            var channel = message.channel;
            var messageType = message.event;

            console.log(messageType);

            if (!(channel in sessionIds)) {
                sessionIds[channel] = uuid.v1();
            }

            var request = apiAiService.textRequest(requestText,
                {
                    sessionId: sessionIds[channel],
                    contexts: [{name: messageType, lifespan: 1}]
                });

            request.on('response', function (response) {
                console.log(response);

                if (response.result) {
                    var responseText = response.result.fulfillment.speech;
                    var action = response.result.action;
                    console.log(action);

                    if (action) {
                        if (messageType == 'ambient')
                        {
                            console.log('ambient, check for action type');

                            if (action.indexOf('smalltalk.') == 0 ||
                                action.indexOf('translate.') == 0 ||
                                action.indexOf('calculator.') == 0) {

                                console.log('action for ambient');

                                if (responseText) {
                                    bot.reply(message, responseText);
                                }
                            }
                        }
                        else
                        {
                            console.log('not ambient, post answer');

                            if (responseText) {
                                bot.reply(message, responseText);
                            }
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