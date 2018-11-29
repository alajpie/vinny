require("dotenv").config();
const Discord = require("discord.js");
const superb = require("superb");
const fullwidth = require("fullwidth").default;
const request = require("superagent");
const moment = require("moment-timezone");
const Twitter = require("twitter");
const bluebird = require("bluebird");
const shellExec = require("shell-exec");
const lock = new (require("async-lock"))();
const rss = new (require("rss-parser"))();
const assert = require("assert");
const { SHA3 } = require("sha3");

console.log(
  `${process.env.NODE_ENV === "production" ? "Production" : "Dev"} tier.`
);

const redis = require("redis");
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const rclient = redis.createClient({
  db: process.env.NODE_ENV === "production" ? 0 : 1
});

const dclient = new Discord.Client();
const tclient = new Twitter({
  consumer_key: process.env.VINNY_TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.VINNY_TWITTER_CONSUMER_SECRET,
  // access_token_key: process.env.VINNY_TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.VINNY_TWITTER_ACCESS_TOKEN_SECRET
});

const emojiRegex = /\u{1F3F4}(?:\u{E0067}\u{E0062}(?:\u{E0065}\u{E006E}\u{E0067}|\u{E0077}\u{E006C}\u{E0073}|\u{E0073}\u{E0063}\u{E0074})\u{E007F}|\u200D\u2620\uFE0F)|\u{1F469}\u200D\u{1F469}\u200D(?:\u{1F466}\u200D\u{1F466}|\u{1F467}\u200D[\u{1F466}\u{1F467}])|\u{1F468}(?:\u200D(?:\u2764\uFE0F\u200D(?:\u{1F48B}\u200D)?\u{1F468}|[\u{1F468}\u{1F469}]\u200D(?:\u{1F466}\u200D\u{1F466}|\u{1F467}\u200D[\u{1F466}\u{1F467}])|\u{1F466}\u200D\u{1F466}|\u{1F467}\u200D[\u{1F466}\u{1F467}]|[\u{1F33E}\u{1F373}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9B0}-\u{1F9B3}])|[\u{1F3FB}-\u{1F3FF}]\u200D[\u{1F33E}\u{1F373}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9B0}-\u{1F9B3}])|\u{1F469}\u200D(?:\u2764\uFE0F\u200D(?:\u{1F48B}\u200D[\u{1F468}\u{1F469}]|[\u{1F468}\u{1F469}])|[\u{1F33E}\u{1F373}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9B0}-\u{1F9B3}])|\u{1F469}\u200D\u{1F466}\u200D\u{1F466}|(?:\u{1F441}\uFE0F\u200D\u{1F5E8}|\u{1F469}[\u{1F3FB}-\u{1F3FF}]\u200D[\u2695\u2696\u2708]|\u{1F468}(?:[\u{1F3FB}-\u{1F3FF}]\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|(?:[\u26F9\u{1F3CB}\u{1F3CC}\u{1F575}]\uFE0F|[\u{1F46F}\u{1F93C}\u{1F9DE}\u{1F9DF}])\u200D[\u2640\u2642]|[\u26F9\u{1F3CB}\u{1F3CC}\u{1F575}][\u{1F3FB}-\u{1F3FF}]\u200D[\u2640\u2642]|[\u{1F3C3}\u{1F3C4}\u{1F3CA}\u{1F46E}\u{1F471}\u{1F473}\u{1F477}\u{1F481}\u{1F482}\u{1F486}\u{1F487}\u{1F645}-\u{1F647}\u{1F64B}\u{1F64D}\u{1F64E}\u{1F6A3}\u{1F6B4}-\u{1F6B6}\u{1F926}\u{1F937}-\u{1F939}\u{1F93D}\u{1F93E}\u{1F9B8}\u{1F9B9}\u{1F9D6}-\u{1F9DD}](?:[\u{1F3FB}-\u{1F3FF}]\u200D[\u2640\u2642]|\u200D[\u2640\u2642])|\u{1F469}\u200D[\u2695\u2696\u2708])\uFE0F|\u{1F469}\u200D\u{1F467}\u200D[\u{1F466}\u{1F467}]|\u{1F469}\u200D\u{1F469}\u200D[\u{1F466}\u{1F467}]|\u{1F468}(?:\u200D(?:[\u{1F468}\u{1F469}]\u200D[\u{1F466}\u{1F467}]|[\u{1F466}\u{1F467}])|[\u{1F3FB}-\u{1F3FF}])|\u{1F3F3}\uFE0F\u200D\u{1F308}|\u{1F469}\u200D\u{1F467}|\u{1F469}[\u{1F3FB}-\u{1F3FF}]\u200D[\u{1F33E}\u{1F373}\u{1F393}\u{1F3A4}\u{1F3A8}\u{1F3EB}\u{1F3ED}\u{1F4BB}\u{1F4BC}\u{1F527}\u{1F52C}\u{1F680}\u{1F692}\u{1F9B0}-\u{1F9B3}]|\u{1F469}\u200D\u{1F466}|\u{1F1F6}\u{1F1E6}|\u{1F1FD}\u{1F1F0}|\u{1F1F4}\u{1F1F2}|\u{1F469}[\u{1F3FB}-\u{1F3FF}]|\u{1F1ED}[\u{1F1F0}\u{1F1F2}\u{1F1F3}\u{1F1F7}\u{1F1F9}\u{1F1FA}]|\u{1F1EC}[\u{1F1E6}\u{1F1E7}\u{1F1E9}-\u{1F1EE}\u{1F1F1}-\u{1F1F3}\u{1F1F5}-\u{1F1FA}\u{1F1FC}\u{1F1FE}]|\u{1F1EA}[\u{1F1E6}\u{1F1E8}\u{1F1EA}\u{1F1EC}\u{1F1ED}\u{1F1F7}-\u{1F1FA}]|\u{1F1E8}[\u{1F1E6}\u{1F1E8}\u{1F1E9}\u{1F1EB}-\u{1F1EE}\u{1F1F0}-\u{1F1F5}\u{1F1F7}\u{1F1FA}-\u{1F1FF}]|\u{1F1F2}[\u{1F1E6}\u{1F1E8}-\u{1F1ED}\u{1F1F0}-\u{1F1FF}]|\u{1F1F3}[\u{1F1E6}\u{1F1E8}\u{1F1EA}-\u{1F1EC}\u{1F1EE}\u{1F1F1}\u{1F1F4}\u{1F1F5}\u{1F1F7}\u{1F1FA}\u{1F1FF}]|\u{1F1FC}[\u{1F1EB}\u{1F1F8}]|\u{1F1FA}[\u{1F1E6}\u{1F1EC}\u{1F1F2}\u{1F1F3}\u{1F1F8}\u{1F1FE}\u{1F1FF}]|\u{1F1F0}[\u{1F1EA}\u{1F1EC}-\u{1F1EE}\u{1F1F2}\u{1F1F3}\u{1F1F5}\u{1F1F7}\u{1F1FC}\u{1F1FE}\u{1F1FF}]|\u{1F1EF}[\u{1F1EA}\u{1F1F2}\u{1F1F4}\u{1F1F5}]|\u{1F1F8}[\u{1F1E6}-\u{1F1EA}\u{1F1EC}-\u{1F1F4}\u{1F1F7}-\u{1F1F9}\u{1F1FB}\u{1F1FD}-\u{1F1FF}]|\u{1F1EE}[\u{1F1E8}-\u{1F1EA}\u{1F1F1}-\u{1F1F4}\u{1F1F6}-\u{1F1F9}]|\u{1F1FF}[\u{1F1E6}\u{1F1F2}\u{1F1FC}]|\u{1F1EB}[\u{1F1EE}-\u{1F1F0}\u{1F1F2}\u{1F1F4}\u{1F1F7}]|\u{1F1F5}[\u{1F1E6}\u{1F1EA}-\u{1F1ED}\u{1F1F0}-\u{1F1F3}\u{1F1F7}-\u{1F1F9}\u{1F1FC}\u{1F1FE}]|\u{1F1E9}[\u{1F1EA}\u{1F1EC}\u{1F1EF}\u{1F1F0}\u{1F1F2}\u{1F1F4}\u{1F1FF}]|\u{1F1F9}[\u{1F1E6}\u{1F1E8}\u{1F1E9}\u{1F1EB}-\u{1F1ED}\u{1F1EF}-\u{1F1F4}\u{1F1F7}\u{1F1F9}\u{1F1FB}\u{1F1FC}\u{1F1FF}]|\u{1F1E7}[\u{1F1E6}\u{1F1E7}\u{1F1E9}-\u{1F1EF}\u{1F1F1}-\u{1F1F4}\u{1F1F6}-\u{1F1F9}\u{1F1FB}\u{1F1FC}\u{1F1FE}\u{1F1FF}]|[#\*0-9]\uFE0F\u20E3|\u{1F1F1}[\u{1F1E6}-\u{1F1E8}\u{1F1EE}\u{1F1F0}\u{1F1F7}-\u{1F1FB}\u{1F1FE}]|\u{1F1E6}[\u{1F1E8}-\u{1F1EC}\u{1F1EE}\u{1F1F1}\u{1F1F2}\u{1F1F4}\u{1F1F6}-\u{1F1FA}\u{1F1FC}\u{1F1FD}\u{1F1FF}]|\u{1F1F7}[\u{1F1EA}\u{1F1F4}\u{1F1F8}\u{1F1FA}\u{1F1FC}]|\u{1F1FB}[\u{1F1E6}\u{1F1E8}\u{1F1EA}\u{1F1EC}\u{1F1EE}\u{1F1F3}\u{1F1FA}]|\u{1F1FE}[\u{1F1EA}\u{1F1F9}]|[\u{1F3C3}\u{1F3C4}\u{1F3CA}\u{1F46E}\u{1F471}\u{1F473}\u{1F477}\u{1F481}\u{1F482}\u{1F486}\u{1F487}\u{1F645}-\u{1F647}\u{1F64B}\u{1F64D}\u{1F64E}\u{1F6A3}\u{1F6B4}-\u{1F6B6}\u{1F926}\u{1F937}-\u{1F939}\u{1F93D}\u{1F93E}\u{1F9B8}\u{1F9B9}\u{1F9D6}-\u{1F9DD}][\u{1F3FB}-\u{1F3FF}]|[\u26F9\u{1F3CB}\u{1F3CC}\u{1F575}][\u{1F3FB}-\u{1F3FF}]|[\u261D\u270A-\u270D\u{1F385}\u{1F3C2}\u{1F3C7}\u{1F442}\u{1F443}\u{1F446}-\u{1F450}\u{1F466}\u{1F467}\u{1F470}\u{1F472}\u{1F474}-\u{1F476}\u{1F478}\u{1F47C}\u{1F483}\u{1F485}\u{1F4AA}\u{1F574}\u{1F57A}\u{1F590}\u{1F595}\u{1F596}\u{1F64C}\u{1F64F}\u{1F6C0}\u{1F6CC}\u{1F918}-\u{1F91C}\u{1F91E}\u{1F91F}\u{1F930}-\u{1F936}\u{1F9B5}\u{1F9B6}\u{1F9D1}-\u{1F9D5}][\u{1F3FB}-\u{1F3FF}]|[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55\u{1F004}\u{1F0CF}\u{1F18E}\u{1F191}-\u{1F19A}\u{1F1E6}-\u{1F1FF}\u{1F201}\u{1F21A}\u{1F22F}\u{1F232}-\u{1F236}\u{1F238}-\u{1F23A}\u{1F250}\u{1F251}\u{1F300}-\u{1F320}\u{1F32D}-\u{1F335}\u{1F337}-\u{1F37C}\u{1F37E}-\u{1F393}\u{1F3A0}-\u{1F3CA}\u{1F3CF}-\u{1F3D3}\u{1F3E0}-\u{1F3F0}\u{1F3F4}\u{1F3F8}-\u{1F43E}\u{1F440}\u{1F442}-\u{1F4FC}\u{1F4FF}-\u{1F53D}\u{1F54B}-\u{1F54E}\u{1F550}-\u{1F567}\u{1F57A}\u{1F595}\u{1F596}\u{1F5A4}\u{1F5FB}-\u{1F64F}\u{1F680}-\u{1F6C5}\u{1F6CC}\u{1F6D0}-\u{1F6D2}\u{1F6EB}\u{1F6EC}\u{1F6F4}-\u{1F6F9}\u{1F910}-\u{1F93A}\u{1F93C}-\u{1F93E}\u{1F940}-\u{1F945}\u{1F947}-\u{1F970}\u{1F973}-\u{1F976}\u{1F97A}\u{1F97C}-\u{1F9A2}\u{1F9B0}-\u{1F9B9}\u{1F9C0}-\u{1F9C2}\u{1F9D0}-\u{1F9FF}]|[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299\u{1F004}\u{1F0CF}\u{1F170}\u{1F171}\u{1F17E}\u{1F17F}\u{1F18E}\u{1F191}-\u{1F19A}\u{1F1E6}-\u{1F1FF}\u{1F201}\u{1F202}\u{1F21A}\u{1F22F}\u{1F232}-\u{1F23A}\u{1F250}\u{1F251}\u{1F300}-\u{1F321}\u{1F324}-\u{1F393}\u{1F396}\u{1F397}\u{1F399}-\u{1F39B}\u{1F39E}-\u{1F3F0}\u{1F3F3}-\u{1F3F5}\u{1F3F7}-\u{1F4FD}\u{1F4FF}-\u{1F53D}\u{1F549}-\u{1F54E}\u{1F550}-\u{1F567}\u{1F56F}\u{1F570}\u{1F573}-\u{1F57A}\u{1F587}\u{1F58A}-\u{1F58D}\u{1F590}\u{1F595}\u{1F596}\u{1F5A4}\u{1F5A5}\u{1F5A8}\u{1F5B1}\u{1F5B2}\u{1F5BC}\u{1F5C2}-\u{1F5C4}\u{1F5D1}-\u{1F5D3}\u{1F5DC}-\u{1F5DE}\u{1F5E1}\u{1F5E3}\u{1F5E8}\u{1F5EF}\u{1F5F3}\u{1F5FA}-\u{1F64F}\u{1F680}-\u{1F6C5}\u{1F6CB}-\u{1F6D2}\u{1F6E0}-\u{1F6E5}\u{1F6E9}\u{1F6EB}\u{1F6EC}\u{1F6F0}\u{1F6F3}-\u{1F6F9}\u{1F910}-\u{1F93A}\u{1F93C}-\u{1F93E}\u{1F940}-\u{1F945}\u{1F947}-\u{1F970}\u{1F973}-\u{1F976}\u{1F97A}\u{1F97C}-\u{1F9A2}\u{1F9B0}-\u{1F9B9}\u{1F9C0}-\u{1F9C2}\u{1F9D0}-\u{1F9FF}]\uFE0F|[\u261D\u26F9\u270A-\u270D\u{1F385}\u{1F3C2}-\u{1F3C4}\u{1F3C7}\u{1F3CA}-\u{1F3CC}\u{1F442}\u{1F443}\u{1F446}-\u{1F450}\u{1F466}-\u{1F469}\u{1F46E}\u{1F470}-\u{1F478}\u{1F47C}\u{1F481}-\u{1F483}\u{1F485}-\u{1F487}\u{1F4AA}\u{1F574}\u{1F575}\u{1F57A}\u{1F590}\u{1F595}\u{1F596}\u{1F645}-\u{1F647}\u{1F64B}-\u{1F64F}\u{1F6A3}\u{1F6B4}-\u{1F6B6}\u{1F6C0}\u{1F6CC}\u{1F918}-\u{1F91C}\u{1F91E}\u{1F91F}\u{1F926}\u{1F930}-\u{1F939}\u{1F93D}\u{1F93E}\u{1F9B5}\u{1F9B6}\u{1F9B8}\u{1F9B9}\u{1F9D1}-\u{1F9DD}]/gu;

const prodTier = {
  deptOfBotAffairsChannel: "472118062825472011",
  autoYtChannel: "487747607704240139",
  tzdataChannel: "504953120988856330",
  modLoungeChannel: "481658230049603604",
  r5kChannel: "491313270939058176",
  r5kFailsChannel: "497883396203216917",
  onemphChannel: "498564815384739864",
  emojiChannel: "505844487642284044",
  countingChannel: "517061962866229279",
  hashLowerChannel: "517489574780338187",
  hashLowerFailsChannel: "517489591834378240",
  nickMuseumChannel: "498572261746278441",
  edgyMemesChannel: "490036639473729547",

  modsRole: "472080504460541952",
  autoYtRole: "491208696077090876",
  nickMuseumRole: "499907364485464074",

  mainGuild: "472079800744411136",
  botAdmin: "144880429533626368"
};

const devTier = {
  deptOfBotAffairsChannel: "514124837623562261",
  autoYtChannel: "514125114426785792",
  tzdataChannel: "514124814294712341",
  modLoungeChannel: "514131784116469765",
  r5kChannel: "514124754207113226",
  r5kFailsChannel: "514124773551243290",
  onemphChannel: "514124803427532801",
  emojiChannel: "514124848717365269",
  countingChannel: "517047271347585065",
  hashLowerChannel: "517485985882177563",
  hashLowerFailsChannel: "517486015053692928",
  nickMuseumChannel: "514132045744832523",
  edgyMemesChannel: "514124920947605515",

  modsRole: "514124155273347084",
  autoYtRole: "514132353627717633",
  nickMuseumRole: "514132380282257410",

  mainGuild: "514121360851599371",
  botAdmin: "144880429533626368"
};

const tier = process.env.NODE_ENV === "production" ? prodTier : devTier;

const tzdata = {
  "144880429533626368": "Europe/Warsaw",
  // "174183329308999681": "Europe/Riga",
  "379107526278381589": "America/Denver",
  "315801718975889410": "Europe/London",
  "358050835533660161": "America/New_York",
  "331850934277767178": "America/New_York",
  "219242476152553472": "America/Los_Angeles",
  "163150738808111108": "America/Chicago",
  "198941027313123328": "America/New_York",
  "194171464797257738": "America/Sao_Paulo",
  "182330327346184202": "America/Chicago",
  "229798224288808963": "America/Chicago",
  "337660560705585153": "Europe/London",
  "452512222162452491": "America/Chicago"
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
  "UCsXVk37bltHxD1rDPwtNM8Q", // Kurzgesagt
  "UCepkun0sH16b-mqxBN22ogA" // Mexie
]; // hug!

dclient.on("ready", () => {
  [tier.mainGuild, "471081005634289664"].forEach(x => {
    // TODO: unhardcode this
    assert.ok(
      dclient.guilds.get(x).roles.find(y => y.name === "Vinny.js"),
      `There needs to be a "Vinny.js" role (${dclient.guilds.get(x).name}).`
    );
  });
  console.log(`Logged in as ${dclient.user.tag}!`);
  dclient.user.setPresence({
    game: {
      name: "the world crumble around us",
      type: "WATCHING"
    }
  });
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
  const mnt = () => {
    // maintenance timer
    lockedCheck();
    setTimeout(mnt, 10 * 1000);
  };
  mnt();
  rclient.getAsync("counting-count").then(x => {
    dclient.channels
      .get(tier.countingChannel)
      .setTopic(`Next number: ${x ? parseInt(x) : 0}`);
  });
});

dclient.on("error", () => {
  dclient.channels
    .get(tier.deptOfBotAffairsChannel)
    .send("Discord made a fucky wucky and disconnected me >:(");
});

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
      .get(tier.autoYtChannel)
      .send(
        `New video from ${feed.title}! <@&${tier.autoYtRole}>\n${
          feed.items[i].link
        }`
      );
    rclient.sadd(key, feed.items[i].link);
  }
}

