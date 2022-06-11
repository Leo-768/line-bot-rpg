const line = require('@line/bot-sdk');
const fs = require('fs');
require('dotenv').config()

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

const admin = require('firebase-admin')
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
})
const db = admin.database();
const ref = db.ref('/');

async function richmenusetup() {
    const richMenuSets = require(__dirname + '/richmenus-set/index.json')
    const client = new line.Client(config)
    const oldRichmenuIds = await client.getRichMenuList()
    for (let i = 0; i < oldRichmenuIds.length; i++) {
        await client.deleteRichMenu(oldRichmenuIds[i].richMenuId)
    }
    const oldRichmenuAlias = await client.getRichMenuAliasList()
    for (let i = 0; i < oldRichmenuAlias.aliases.length; i++) {
        await client.deleteRichMenuAlias(oldRichmenuAlias.aliases[i].richMenuAliasId)
    }
    let richMenuId = ""
    for (let i = 0; i < richMenuSets.length; i++) {
        richMenuId = await client.createRichMenu(require(__dirname + '/richmenus-set/' + richMenuSets[i].setting))
        await client.setRichMenuImage(richMenuId, fs.createReadStream(__dirname + '/richmenus-set/' + richMenuSets[i].image))
        await client.createRichMenuAlias(richMenuId, richMenuSets[i].id)
    }

    var aliasToId = {}
    const datas = (await client.getRichMenuAliasList()).aliases
    for (let i = 0; i < datas.length; i++) {
        aliasToId[datas[i].richMenuAliasId] = datas[i].richMenuId
    }
    await ref.child('richmenus').set(aliasToId)
    console.log(aliasToId)
}

async function taglist() {
    let tags = {}
    for (const story of require(__dirname + '/../data/story/index.json')) {
        require(__dirname + `/../data/story/${story}/index.json`).forEach((v, i) => {
            require(__dirname + `/../data/story/${story}/${v}`).forEach((now, j) => {
                if (now.type === 'tag') {
                    tags[now.tag] = { stage: story, stage2: i, stage3: k }
                }
            })
        })
    }
    await ref.child('tags').set(tags)
    console.log(tags)
}

Promise.all([richmenusetup(),taglist()]).then(() => {
    admin.app().delete()
})