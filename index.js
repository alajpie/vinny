require("dotenv").config();
const Discord = require("discord.js");
const superb = require("superb");
const uniqueRandomArray = require("unique-random-array");
const fullwidth = require("fullwidth").default;
const request = require("superagent");
const moment = require("moment-timezone");
const Twitter = require("twitter");
const bluebird = require("bluebird");
const shellExec = require("shell-exec");
const lock = new (require("async-lock"))();
const rss = new (require("rss-parser"))();

const redis = require("redis");
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const rclient = redis.createClient();

const dclient = new Discord.Client();
const tclient = new Twitter({
  consumer_key: process.env.VINNY_TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.VINNY_TWITTER_CONSUMER_SECRET,
  // access_token_key: process.env.VINNY_TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.VINNY_TWITTER_ACCESS_TOKEN_SECRET
});

const emojiRegex = /\u{1F3F4}(?:\u{E0067}\u{E0062}(?:\u{E0065}\u{E006E}\u{E0067}|\u{E0077}\u{E006C}\u{E0073}|\u{E0073}\u{E0063}\u{E0074})\u{E007F}|\u200D\u2620\uFE0F)|\u{1F469}\u200D\u{1F469}\u200D(?:\u{1F466}\u200D\u{1F466}|\u{1F467}\u200D[\u{1F466}\u{1F467}])|\u{1F468}(?:\u200D(?:\u2764\uFE0F\u200D(?:\u{1F48B}\u200D)?\u{1F468}|[\u{1F468}\u{1F469}]\u200D(?:\u{1F466}\u200D\u{1F466}|\u{1F467}\u200D[\u{1F466}\u{1F467}])|\u{1F466}\u200D\u{1F466}|\u{1F467}\u200D[\u{1F466}\u{1F467}]|[\u{1F33E}\u{1F373}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9B0}-\u{1F9B3}])|[\u{1F3FB}-\u{1F3FF}]\u200D[\u{1F33E}\u{1F373}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9B0}-\u{1F9B3}])|\u{1F469}\u200D(?:\u2764\uFE0F\u200D(?:\u{1F48B}\u200D[\u{1F468}\u{1F469}]|[\u{1F468}\u{1F469}])|[\u{1F33E}\u{1F373}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9B0}-\u{1F9B3}])|\u{1F469}\u200D\u{1F466}\u200D\u{1F466}|(?:\u{1F441}\uFE0F\u200D\u{1F5E8}|\u{1F469}[\u{1F3FB}-\u{1F3FF}]\u200D[\u2695\u2696\u2708]|\u{1F468}(?:[\u{1F3FB}-\u{1F3FF}]\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|(?:[\u26F9\u{1F3CB}\u{1F3CC}\u{1F575}]\uFE0F|[\u{1F46F}\u{1F93C}\u{1F9DE}\u{1F9DF}])\u200D[\u2640\u2642]|[\u26F9\u{1F3CB}\u{1F3CC}\u{1F575}][\u{1F3FB}-\u{1F3FF}]\u200D[\u2640\u2642]|[\u{1F3C3}\u{1F3C4}\u{1F3CA}\u{1F46E}\u{1F471}\u{1F473}\u{1F477}\u{1F481}\u{1F482}\u{1F486}\u{1F487}\u{1F645}-\u{1F647}\u{1F64B}\u{1F64D}\u{1F64E}\u{1F6A3}\u{1F6B4}-\u{1F6B6}\u{1F926}\u{1F937}-\u{1F939}\u{1F93D}\u{1F93E}\u{1F9B8}\u{1F9B9}\u{1F9D6}-\u{1F9DD}](?:[\u{1F3FB}-\u{1F3FF}]\u200D[\u2640\u2642]|\u200D[\u2640\u2642])|\u{1F469}\u200D[\u2695\u2696\u2708])\uFE0F|\u{1F469}\u200D\u{1F467}\u200D[\u{1F466}\u{1F467}]|\u{1F469}\u200D\u{1F469}\u200D[\u{1F466}\u{1F467}]|\u{1F468}(?:\u200D(?:[\u{1F468}\u{1F469}]\u200D[\u{1F466}\u{1F467}]|[\u{1F466}\u{1F467}])|[\u{1F3FB}-\u{1F3FF}])|\u{1F3F3}\uFE0F\u200D\u{1F308}|\u{1F469}\u200D\u{1F467}|\u{1F469}[\u{1F3FB}-\u{1F3FF}]\u200D[\u{1F33E}\u{1F373}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9B0}-\u{1F9B3}]|\u{1F469}\u200D\u{1F466}|\u{1F1F6}\u{1F1E6}|\u{1F1FD}\u{1F1F0}|\u{1F1F4}\u{1F1F2}|\u{1F469}[\u{1F3FB}-\u{1F3FF}]|\u{1F1ED}[\u{1F1F0}\u{1F1F2}\u{1F1F3}\u{1F1F7}\u{1F1F9}\u{1F1FA}]|\u{1F1EC}[\u{1F1E6}\u{1F1E7}\u{1F1E9}-\u{1F1EE}\u{1F1F1}-\u{1F1F3}\u{1F1F5}-\u{1F1FA}\u{1F1FC}\u{1F1FE}]|\u{1F1EA}[\u{1F1E6}\u{1F1E8}\u{1F1EA}\u{1F1EC}\u{1F1ED}\u{1F1F7}-\u{1F1FA}]|\u{1F1E8}[\u{1F1E6}\u{1F1E8}\u{1F1E9}\u{1F1EB}-\u{1F1EE}\u{1F1F0}-\u{1F1F5}\u{1F1F7}\u{1F1FA}-\u{1F1FF}]|\u{1F1F2}[\u{1F1E6}\u{1F1E8}-\u{1F1ED}\u{1F1F0}-\u{1F1FF}]|\u{1F1F3}[\u{1F1E6}\u{1F1E8}\u{1F1EA}-\u{1F1EC}\u{1F1EE}\u{1F1F1}\u{1F1F4}\u{1F1F5}\u{1F1F7}\u{1F1FA}\u{1F1FF}]|\u{1F1FC}[\u{1F1EB}\u{1F1F8}]|\u{1F1FA}[\u{1F1E6}\u{1F1EC}\u{1F1F2}\u{1F1F3}\u{1F1F8}\u{1F1FE}\u{1F1FF}]|\u{1F1F0}[\u{1F1EA}\u{1F1EC}-\u{1F1EE}\u{1F1F2}\u{1F1F3}\u{1F1F5}\u{1F1F7}\u{1F1FC}\u{1F1FE}\u{1F1FF}]|\u{1F1EF}[\u{1F1EA}\u{1F1F2}\u{1F1F4}\u{1F1F5}]|\u{1F1F8}[\u{1F1E6}-\u{1F1EA}\u{1F1EC}-\u{1F1F4}\u{1F1F7}-\u{1F1F9}\u{1F1FB}\u{1F1FD}-\u{1F1FF}]|\u{1F1EE}[\u{1F1E8}-\u{1F1EA}\u{1F1F1}-\u{1F1F4}\u{1F1F6}-\u{1F1F9}]|\u{1F1FF}[\u{1F1E6}\u{1F1F2}\u{1F1FC}]|\u{1F1EB}[\u{1F1EE}-\u{1F1F0}\u{1F1F2}\u{1F1F4}\u{1F1F7}]|\u{1F1F5}[\u{1F1E6}\u{1F1EA}-\u{1F1ED}\u{1F1F0}-\u{1F1F3}\u{1F1F7}-\u{1F1F9}\u{1F1FC}\u{1F1FE}]|\u{1F1E9}[\u{1F1EA}\u{1F1EC}\u{1F1EF}\u{1F1F0}\u{1F1F2}\u{1F1F4}\u{1F1FF}]|\u{1F1F9}[\u{1F1E6}\u{1F1E8}\u{1F1E9}\u{1F1EB}-\u{1F1ED}\u{1F1EF}-\u{1F1F4}\u{1F1F7}\u{1F1F9}\u{1F1FB}\u{1F1FC}\u{1F1FF}]|\u{1F1E7}[\u{1F1E6}\u{1F1E7}\u{1F1E9}-\u{1F1EF}\u{1F1F1}-\u{1F1F4}\u{1F1F6}-\u{1F1F9}\u{1F1FB}\u{1F1FC}\u{1F1FE}\u{1F1FF}]|[#\*0-9]\uFE0F\u20E3|\u{1F1F1}[\u{1F1E6}-\u{1F1E8}\u{1F1EE}\u{1F1F0}\u{1F1F7}-\u{1F1FB}\u{1F1FE}]|\u{1F1E6}[\u{1F1E8}-\u{1F1EC}\u{1F1EE}\u{1F1F1}\u{1F1F2}\u{1F1F4}\u{1F1F6}-\u{1F1FA}\u{1F1FC}\u{1F1FD}\u{1F1FF}]|\u{1F1F7}[\u{1F1EA}\u{1F1F4}\u{1F1F8}\u{1F1FA}\u{1F1FC}]|\u{1F1FB}[\u{1F1E6}\u{1F1E8}\u{1F1EA}\u{1F1EC}\u{1F1EE}\u{1F1F3}\u{1F1FA}]|\u{1F1FE}[\u{1F1EA}\u{1F1F9}]|[\u{1F3C3}\u{1F3C4}\u{1F3CA}\u{1F46E}\u{1F471}\u{1F473}\u{1F477}\u{1F481}\u{1F482}\u{1F486}\u{1F487}\u{1F645}-\u{1F647}\u{1F64B}\u{1F64D}\u{1F64E}\u{1F6A3}\u{1F6B4}-\u{1F6B6}\u{1F926}\u{1F937}-\u{1F939}\u{1F93D}\u{1F93E}\u{1F9B8}\u{1F9B9}\u{1F9D6}-\u{1F9DD}][\u{1F3FB}-\u{1F3FF}]|[\u26F9\u{1F3CB}\u{1F3CC}\u{1F575}][\u{1F3FB}-\u{1F3FF}]|[\u261D\u270A-\u270D\u{1F385}\u{1F3C2}\u{1F3C7}\u{1F442}\u{1F443}\u{1F446}-\u{1F450}\u{1F466}\u{1F467}\u{1F470}\u{1F472}\u{1F474}-\u{1F476}\u{1F478}\u{1F47C}\u{1F483}\u{1F485}\u{1F4AA}\u{1F574}\u{1F57A}\u{1F590}\u{1F595}\u{1F596}\u{1F64C}\u{1F64F}\u{1F6C0}\u{1F6CC}\u{1F918}-\u{1F91C}\u{1F91E}\u{1F91F}\u{1F930}-\u{1F936}\u{1F9B5}\u{1F9B6}\u{1F9D1}-\u{1F9D5}][\u{1F3FB}-\u{1F3FF}]|[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55\u{1F004}\u{1F0CF}\u{1F18E}\u{1F191}-\u{1F19A}\u{1F1E6}-\u{1F1FF}\u{1F201}\u{1F21A}\u{1F22F}\u{1F232}-\u{1F236}\u{1F238}-\u{1F23A}\u{1F250}\u{1F251}\u{1F300}-\u{1F320}\u{1F32D}-\u{1F335}\u{1F337}-\u{1F37C}\u{1F37E}-\u{1F393}\u{1F3A0}-\u{1F3CA}\u{1F3CF}-\u{1F3D3}\u{1F3E0}-\u{1F3F0}\u{1F3F4}\u{1F3F8}-\u{1F43E}\u{1F440}\u{1F442}-\u{1F4FC}\u{1F4FF}-\u{1F53D}\u{1F54B}-\u{1F54E}\u{1F550}-\u{1F567}\u{1F57A}\u{1F595}\u{1F596}\u{1F5A4}\u{1F5FB}-\u{1F64F}\u{1F680}-\u{1F6C5}\u{1F6CC}\u{1F6D0}-\u{1F6D2}\u{1F6EB}\u{1F6EC}\u{1F6F4}-\u{1F6F9}\u{1F910}-\u{1F93A}\u{1F93C}-\u{1F93E}\u{1F940}-\u{1F945}\u{1F947}-\u{1F970}\u{1F973}-\u{1F976}\u{1F97A}\u{1F97C}-\u{1F9A2}\u{1F9B0}-\u{1F9B9}\u{1F9C0}-\u{1F9C2}\u{1F9D0}-\u{1F9FF}]|[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299\u{1F004}\u{1F0CF}\u{1F170}\u{1F171}\u{1F17E}\u{1F17F}\u{1F18E}\u{1F191}-\u{1F19A}\u{1F1E6}-\u{1F1FF}\u{1F201}\u{1F202}\u{1F21A}\u{1F22F}\u{1F232}-\u{1F23A}\u{1F250}\u{1F251}\u{1F300}-\u{1F321}\u{1F324}-\u{1F393}\u{1F396}\u{1F397}\u{1F399}-\u{1F39B}\u{1F39E}-\u{1F3F0}\u{1F3F3}-\u{1F3F5}\u{1F3F7}-\u{1F4FD}\u{1F4FF}-\u{1F53D}\u{1F549}-\u{1F54E}\u{1F550}-\u{1F567}\u{1F56F}\u{1F570}\u{1F573}-\u{1F57A}\u{1F587}\u{1F58A}-\u{1F58D}\u{1F590}\u{1F595}\u{1F596}\u{1F5A4}\u{1F5A5}\u{1F5A8}\u{1F5B1}\u{1F5B2}\u{1F5BC}\u{1F5C2}-\u{1F5C4}\u{1F5D1}-\u{1F5D3}\u{1F5DC}-\u{1F5DE}\u{1F5E1}\u{1F5E3}\u{1F5E8}\u{1F5EF}\u{1F5F3}\u{1F5FA}-\u{1F64F}\u{1F680}-\u{1F6C5}\u{1F6CB}-\u{1F6D2}\u{1F6E0}-\u{1F6E5}\u{1F6E9}\u{1F6EB}\u{1F6EC}\u{1F6F0}\u{1F6F3}-\u{1F6F9}\u{1F910}-\u{1F93A}\u{1F93C}-\u{1F93E}\u{1F940}-\u{1F945}\u{1F947}-\u{1F970}\u{1F973}-\u{1F976}\u{1F97A}\u{1F97C}-\u{1F9A2}\u{1F9B0}-\u{1F9B9}\u{1F9C0}-\u{1F9C2}\u{1F9D0}-\u{1F9FF}]\uFE0F|[\u261D\u26F9\u270A-\u270D\u{1F385}\u{1F3C2}-\u{1F3C4}\u{1F3C7}\u{1F3CA}-\u{1F3CC}\u{1F442}\u{1F443}\u{1F446}-\u{1F450}\u{1F466}-\u{1F469}\u{1F46E}\u{1F470}-\u{1F478}\u{1F47C}\u{1F481}-\u{1F483}\u{1F485}-\u{1F487}\u{1F4AA}\u{1F574}\u{1F575}\u{1F57A}\u{1F590}\u{1F595}\u{1F596}\u{1F645}-\u{1F647}\u{1F64B}-\u{1F64F}\u{1F6A3}\u{1F6B4}-\u{1F6B6}\u{1F6C0}\u{1F6CC}\u{1F918}-\u{1F91C}\u{1F91E}\u{1F91F}\u{1F926}\u{1F930}-\u{1F939}\u{1F93D}\u{1F93E}\u{1F9B5}\u{1F9B6}\u{1F9B8}\u{1F9B9}\u{1F9D1}-\u{1F9DD}]/gu;

dclient.on("ready", () => {
  console.log(`Logged in as ${dclient.user.tag}!`);
  dclient.user.setPresence({
    game: {
      name: "the world crumble around us",
      type: "WATCHING"
    }
  });
  // process.on("unhandledRejection", e => {
  //     dclient.channels
  //         .get("499351756606668801") // #bot-testing-chamber
  //         .send(e.stack + " <@144880429533626368>"); // @Marble#2132
  // });
  const tzt = () => {
    // timezone timer
    timezoneUpdate();
    setTimeout(tzt, 60000 - (new Date() % 60000));
  };
  tzt();
  setInterval(() => {
    // youtube timer
    channels.forEach(checkChannel);
  }, 5 * 60 * 1000);
  setInterval(() => {
    // maintenance timer
    lockedCheck(false);
  }, 10 * 1000);
  rclient.getAsync("1mph-persistent").then(x => {
    if (x !== dclient.channels.get(onemphChannel).lastMessageID) {
      lockedCheck(true);
    }
    dclient.channels.get("499351756606668801").startTyping(); // #bot-testing-chamber
  });
});

dclient.on("error", () => {
  dclient.channels
    .get("472118062825472011") // #dept-of-bot-affairs
    .send("Discord made a fucky wucky and disconnected me >:(");
});

const r5kChannel = "491313270939058176";
const onemphChannel = "498564815384739864";
const tzdataChannel = "504953120988856330";
const emojiChannel = "505844487642284044";

const tzdata = {
  "144880429533626368": "Europe/Warsaw",
  "174183329308999681": "Europe/Riga",
  "379107526278381589": "America/Denver",
  "315801718975889410": "Europe/London",
  "358050835533660161": "America/New_York",
  "331850934277767178": "America/New_York",
  "219242476152553472": "America/Los_Angeles",
  "163150738808111108": "America/Chicago"
};

const channels = [
  "UCJ6o36XL0CpYb6U5dNBiXHQ", // Shaun
  "UClt01z1wHHT7c5lKcU8pxRQ", // hbomberguy
  "UCNvsIonJdJ5E4EXMa65VYpA", // ContraPoints
  "UC2PA-AKmVpU6NKCGtZq_rKQ", // Philosophy Tube
  "UCSdma21fnJzgmPodhC9SJ3g", // NakeyJakey
  "UCM0V8r4kuIWIl6Sy-NHj2lg", // Quinton Reviews
  "UCFEmOPY04flXH-QpMMAGeJA", // BadMouseProductions
  "UC18ju52OET36bdewLRHzPdQ", // brutalmoose
  "UC7-E5xhZBZdW-8d7V80mzfg", // Jenny Nicholson
  // "UCT5jxI_OYY2r--TjAGXD03A", // Peter Coffin
  "UCG1h-Wqjtwz7uUANw6gazRw", // Lindsay Ellis
  "UCOjLfFE0TABS9bk05oH-kgw", // Eric Taxxon
  "UCEOXxzW2vU0P-0THehuIIeg", // Captain Disillusion
  "UC5fdssPqmmGhkhsJi4VcckA", // Innuendo Studios
  "UCrd-uibzFaauNlPB8-OJ_qQ", // Maria the Witch
  "UCaN8DZdc8EHo5y1LsQWMiig", // Big Joel
  "UCCT8a7d6S6RJUivBgNRsiYg", // Three Arrows
  "UCw-4391y4Lm0LZz2Z6pau9Q", // Thom Avella
  "UCyNtlmLB73-7gtlBz00XOQQ", // Folding Ideas
  "UCBa659QWEk1AI4Tg--mrJ2A", // Tom Scott
  "UC8XjmAEDVZSCQjI150cb4QA", // Knowing Better
  "UCsXVk37bltHxD1rDPwtNM8Q" // Kurzgesagt
]; // hug!

async function checkChannel(id) {
  const feed = await rss.parseURL(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`
  );
  const key = `youtube/${feed.title}`;
  const size = await rclient.scardAsync(key);
  if (size === 0) {
    rclient.sadd(key, feed.items[0].link);
    return;
  }
  for (let i = 0; ; i++) {
    let seen = await rclient.sismemberAsync(key, feed.items[i].link);
    if (seen) {
      break;
    }
    dclient.channels
      .get("487747607704240139") // #auto-yt
      .send(
        `New video from ${feed.title}! <@&491208696077090876>\n${
          // @auto-yt
          feed.items[i].link
        }`
      );
    rclient.sadd(key, feed.items[i].link);
  }
}

async function lockedCheck(refresh) {
  const keysPromise = rclient.keysAsync("1mph-lock/*");
  const persistentPromise = rclient.getAsync("1mph-persistent");
  const keys = await keysPromise;
  const lockedoutPromise = Promise.all(
    keys.map(async x => {
      const ttl = await rclient.pttlAsync(x);
      const u = dclient.users.get(x.substr(10));
      return `${u.tag} (${Math.ceil(ttl / (60 * 1000))} min)`;
    })
  );
  let persistent = undefined;
  try {
    persistent = await persistentPromise;
    persistent = await dclient.channels
      .get(onemphChannel)
      .fetchMessage(persistent);
  } catch (e) {
    persistent = null;
  }
  const lockedout = await lockedoutPromise;
  if (persistent && !refresh) {
    persistent.edit(`Locked out users: ${lockedout.join(", ") || "none!"}`);
  } else {
    if (persistent && refresh) {
      persistent.delete();
      await rclient.delAsync("1mph-persistent");
    }
    persistent = await dclient.channels
      .get(onemphChannel)
      .send(`Locked out users: ${lockedout.join(", ") || "none!"}`);
    rclient.set("1mph-persistent", persistent.id);
  }
}

async function timezoneUpdate() {
  let out =
    "Timezones! Message <@144880429533626368> with what this page: <https://jsfiddle.net/d708xu4e> says to add yourself!"; // @Marble#2132
  const tzdataProcessed = [];
  Object.keys(tzdata).forEach(x => {
    let offset = moment.tz.zone(tzdata[x]).utcOffset(moment()) / -60;
    offset = offset > 0 ? "+" + offset : offset;
    offset = offset == 0 ? " 0" : offset;
    const time = moment()
      .tz(tzdata[x])
      .format("HH:mm");
    tzdataProcessed.push([time, offset, x]);
  });
  tzdataProcessed.sort((a, b) => a[1] - b[1]);
  tzdataProcessed.forEach(x => {
    out += `\n\`${x[0]} (${x[1]})\` <@${x[2]}>`;
  });
  const chan = dclient.channels.get(tzdataChannel);
  (await chan.fetchMessage(chan.lastMessageID)).edit(out);
}

