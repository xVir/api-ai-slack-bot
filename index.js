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

controller.hears(['.*'],['direct_message','direct_mention','mention', 'ambient'], function(bot,message) {

    console.log(message.text);
    //console.log(message);

    if (message.type == "message") {
        if (message.user == bot.identity.id) {
            // message from bot can be skipped
        }
        else {
            // on direct messages we should answer always

            var requestText = message.text;
            var channel = message.channel;

            if (!(channel in sessionIds)) {
                sessionIds[channel] = uuid.v1();
            }

            var request = apiAiService.textRequest(requestText, { sessionId: sessionIds[channel] });

            request.on('response', function (response) {
                console.log(response.status);

                if (response.result) {
                    var responseText = response.result.fulfillment.speech;
                    if (responseText) {
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