'use strict';

var SlackBot = require('slackbots');

// create a bot
var bot = new SlackBot({
    token: process.argv[2], // Add a bot https://my.slack.com/services/new/bot and put the token
    name: 'apiai'
});

function isDirect(messageData){
    if (messageData.channel) {
        if (messageData.channel.indexOf("D") == 0){
            return true;
        }
        return false;
    }
    return false;
}

bot.on('start', function() {
    // more information about additional params https://api.slack.com/methods/chat.postMessage
    var params = {

    };

    // define channel, where bot exist. You can adjust it there https://my.slack.com/services
    bot.postMessageToChannel('general', 'Hello from API.AI!', params);

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
            if (isDirect(data))
            {
                var requestText = data.text;
                if (requestText)
                {

                }
            }
            else
            {

            }

            console.log(data);
        }

    }

});