async function lockedCheck() {
  const onemph = dclient.channels.get(tier.onemphChannel);
  const keys = await rclient.keysAsync("1mph-lock/*");
  const lockedoutPromise = Promise.all(
    keys.map(async x => {
      const ttl = await rclient.pttlAsync(x);
      const u = dclient.users.get(x.substr(10));
      return `${u.tag} (${Math.ceil(ttl / (60 * 1000))} min)`;
    })
  );
  const messagesPromise = onemph.fetchMessages({ limit: 10 });
  const lockedout = await lockedoutPromise;
  const messages = await messagesPromise;
  let persistent = messages.array().find(x => x.author.id === dclient.user.id);
  if (persistent && messages.array()[0].id !== persistent.id) {
    persistent.delete();
    persistent = null;
  }
  if (persistent) {
    persistent
      .edit(`Locked out users: ${lockedout.join(", ") || "none!"}`)
      .catch(() => {
        persistent.delete();
        onemph.send(`Locked out users: ${lockedout.join(", ") || "none!"}`);
      });
  } else {
    onemph.send(`Locked out users: ${lockedout.join(", ") || "none!"}`);
  }
}

async function timezoneUpdate() {
  let out = `Timezones! Message <@${
    tier.botAdmin
  }> with what this page: <https://jsfiddle.net/d708xu4e> says to add yourself!`;
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
    out += `\n\`${x[0]} (${x[1]})\` ${dclient.users.get(x[2]).tag}`;
  });
  const messages = await dclient.channels
    .get(tier.tzdataChannel)
    .fetchMessages({ limit: 10 });
  const vinnyMessage = messages
    .array()
    .find(x => x.author.id === dclient.user.id);
  if (vinnyMessage) {
    vinnyMessage.edit(out);
  } else {
    dclient.channels.get(tier.tzdataChannel).send(out);
  }
}