dclient.on("messageUpdate", (prev, next) => {
  if (next.author === dclient.user) return;
  if (
    (next.channel === dclient.channels.get(r5kChannel) ||
      next.channel === dclient.channels.get(onemphChannel) ||
      next.channel === dclient.channels.get(emojiChannel)) &&
    prev.content !== next.content
  ) {
    next.delete(500);
  }
});

dclient.on("guildMemberUpdate", (prev, next) => {
  if (
    next.guild.id === "472079800744411136" && // LGG
    next.roles.has("499907364485464074") && // @nick-museum
    prev.nickname !== next.nickname
  ) {
    dclient.channels
      .get("498572261746278441") // #nick-museum
      .send(`${next.user.tag}: ${next.nickname}`);
  }
});

dclient.on("message", msg => {
  if (msg.content.includes(";ignore")) {
    return;
  }
  if (msg.content.includes(";del")) {
    msg.content = msg.content.replace(/( ?;del|;del ?|;del)/g, "");
    msg.delete(500);
  }
  if (msg.content.includes(";time")) {
    msg.content = msg.content.replace(/( ?;time|;time ?|;time)/g, "");
    const t1 = process.hrtime();
    parse(msg);
    const t2 = process.hrtime(t1);
    msg.channel.send(
      `Processing took ${Math.round((t2[1] / 1e6) * 100) / 100}ms`
    );
  } else {
    parse(msg);
  }
});

