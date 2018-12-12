FROM node:alpine

WORKDIR /usr/src/vinny

COPY package.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .

ARG COMMIT
ENV COMMIT $COMMIT

CMD ["node", "index.js"]