async function voteDoneCheck(channel) {
  const results = (await rclient
    .multi()
    .get("vote-for")
    .get("vote-against")
    .get("vote-threshold")
    .get("vote-total-voters")
    .execAsync()).map(x => +x);
  if (
    results[0] === results[2] ||
    results[1] === results[2] ||
    results[0] + results[1] >= results[3]
  ) {
    const emoji =
      results[0] === results[1]
        ? ":question:"
        : results[0] > results[1]
        ? ":thumbsup:"
        : ":thumbsdown:";
    channel.send(
      `Vote finished: ${results[0]} for, ${results[1]} against. ${emoji}`
    );
    rclient
      .multi()
      .del("vote-type")
      .del("vote-threshold")
      .del("vote-total-voters")
      .del("vote-for")
      .del("vote-against")
      .del("vote-voters")
      .exec();
  }
}

dclient.on("messageUpdate", (prev, next) => {
  if (next.author.id === dclient.user.id) return;
  if (prev.content === next.content) return;
  if (next.guild.id !== tier.mainGuild) return;
  const stripped = next.content.toLowerCase().replace(/[^0-9a-z]/gi, "");
  if (
    next.channel.id === tier.onemphChannel ||
    next.channel.id === tier.emojiChannel ||
    next.channel.id === tier.countingChannel ||
    next.channel.id === tier.hashLowerChannel
  ) {
    next.delete(500);
  } else if (next.channel.id === tier.r5kChannel) {
    rclient.sismemberAsync("r5k", stripped).then(seen => {
      if (seen) {
        next.delete(500);
        dclient.channels
          .get(tier.r5kFailsChannel)
          .send(`${next.author.tag}: ${next.content}`);
      }
    });
  }
  rclient.sadd("r5k", stripped);
});

