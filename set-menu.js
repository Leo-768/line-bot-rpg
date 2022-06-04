const line = require('@line/bot-sdk');
const fs = require('fs');
const richmenuSets = require('./data/richmenus/index.json')
require('dotenv').config()

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

async function setUp(){
    const client = new line.Client(config)
    const oldRichmenuIds = await client.getRichMenuList()
    for (i=0;i<oldRichmenuIds.length;i++){
        await client.deleteRichMenu(oldRichmenuIds[i].richMenuId)
    }
    const oldRichmenuAlias = await client.getRichMenuAliasList()
    for (i=0;i<oldRichmenuAlias.aliases.length;i++){
        await client.deleteRichMenuAlias(oldRichmenuAlias.aliases[i].richMenuAliasId)
    }
    let richMenuId = ""
    for (let i=0;i<richmenuSets.length;i++){
        richMenuId = await client.createRichMenu(require('./data/richmenus/'+richmenuSets[i].setting))
        await client.setRichMenuImage(richMenuId, fs.createReadStream('./data/richmenus/'+richmenuSets[i].image))
        await client.createRichMenuAlias(richMenuId, richmenuSets[i].id)
    }
    console.log(oldRichmenuAlias)
    console.log(oldRichmenuIds)
    console.log(richMenuId)
}

setUp().then()