function parse(msg) {
  if (msg.author === dclient.user) return;
  const m = msg.content.toLowerCase();
  if (msg.author === dclient.users.get("144880429533626368")) {
    // Marble#2132
    let match = msg.content.match(/;sh (.*)/i);
    if (match) {
      const exec = require("child_process").exec;
      exec(match[1], { shell: "/bin/zsh" }, (_, out) => {
        msg.channel.send(out).catch(() => {});
      });
    }
    match = msg.content.match(/;s (.*)/i);
    if (match) {
      msg.delete(500);
      msg.channel.send(match[1]);
    }
    if (m.includes(";test")) {
    }
  }
  if (msg.guild && msg.guild.id === "498598527572770816") {
    // Vinny staging
  } else if (msg.guild && msg.guild.id === "472079800744411136") {
    // LGG
    let match = m.match(
      /(\bfag|\bretard|nigger|tranny|\bchink|wetback|kike|kulak|pollack|stinky)/
    );
    if (match) {
      msg.reply(
        "you used a word that's on our blocklist. This incident has been reported."
      );
      if (match[1] !== "stinky") {
        dclient.channels
          .get("481658230049603604") // #mod-lounge
          .send(
            `${msg.author.tag} said: \`${msg.content}\` in #${
              msg.channel.name
            } <@&472080504460541952>` // @mods
          );
      }
      msg.delete();
      return;
    }
    if (msg.channel == dclient.channels.get(onemphChannel)) {
      rclient.existsAsync(`1mph-lock/${msg.author.id}`).then(exists => {
        if (exists) {
          msg.delete(500);
        } else {
          rclient
            .setexAsync(`1mph-lock/${msg.author.id}`, 60 * 60, true)
            .then(() => {
              lockedCheck(true);
            });
        }
      });
      return;
    }
    if (msg.channel == dclient.channels.get(emojiChannel)) {
      let noemo = msg.content.replace(
        /\ud83c[\udde6-\uddff]/,
        "regional indicator"
      );
      noemo = noemo.replace(emojiRegex, "");
      noemo = msg.guild.emojis.array().reduce((x, y) => {
        return x.replace(`<:${y.name}:${y.id}>`, "");
      }, noemo);
      noemo = noemo.trim();
      if (noemo) {
        msg.delete();
      }
      return;
    }

    const stripped = m.replace(/[^0-9a-z]/gi, "");
    if (msg.channel === dclient.channels.get(r5kChannel)) {
      // r5k
      rclient.sismemberAsync("r5k", stripped).then(seen => {
        if (seen) {
          msg.delete(500);
          dclient.channels
            .get("497883396203216917") // #r5k-fails
            .send(`${msg.author.tag}: ${msg.content}`);
        }
      });
    }
    rclient.sadd("r5k", stripped);
    if (m.includes(";points")) {
      rclient.zscoreAsync("points", msg.author.id).then(points => {
        if (points) {
          msg.channel.send(points);
        } else {
          msg.channel.send("0");
        }
      });
    } else {
      rclient.zincrby(
        "points",
        Math.floor(5 + Math.min(m.length / 10, 10)),
        msg.author.id
      );
    }
    if (m.includes(";ytlist")) {
      if (msg.member.roles.has("472080504460541952")) {
        // mods
        Promise.all(
          channels.map(x =>
            msg.channel.send(`https://www.youtube.com/channel/${x}`)
          )
        ).then(msg.channel.send("Done!"));
      } else {
        msg.channel.send("no");
      }
    }
    match = msg.content.match(/;mkrole (.*)/i);
    // 'msg' not 'm' to preserve case, 'i' for case insensitive 'mkrole' match
    if (match) {
      if (msg.member.roles.has("472080504460541952")) {
        // mods
        msg.guild.createRole({ name: match[1] });
        msg.channel.send("Created!");
      } else {
        msg.channel.send("no");
      }
    }
    match = m.match(/;rmrole (.*)/);
    if (match) {
      if (msg.member.roles.has("472080504460541952")) {
        // mods
        const role = msg.guild.roles.find(
          x => x.name.toLowerCase() === match[1]
        );
        if (role) {
          role.delete();
          msg.channel.send("Deleted!");
        } else {
          msg.channel.send("Couldn't find that role :/");
        }
      } else {
        msg.channel.send("no");
      }
    }
    match = m.match(/;mkvote ?(\d+)? ?(.*)/);
    if (match) {
      if (msg.member.roles.has("472080504460541952")) {
        // mods
        const role = msg.guild.roles.find(
          x => x.name.toLowerCase() === match[2].trim()
        );
        let threshold;
        let type;
        if (match[2] && !role) {
          msg.channel.send("Couldn't find that role :/");
        } else {
          if (role) {
            const totvoters = role.members.size;
            threshold = match[1]
              ? Math.max(Math.min(match[1], totvoters), 1)
              : totvoters;
            type = match[2];
          } else if (match[1]) {
            threshold = Math.max(match[1], 1);
            type = "";
          }
          type = type.toLowerCase();
          if (threshold) {
            msg.channel.send(
              `Starting ${type ? type + " " : ""}vote (${threshold} required).`
            );
            rclient
              .multi()
              .set("vote-type", type)
              .set("vote-threshold", threshold)
              .set("vote-total", 0)
              .set("vote-for", 0)
              .set("vote-against", 0)
              .del("vote-voters")
              .exec();
          } else {
            msg.channel.send("You need to specify a threshold or a role.");
          }
        }
      } else {
        msg.channel.send("no");
      }
    }
    if (m.includes(";rmvote")) {
      if (msg.member.roles.has("472080504460541952")) {
        // mods
        rclient
          .multi()
          .get("vote-for")
          .get("vote-against")
          .execAsync()
          .then(results => {
            const emoji =
              results[0] === results[1]
                ? ":question:"
                : results[0] > results[1]
                  ? ":thumbsup:"
                  : ":thumbsdown:";
            msg.channel.send(
              `Vote finished: ${results[0]} for, ${
                results[1]
              } against. ${emoji}`
            );
            rclient
              .multi()
              .del("vote-type")
              .del("vote-threshold")
              .del("vote-total")
              .del("vote-for")
              .del("vote-against")
              .del("vote-voters")
              .exec();
          });
      } else {
        msg.channel.send("no");
      }
    }
    async function voteDoneCheck(x) {
      const results = await rclient
        .multi()
        .get("vote-for")
        .get("vote-against")
        .get("vote-threshold")
        .execAsync();
      if (x[0] > results[2]) {
        msg.channel.send(
          "Votes > threshold, THIS SHOULD NEVER HAPPEN <@144880429533626368>" // @Marble#2132
        );
      }
      if (
        x[0] === results[2] ||
        results[0] > results[2] / 2 ||
        results[1] > results[2] / 2
      ) {
        const emoji =
          results[0] === results[1]
            ? ":question:"
            : results[0] > results[1]
              ? ":thumbsup:"
              : ":thumbsdown:";
        msg.channel.send(
          `Vote finished: ${results[0]} for, ${results[1]} against. ${emoji}`
        );
        rclient
          .multi()
          .del("vote-type")
          .del("vote-threshold")
          .del("vote-total")
          .del("vote-for")
          .del("vote-against")
          .del("vote-voters")
          .exec();
      }
    }
    match = m.match(/;(yea|aye|nay|yes|no|for|against)\b/);
    if (match) {
      lock.acquire("vote", async () => {
        const type = await rclient.getAsync("vote-type");
        const threshold = await rclient.getAsync("vote-threshold");
        const voted = await rclient.sismemberAsync(
          "vote-voters",
          msg.author.id
        );
        if (!threshold) {
          msg.channel.send("No vote currently in progress.");
        } else if (
          type &&
          !msg.member.roles.find(x => x.name.toLowerCase() === type)
        ) {
          msg.channel.send("You're not authorized to vote.");
        } else if (voted) {
          msg.channel.send("You already voted.");
        } else {
          msg.react("☑");
          const direction = {
            yea: true,
            aye: true,
            nay: false,
            yes: true,
            no: false,
            for: true,
            against: false
          }[match[1]];
          rclient
            .multi()
            .incr("vote-total")
            .incr(direction ? "vote-for" : "vote-against")
            .sadd("vote-voters", msg.author.id)
            .execAsync()
            .then(voteDoneCheck);
        }
      });
    }
    if (m.includes(";vote")) {
      rclient
        .multi()
        .get("vote-for")
        .get("vote-against")
        .get("vote-threshold")
        .execAsync()
        .then(results => {
          if (results[2]) {
            const emoji =
              results[0] === results[1]
                ? ":question:"
                : results[0] > results[1]
                  ? ":thumbsup:"
                  : ":thumbsdown:";
            msg.channel.send(
              `Current vote results: ${results[0]} for, ${
                results[1]
              } against (${results[2]} required). (${emoji})`
            );
          } else {
            msg.channel.send("No vote currently in progress.");
          }
        });
    }
  }
  match = m.match(/;iam(n|not|n't|)? (.*)/);
  if (match) {
    const role = msg.guild.roles.find(x => x.name.toLowerCase() === match[2]);
    if (role) {
      if (!match[1]) {
        // add
        if (msg.member.roles.has(role.id)) {
          msg.channel.send("You already were :)");
        } else {
          msg.member
            .addRole(role)
            .then(() => {
              msg.channel.send("Added!");
            })
            .catch(() => msg.channel.send("no"));
        }
      } else {
        // remove
        if (!msg.member.roles.has(role.id)) {
          msg.channel.send("You weren't but now you aren't even more");
        } else {
          msg.member
            .removeRole(role)
            .then(() => {
              msg.channel.send("Removed!");
            })
            .catch(() => msg.channel.send("yes you are"));
        }
      }
    } else {
      msg.channel.send("Couldn't find that role :/");
    }
  }
  if (m.includes(";leaderboard")) {
    const chunks = (array, chunk_size) =>
      Array(Math.ceil(array.length / chunk_size))
        .fill()
        .map((_, index) => index * chunk_size)
        .map(begin => array.slice(begin, begin + chunk_size));
    rclient.zrevrangeAsync("points", 0, 8, "withscores").then(x => {
      x = chunks(x, 2);
      let str = "```";
      x.forEach((y, i) => {
        const u = dclient.users.get(y[0]);
        str += `#${i + 1} ${y[1].padStart(7, " ")}  ${
          u ? u.tag : "<unknown>"
        }\n`;
      });
      msg.channel.send(str + "```");
    });
  }
  if (m.includes(";rank")) {
    rclient.zrevrankAsync("points", msg.author.id).then(rank => {
      msg.channel.send("#" + (parseInt(rank) + 1));
    });
  }
  if (m.includes(";ytcheck")) {
    channels.forEach(checkChannel);
  }
  if (m.includes(";ping")) {
    msg.reply("pong!");
  }
  if (m.includes(";love")) {
    msg.reply(`you're ${superb.random()}!`);
  }
  match = msg.content.match(/;aes (.*)/i);
  if (match) {
    msg.channel.send(fullwidth(match[1]));
  }
  match = msg.content.match(/;mock (.*)/i);
  if (match) {
    let mockmsg = "";
    for (let i = 0; i < match[1].length; i++) {
      const x = match[1][i];
      if (x.toLowerCase() === "l") {
        mockmsg += x.toUpperCase();
      } else if (x.toLowerCase() === "i") {
        mockmsg += x.toLowerCase();
      } else {
        if (Math.random() < 0.1) {
          mockmsg += i % 2 ? x.toLowerCase() : x.toUpperCase();
        } else {
          mockmsg += i % 2 ? x.toUpperCase() : x.toLowerCase();
        }
      }
    }
    msg.channel.send(mockmsg);
  }
  match = msg.content.match(/;pooraes (.*)/i);
  if (match) {
    msg.channel.send(match[1].split("").join(" "));
  }
  match = msg.content.match(/;clap (.*)/i);
  if (match) {
    msg.channel.send(match[1].split(/\s+/).join("👏"));
  }
  match = m.match(/;emoji (.*)/);
  if (match) {
    msg.channel.send(
      match[1]
        .split("")
        .filter(x => x.match(/[a-z ]/))
        .map(x => (x === " " ? "  " : `:regional_indicator_${x}:`))
        .join("\u200b")
    );
  }
  if (m.includes(";dad")) {
    request
      .get("https://icanhazdadjoke.com")
      .accept("json")
      .then(res => msg.channel.send(res.body.joke));
  }
  if (m.includes(";lenny")) {
    msg.channel.send("( ͡° ͜ʖ ͡°)");
  }
  if (m.includes(";shrug")) {
    msg.channel.send("¯\\_(ツ)_/¯");
  }
  if (m.includes(";internationale")) {
    msg.channel.send("https://youtu.be/3sh4kz_zhyo");
  }
  if (m.includes(";jouvert") || m.includes(";j'ouvert")) {
    msg.channel.send("https://youtu.be/PkLPFi4fmug");
  }
  if (m.includes(";uptime")) {
    msg.channel.send(
      moment
        .duration(dclient.uptime)
        .locale("fr")
        .humanize()
    );
  }
}

dclient.login(process.env.VINNY_DISCORD_TOKEN);
