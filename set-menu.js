const line = require('@line/bot-sdk');
const fs = require('fs');
const { get } = require('http');
const richmenu = require('./data/menu-talk.json')
require('dotenv').config()

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);

//client.deleteRichMenu("richmenu-5159d942b94828918bfd0dfb81bd5aab")
/*
client.createRichMenu(richmenu)
    .then((richMenuId) => {
        client.setRichMenuImage(richMenuId, fs.createReadStream('./data/menu-talk.png'))
            .then(res => {
                console.log(res)
                client.createRichMenuAlias(richMenuId, 'next')
                    .then(res=>console.log(res))
                    .catch(err => console.log(err))
            })
            .catch(err => console.error(err))
        
    })
    .catch(err => console.error(err))
*/
/*
client.getRichMenuAlias('next')
    .then(data=>console.log(data))
*/
/*
client.getRichMenuList()
    .then(list => {
        console.log(list)
    })
*/
/*
client.deleteRichMenuAlias('next').then(() => {
    client.createRichMenuAlias('richmenu-9cce9fcae95c215eb5345999d334eb6d', 'next')
})
*/
async function getRichMenuByAlias() {
    var aliasToId = {}
    const datas = await client.getRichMenuAliasList()
    const list = datas.aliases
    for (i=0;i<list.length;i++){
        aliasToId[list[i].richMenuAliasId] = list[i].richMenuId
    }
    return aliasToId
}
function setUp() {
    getRichMenuByAlias().then(data=>{
        return data
    })
}
console.log(setUp)

//client.setRichMenuImage("richmenu-a2caae01ae532037dd5bb1cd4798224f", fs.createReadStream('./data/menu-talk.png'))