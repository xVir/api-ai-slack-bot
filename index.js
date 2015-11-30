'use strict';

var SlackBot = require('slackbots');
var apiai = require('apiai');

var apiAiService = apiai("383b9a55088043bd846a321f73882554", "cb9693af-85ce-4fbf-844a-5563722fc27f");

// create a bot
var bot = new SlackBot({
    token: process.argv[2], // Add a bot https://my.slack.com/services/new/bot and put the token
    name: 'apiai'
});


function isDirect(messageData){
    if (messageData.channel) {
        return messageData.channel.indexOf("D") == 0;
    }
    return false;
}

function callApiAi(messageData){
    var requestText = messageData.text;
    if (requestText)
    {
        var channel = messageData.channel;

        var request = apiAiService.textRequest(requestText);
        request.on('response', function(response) {
            console.log(response);

            var responseText = response.result.fulfillment.speech;
            if (responseText)
            {
                bot.postMessage(channel,requestText, {}).then(
                    function(result){
                        console.log("success: " + result);
                    }
                ).fail(
                    function(result){
                        console.log("fail: " + result);
                    }
                );
            }

        });

        request.on('error', function(error) {
            console.log(error);
        });

        request.end();


    }
}

bot.on('start', function() {
    // more information about additional params https://api.slack.com/methods/chat.postMessage
    var params = {

    };

    // define channel, where bot exist. You can adjust it there https://my.slack.com/services
    bot.postMessageToChannel('general', 'Hello from API.AI!', params, function(result) {});

});

bot.on('message', function(data) {
    // all ingoing events https://api.slack.com/rtm

    if (data.type == "message")
    {
        if (data.username == "apiai")
        {
            // message from bot can be skipped
        }
        else
        {
            // on direct messages we should answer always
            if (isDirect(data))
            {
                callApiAi(data);
            }
            else
            {

            }

            console.log(data);
        }

    }

});