dclient.on("guildMemberUpdate", (prev, next) => {
  if (prev.nickname === next.nickname) return;
  if (next.guild.id !== tier.mainGuild) return;
  if (next.roles.has(tier.nickMuseumRole)) {
    dclient.channels
      .get(tier.nickMuseumChannel)
      .send(`${next.user.tag}: ${next.nickname}`);
  }
});

dclient.on("message", msg => {
  if (process.env.NODE_ENV === "production") {
    if (msg.guild.id === devTier.mainGuild) {
      return;
    }
  } else if (msg.guild.id !== tier.mainGuild) {
    return;
  }
  if (msg.content.includes(";ignore") && msg.channel.id !== tier.r5kChannel) {
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
  if (msg.author === dclient.users.get(tier.botAdmin)) {
    var match = msg.content.match(/;sh (.*)/i);
    if (match) {
      const exec = require("child_process").exec;
      exec(match[1], { shell: "/bin/zsh" }, (_, out) => {
        msg.channel.send(out).catch(() => {});
      });
    }
    match = msg.content.match(/;eval (.*)/i);
    if (match) {
      try {
        const result = eval(match[1]);
        msg.channel.send(result).catch(() => {});
      } catch (e) {}
    }
    match = msg.content.match(/;s (.*)/i);
    if (match) {
      msg.delete(500);
      msg.channel.send(match[1]);
    }
    match = msg.content.match(/;clear (\d+)(?: (\d+))?/i);
    if (match) {
      if (match[2]) {
        // a range
        // so both numbers are IDs
        var limit = BigInt(match[1]) < BigInt(match[2]) ? match[1] : match[2];
        var b4 = BigInt(match[1]) > BigInt(match[2]) ? match[1] : match[2];
        var b4 = (BigInt(b4) + 1n).toString(); // inclusive from both sides
      } else {
        // not a range
        // the number can be a count or an ID
        var limit = match[1];
        var b4 = "";
      }
      /// we return after i messages or if message's id ID i
      /// so regardless of whether a count or a message's ID is provided, it does the right thing
      /// (since message IDs are very big numbers, they are unlikely to be specified or counted down to)
      (async () => {
        let i = parseInt(limit) + 1; // clear out the ;clear command too
        const promises = [];
        while (i > 0) {
          const messagesPromise = msg.channel.fetchMessages({
            limit: 50,
            before: b4
          });
          const messages = (await messagesPromise).array();
          if (messages.length === 0) {
            break;
          }
          b4 = messages[messages.length - 1].id;
          for (var x of messages) {
            i--;
            promises.push(x.delete());
            if (x.id === limit || i <= 0) {
              return Promise.all(promises);
            }
          }
        }
        return Promise.all(promises);
      })();
    }
    match = msg.content.match(/;clearchannelyesimsure/i);
    if (match) {
      (async () => {
        let b4 = "";
        while (true) {
          const messagesPromise = msg.channel.fetchMessages({
            limit: 50,
            before: b4
          });
          const messages = (await messagesPromise).array();
          if (messages.length === 0) {
            break;
          }
          b4 = messages[messages.length - 1].id;
          for (var x of messages) {
            x.delete();
          }
        }
      })();
    }
    match = msg.content.match(/;images ?(.*)?/i);
    if (match) {
      (async () => {
        const limit = match[1] === "inf" ? Infinity : Math.min(match[1] || 10);
        if (limit > 1000) {
          msg.channel.send("Fetching...");
        }
        const images = [];
        let b4 = "";
        while (images.length < limit) {
          const messagesPromise = msg.channel.fetchMessages({
            limit: 50,
            before: b4
          });
          const messages = (await messagesPromise).array();
          if (messages.length === 0) {
            break;
          }
          b4 = messages[messages.length - 1].id;
          for (var x of messages) {
            for (const y of x.attachments.array()) {
              images.push(y.url);
            }
          }
        }
        request
          .post("https://api.paste.ee/v1/pastes")
          .send({
            description: "Vinny ;images",
            sections: [
              {
                name: "Vinny ;images",
                contents: images
                  .reverse()
                  .slice(Math.max(images.length - limit, 1))
                  .join("\n")
              }
            ]
          })
          .set("X-Auth-Token", process.env.VINNY_PASTEEE_TOKEN)
          .then(x => msg.channel.send(`<${x.body.link}>`));
      })();
    }
  }
  if (
    (msg.guild && msg.guild.id === tier.mainGuild) ||
    msg.guild.id === "471081005634289664"
  ) {
    // Hazel's server
    match = m.match(/;iam(n|not|n't|)? (.*)/);
    if (match) {
      const role = msg.guild.roles.find(x => x.name.toLowerCase() === match[2]);
      if (role) {
        if (!match[1]) {
          // add
          if (msg.member.roles.has(role.id)) {
            msg.channel.send("You already were :)");
          } else {
            if (
              role.comparePositionTo(
                msg.guild.roles.find(y => y.name === "Vinny.js")
              ) < 0
            ) {
              msg.member.addRole(role).then(() => {
                msg.channel.send("Added!");
              });
            } else {
              msg.channel.send("no");
            }
          }
        } else {
          // remove
          if (!msg.member.roles.has(role.id)) {
            msg.channel.send("You weren't but now you aren't even more.");
          } else {
            if (
              role.comparePositionTo(
                msg.guild.roles.find(y => y.name === "Vinny.js")
              ) < 0
            ) {
              msg.member.removeRole(role).then(() => {
                msg.channel.send("Removed!");
              });
            } else {
              msg.channel.send("yes you are");
            }
          }
        }
      } else {
        msg.channel.send("Couldn't find that role :/");
      }
    }
  }
  if (msg.guild && msg.guild.id === tier.mainGuild) {
    var match = m.match(
      /(\bfag|\bretard|nigger|tranny|\bchink|wetback|kike|kulak|pollack|stinky)/
    );
    if (match && msg.channel.id !== tier.edgyMemesChannel) {
      if (msg.channel.id !== tier.onemphChannel) {
        msg.reply(
          "you used a word that's on our blocklist. This incident has been reported."
        );
      }
      if (match[1] !== "stinky") {
        dclient.channels
          .get(tier.modLoungeChannel)
          .send(
            `${msg.author.tag} said: \`${msg.content}\` in #${
              msg.channel.name
            } <@&${tier.modsRole}>`
          );
      }
      msg.delete(500);
      return;
    }
    if (msg.channel.id === tier.onemphChannel) {
      rclient.existsAsync(`1mph-lock/${msg.author.id}`).then(exists => {
        if (exists) {
          msg.delete(500);
        } else {
          rclient
            .setexAsync(`1mph-lock/${msg.author.id}`, 60 * 60, true)
            .then(() => {
              lockedCheck();
            });
        }
      });
      return;
    }
    if (msg.channel.id === tier.emojiChannel) {
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
        msg.delete(500);
      }
      return;
    }
    if (msg.channel.id === tier.countingChannel) {
      lock.acquire("counting", unlock => {
        rclient
          .multi()
          .get("counting-count")
          .get("counting-last")
          .exec((_, x) => {
            if (!x[0]) {
              x[0] = 0;
            }
            if (m === x[0].toString() && msg.author.id !== x[1]) {
              msg.channel.setTopic(
                `Next number: ${x[0] ? parseInt(x[0]) + 1 : 1}`
              );
              rclient
                .multi()
                .incr("counting-count")
                .set("counting-last", msg.author.id)
                .execAsync()
                .then(unlock.bind(null, null));
            } else {
              msg.delete(500);
              unlock();
            }
          });
      });
      return;
    }
    if (msg.channel.id === tier.hashLowerChannel) {
      lock.acquire("hash-lower", async unlock => {
        const lastHashPromise = rclient.getAsync("hash-lower");
        const hash = new SHA3(256)
          .update(process.env.VINNY_HASH_LOWER_SALT)
          .update(msg.content)
          .digest("hex");
        if (hash < (await lastHashPromise)) {
          msg.channel.send(hash);
          rclient.setAsync("hash-lower", hash).then(unlock.bind(null, null));
        } else {
          msg.delete(500);
          dclient.channels
            .get(tier.hashLowerFailsChannel)
            .send(`${msg.author.tag}: ${msg.content}`);
          dclient.channels.get(tier.hashLowerFailsChannel).send(hash);
          unlock();
        }
      });
      return;
    }
    const stripped = m.replace(/[^0-9a-z]/gi, "");
    if (msg.channel.id === tier.r5kChannel) {
      rclient.sismemberAsync("r5k", stripped).then(seen => {
        if (seen) {
          msg.delete(500);
          dclient.channels
            .get(tier.r5kFailsChannel)
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
      if (msg.member.roles.has(tier.modsRole)) {
        Promise.all(
          channels.map(x =>
            msg.channel.send(`https://www.youtube.com/channel/${x}`)
          )
        ).then(msg.channel.send("Done!"));
      } else {
        msg.channel.send("no");
      }
    }
    match = msg.content.match(/;channame (.*)/i);
    if (match) {
      if (msg.member.roles.has(tier.modsRole)) {
        msg.channel.setName(match[1].replace(/ /g, "\u205f"));
      } else {
        msg.channel.send("no");
      }
    }
    match = msg.content.match(/;mkrole (.*)/i);
    // 'msg' not 'm' to preserve case, 'i' for case insensitive 'mkrole' match
    if (match) {
      if (msg.member.roles.has(tier.modsRole)) {
        msg.guild.createRole({ name: match[1] });
        msg.channel.send("Created!");
      } else {
        msg.channel.send("no");
      }
    }
    match = m.match(/;rmrole (.*)/);
    if (match) {
      if (msg.member.roles.has(tier.modsRole)) {
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
    match = m.match(/;mkvote (?:(\d+)? (.+)|(\d+)|(.+))/);
    if (match) {
      if (msg.member.roles.has(tier.modsRole)) {
        let type = match[2] || match[4] || "trusted <3";
        type = type === "everyone" ? "" : type;
        type = type === "trusted" ? "trusted <3" : type;
        let threshold = match[1] || match[3] || 0;
        let role;
        let invalid = false;
        if (type) {
          role = msg.guild.roles.find(
            x => x.name.toLowerCase() === type.trim()
          );
          if (!role) {
            msg.channel.send("Couldn't find that role :/");
            invalid = true;
          }
        }
        if (role) {
          threshold = threshold
            ? Math.min(threshold, role.members.size)
            : Math.floor(role.members.size / 2 + 1);
        }
        threshold = Math.max(threshold, 1);
        if (!invalid) {
          msg.channel.send(
            `Starting ${type ? type + " " : ""}vote (${threshold} required).`
          );
          rclient
            .multi()
            .set("vote-type", type)
            .set("vote-threshold", threshold)
            .set("vote-total-voters", role ? role.members.size : -1)
            .set("vote-for", 0)
            .set("vote-against", 0)
            .del("vote-voters")
            .exec();
        }
      } else {
        msg.channel.send("no");
      }
    }
    if (m.includes(";rmvote")) {
      if (msg.member.roles.has(tier.modsRole)) {
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
              .del("vote-total-voters")
              .del("vote-for")
              .del("vote-against")
              .del("vote-voters")
              .exec();
          });
      } else {
        msg.channel.send("no");
      }
    }
    match = m.match(
      /;(yea|aye|nay|yes|no|for|against|sure|yep|yeah|totally|absolutely|nah|nope|nuh|never)\b/
    );
    if (match) {
      lock.acquire("vote", async unlock => {
        const rawDirection = match[1];
        const type = await rclient.getAsync("vote-type");
        const threshold = await rclient.getAsync("vote-threshold");
        const voted = await rclient.sismemberAsync(
          "vote-voters",
          msg.author.id
        );
        if (!threshold) {
          msg.channel.send("No vote currently in progress.");
          unlock();
        } else if (
          type &&
          !msg.member.roles.find(x => x.name.toLowerCase() === type)
        ) {
          msg.channel.send("You're not authorized to vote.");
          unlock();
        } else if (voted) {
          msg.channel.send("You already voted.");
          unlock();
        } else {
          msg.react("☑");
          const direction = {
            yea: true,
            aye: true,
            nay: false,
            yes: true,
            no: false,
            for: true,
            against: false,
            sure: true,
            yep: true,
            yeah: true,
            totally: true,
            absolutely: true,
            nah: false,
            nope: false,
            nuh: false,
            never: false
          }[rawDirection];
          rclient
            .multi()
            .incr(direction ? "vote-for" : "vote-against")
            .sadd("vote-voters", msg.author.id)
            .execAsync()
            .then(() => {
              voteDoneCheck(msg.channel);
            })
            .then(unlock);
        }
      });
    }
    if (m.includes(";vote")) {
      rclient
        .multi()
        .get("vote-for")
        .get("vote-against")
        .get("vote-threshold")
        .get("vote-type")
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
              `Current ${results[3] ? results[3] + " " : ""}vote results: ${
                results[0]
              } for, ${results[1]} against (${results[2]} required). (${emoji})`
            );
          } else {
            msg.channel.send("No vote currently in progress.");
          }
        });
    }
    if (process.env.NODE_ENV !== "production") {
      var match = msg.content.match(/;dev (.*)/i);
      if (match) {
        if (match[1] === "yes" || match[1] === "no") {
          lock.acquire("vote", async unlock => {
            const rawDirection = match[1];
            const threshold = await rclient.getAsync("vote-threshold");
            if (!threshold) {
              msg.channel.send("No vote currently in progress.");
              unlock();
            } else {
              const direction = rawDirection === "yes";
              msg.react("☑");
              rclient
                .incrAsync(direction ? "vote-for" : "vote-against")
                .then(() => {
                  voteDoneCheck(msg.channel);
                })
                .then(unlock);
            }
          });
        } else if (match[1].match(/(voter.?fraud|re.?vote)/)) {
          rclient.srem("vote-voters", msg.author.id);
        } else if (match[1] === "unlock") {
          rclient.delAsync(`1mph-lock/${msg.author.id}`).then(() => {
            lockedCheck();
          });
        } else if (match[1] === "uncount") {
          rclient.del("counting-last");
        }
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
    if (m.includes(";help")) {
      if (msg.channel.id === tier.deptOfBotAffairsChannel) {
        msg.channel.send(`Here are the available commands:
        ;vote - check the status of the current vote
        ;yes, ;yea, ;aye, ;for - vote *yes*
        ;no, ;nay; ;against - vote *no*
        ;leaderboard - view the points leaderboard
        ;points - view your points balance
        ;rank - view your points rank
        ;ytcheck - re-check <#${tier.autoYtChannel}>
        ;ping - get 1 (one) free ping
        ;love - get a loving message <3
        ;aes <msg> - ａｅｓｔｈｉｃｉｚｅ a message
        ;pooraes <msg> - a e s t h i c i z e  a message, poorly
        ;clap <msg> - clap:clap:a:clap:message:clap:out
        ;emoji <msg> - :regional_indicator_y:​:regional_indicator_o:​:regional_indicator_u:​:regional_indicator_r:​  ​:regional_indicator_m:​:regional_indicator_e:​:regional_indicator_s:​:regional_indicator_s:​:regional_indicator_a:​:regional_indicator_g:​:regional_indicator_e:​  ​:regional_indicator_i:​:regional_indicator_n:​  ​:regional_indicator_r:​:regional_indicator_e:​:regional_indicator_g:​:regional_indicator_i:​:regional_indicator_o:​:regional_indicator_n:​:regional_indicator_a:​:regional_indicator_l:​  ​:regional_indicator_i:​:regional_indicator_n:​:regional_indicator_d:​:regional_indicator_i:​:regional_indicator_c:​:regional_indicator_a:​:regional_indicator_t:​:regional_indicator_o:​:regional_indicator_r:​:regional_indicator_s:
        ;tex <msg> - turn your \`\\infty\`s into \`∞\`s
        ;whitex <msg> - same as above, but with extra mercy for light mode users and disregard for aesthetics and taste
        ;dad - a dad joke!
        ;lenny - ( ͡° ͜ʖ ͡°)
        ;shrug - ¯\\_(ツ)_/¯
        ;internationale - *The Internationale*
        ;j'ouvert - J'OUVERT by BROCKHAMPTON
        ;repo - link to the bot's GitLab repo
        ;uptime - bot's uptime, in French
        ;zwsp - send a handy zero-width space
        ;help - what you just got.`);
      } else {
        msg.channel.send(`Try that in <#${tier.deptOfBotAffairsChannel}>.`);
      }
    }
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
  match = msg.content.match(/;(whi)?tex (.*)/i);
  if (match) {
    if (match[1]) {
      // ;whitex
      var settings = "\\bg_white \\huge \\dpi{500}";
    } else {
      // ;tex
      var settings = "\\huge \\dpi{500} \\color{white}";
    }
    msg.channel.send("", {
      files: [
        new Discord.Attachment(
          "https://latex.codecogs.com/png.latex?" +
            encodeURI(settings + " " + match[2]),
          "hello_there_mobile_user.png"
        )
      ]
    });
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
  if (m.includes(";repo")) {
    msg.channel.send("https://gitlab.com/k2l8m11n2/vinny/");
  }
  if (m.includes(";zwsp")) {
    msg.channel.send("\u200b");
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
