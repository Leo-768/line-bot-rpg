const line = require('@line/bot-sdk')
const express = require('express')
require('dotenv').config()
const richMenuAliasToId = require('./data/richmenus.json')

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
}

const client = new line.Client(config)
const app = express()

app.post('/linewebhook', line.middleware(config), (req, res) => {
    Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.json(result))
        .catch((err) => {
            console.error(err)
            res.status(500).end()
        })
})

function handleEvent(event) {
    if (event.type === 'message' && event.message.type === 'text') {
        if (event.message.text === "666") return client.linkRichMenuToUser(event.source.userId, richMenuAliasToId['next'])
        return client.replyMessage(event.replyToken, {type: 'text',text: event.message.text})
    } else if (event.type === 'postback') {
        if (event.postback.data === 'next') return client.unlinkRichMenuFromUser(event.source.userId)
    }

    return Promise.resolve(null)
}

app.listen(3000, () => {
    console.log('on')
})