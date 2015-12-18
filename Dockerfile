FROM node:5.3.0

MAINTAINER xVir <danil.skachkov@speaktoit.com>

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . /usr/src/app

RUN npm install
RUN chmod +x start.sh

CMD ["./start.sh"]
