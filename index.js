const line = require('@line/bot-sdk')
const express = require('express')
require('dotenv').config()

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
}

async function main() {
    const client = new line.Client(config)
    const app = express()

    async function getRichMenuByAlias() {
        var aliasToId = {}
        const datas = await client.getRichMenuAliasList()
        const list = datas.aliases
        for (let i = 0; i < list.length; i++) {
            aliasToId[list[i].richMenuAliasId] = list[i].richMenuId
        }
        return aliasToId
    }

    const richMenuAliasToId = await getRichMenuByAlias()

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
}

main().then()