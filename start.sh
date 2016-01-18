#!/usr/bin/env bash

node src/index.js --accesskey="$accesskey" \
                  --subscriptionkey="$subscriptionkey" \
                  --slackkey="$slackkey" \
                  --filterambient="$filterambient"