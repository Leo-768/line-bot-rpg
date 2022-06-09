var memory = {users:{}}
const line = require('@line/bot-sdk')
const express = require('express')
require('dotenv').config()
const admin = require('firebase-admin')
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  })

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
}

const messages = {}
for (const iterator of require('./data/message/index.json')) {
    messages[iterator] = require(`./data/message/${iterator}.json`)
}

const db = admin.database();
const ref = db.ref('/');
const client = new line.Client(config)
module.exports = {
    client:client,
    ref:ref,
    memory:memory,
    messages:messages,
    altText:require('./data/altText.json')
}
const { handleEvent } = require("./handleEvent")

setInterval(() => {
    ref.child('users').update(memory.users)
    console.log(memory.users)
}, 30000);

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

app.listen(3000, () => {
    console.log('on')
})
