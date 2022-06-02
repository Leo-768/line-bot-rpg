const linebot = require('linebot');

const bot = linebot({
  channelId: '1657186827',
  channelSecret: '2d2546fb98d37b9e9f57b2e995e8930a',
  channelAccessToken: 'PmCnFtIZjKAr25Ta1C07n9j3yTGMo99SF5aTW+j/gW6giwXehX0sx8CfuuQj4OZ9SchfT3b5UcFLG/dU7bUO027xoFibdWnm2rH8/jQAM3QExjeSTa7XjBF7lrZmYLXUA9+Pe0sSK345KlBiY81XKAdB04t89/1O/w1cDnyilFU='
});

bot.on('message', function (event) {
  event.reply(event.message.text);
});

bot.listen('/linewebhook', 3000, function () {
    console.log('ready');
});
