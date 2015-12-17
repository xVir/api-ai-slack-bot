// Module must be started with parameters
//
//  --accesskey="api.ai client access key"
//  --subscriptionkey="api.ai subscription key"
//  --slackkey="slack bot key"


'use strict';

var SlackBot = require('slackbots');
var apiai = require('apiai');
var uuid = require('node-uuid');
var argv = require('minimist')(process.argv.slice(2));

var apiAiService = apiai(argv.accesskey, argv.subscriptionkey);

var BOT_NAME = "SlackNanny";
var botSlackId;

var sessionIds = {};

// create a bot
var bot = new SlackBot({
    token: argv.slackkey, // Add a bot https://my.slack.com/services/new/bot and put the token
    name: BOT_NAME
});


function isDirect(messageData) {
    if (messageData.channel) {
        return messageData.channel.indexOf("D") == 0;
    }
    return false;
}

function answerInDirect(messageData) {
    var requestText = messageData.text;
    if (requestText) {
        var channel = messageData.channel;

        if (!(channel in sessionIds)) {
            sessionIds[channel] = uuid.v1();
        }

        var request = apiAiService.textRequest(requestText, {sessionId: sessionIds[channel]});

        request.on('response', function (response) {
            console.log(response);

            var responseText = response.result.fulfillment.speech;
            if (responseText) {
                bot.postMessage(channel, responseText, {}).then(
                    function (result) {
                        console.log("success: " + result);
                    }
                ).fail(
                    function (result) {
                        console.log("fail: " + result);
                    }
                );
            }

        });

        request.on('error', function (error) {
            console.log(error);
        });

        request.end();

    }
}

function answerInChannel(messageData) {
    var requestText = messageData.text;
    var channel = messageData.channel;

    if (!(channel in sessionIds)) {
        sessionIds[channel] = uuid.v1();
    }

    var request = apiAiService.textRequest(requestText, {sessionId: sessionIds[channel]});
    request.on('response', function (response) {
        console.log(response);

        var responseText = response.result.fulfillment.speech;
        if (responseText) {
            bot.postMessage(channel, responseText, {}).then(
                function (result) {
                    console.log("success: " + result);
                }
            ).fail(
                function (result) {
                    console.log("fail: " + result);
                }
            );
        }
    });

    request.on('error', function (error) {
        console.log(error);
    });

    request.end();


}

bot.on('start', function () {

    // more information about additional params https://api.slack.com/methods/chat.postMessage
    var params = {};

    bot.getUser(BOT_NAME).then(function (data) {
        console.log(data);

        botSlackId = data.id;
    });

    // define channel, where bot exist. You can adjust it there https://my.slack.com/services
    bot.postMessageToChannel('test-bot', 'Hello from API.AI!', params, function (result) {
    });
});

bot.on('message', function (data) {
    // all ingoing events https://api.slack.com/rtm

    if (data.type == "message") {
        if (data.username == BOT_NAME) {
            // message from bot can be skipped
        }
        else {
            // on direct messages we should answer always
            if (isDirect(data)) {
                answerInDirect(data);
            }
            else {
                answerInChannel(data);
            }

            console.log(data);
        }

    }

});