FROM node:10-alpine

WORKDIR /usr/src/vinny

COPY package.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .

CMD ["node", "index.js"]
