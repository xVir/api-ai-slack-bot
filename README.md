# api-ai-slack-bot
Slack API.AI Integration.

Starting default bot as daemon:
```sh
docker run -d --name slack_bot \
           -e accesskey="api.ai access key" \
           -e subscriptionkey="api.ai subscription key" \
           -e slackkey="slack bot key" \
           xvir/api-ai-slack-bot
```

To start your custom bot, first create directory `src` in you current dir. Then copy the `src/index.js` file there and change it as you wish.

Starting custom bot as daemon:
```sh
docker run -d --name slack_bot \
           -e accesskey="api.ai access key" \
           -e subscriptionkey="api.ai subscription key" \
           -e slackkey="slack bot key" \
           -v /full/path/to/your/src:/usr/app/src \
           xvir/api-ai-slack-bot
```

To start images in interactive mode change `-d` parameter to `-it`