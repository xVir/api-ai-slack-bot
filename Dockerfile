FROM ubuntu:14.04

MAINTAINER xVir <danil.skachkov@speaktoit.com>

RUN apt-get update && apt-get install -y npm

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . /usr/src/app

RUN npm install
RUN chmod +x start.sh

CMD ["./start.sh"]
