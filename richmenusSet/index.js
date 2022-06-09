const line = require('@line/bot-sdk');
const fs = require('fs');
const richMenuSets = require('./sets.json')
require('dotenv').config()

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

async function setUp(){
    const client = new line.Client(config)
    const oldRichmenuIds = await client.getRichMenuList()
    for (const i=0;i<oldRichmenuIds.length;i++){
        await client.deleteRichMenu(oldRichmenuIds[i].richMenuId)
    }
    const oldRichmenuAlias = await client.getRichMenuAliasList()
    for (const i=0;i<oldRichmenuAlias.aliases.length;i++){
        await client.deleteRichMenuAlias(oldRichmenuAlias.aliases[i].richMenuAliasId)
    }
    let richMenuId = ""
    for (const i=0;i<richMenuSets.length;i++){
        richMenuId = await client.createRichMenu(require('./data/'+richMenuSets[i].setting))
        await client.setRichMenuImage(richMenuId, fs.createReadStream('./data/'+richMenuSets[i].image))
        await client.createRichMenuAlias(richMenuId, richMenuSets[i].id)
    }

    var aliasToId = {}
    const datas = (await client.getRichMenuAliasList()).aliases
    for (const i = 0; i < datas.length; i++) {
        aliasToId[datas[i].richMenuAliasId] = datas[i].richMenuId
    }
    return aliasToId

}


setUp().then(datas=>{
    fs.writeFile('../data/richMenus.json',JSON.stringify(datas),err=>{
        if (err) console.log(err)
        console.log(JSON.stringify(datas))
    })
})