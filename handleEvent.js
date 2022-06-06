const richMenuAliasToId = require('./data/richMenus.json')
const { client, ref, memory } = require("./index")

async function handleEvent(event//:import('@line/bot-sdk').WebhookEvent
) {

    if (event.type === 'follow') {
        client.linkRichMenuToUser(event.source.userId, richMenuAliasToId['start'])
        return client.replyMessage(event.replyToken, require('./data/message/welcome.json'))
    }

    if (event.type === 'message' && event.message.type === 'text') {
        if (event.message.text === "666")
            return client.linkRichMenuToUser(event.source.userId, richMenuAliasToId['next'])
        await dataSetUp(event.source.userId)
        return client.replyMessage(event.replyToken, { type: 'text', text: toString((await ref.child(event.source.userId).get()).val()) })
    }

    if (event.type === 'postback') {
        if (event.postback.data.startsWith('ui'))
            if (event.postback.data === 'ui-start') {
                await dataSetUp(event.source.userId)
                client.linkRichMenuToUser(event.source.userId, richMenuAliasToId['next'])
                memory[event.source.userId] = { stage: 'begin', stage2: 0, stage3: -1 }
                ref.child(event.source.userId).update(memory[event.source.userId])
                next(event.source.userId,event.replyToken)
                //client.replyMessage(event.replyToken, { type: 'text', text: '...' })//message(event.source.userId))
            } else if (event.postback.data === 'ui-next') {
                next(event.source.userId,event.replyToken)
            }

    }

    return Promise.resolve(null);
}

async function dataSetUp(userId) {
    if (!memory[userId]) memory[userId] = (await ref.child(userId).get()).val() || {}
}
/*
function message(userId) {
    const index = require(`./data/story/${memory[userId].stage}/index.json`)
    const data = require(`./data/story/${memory[userId].stage}/${index[memory[userId].stage2]}`)
    if (typeof(data[memory[userId].stage3]) === 'string') {
        return { type: 'text', text: data[memory[userId].stage3] }
    }
}
*/
function next(userId, replyToken) {
    const index = require(`./data/story/${memory[userId].stage}/index.json`)
    const data = require(`./data/story/${memory[userId].stage}/${index[memory[userId].stage2]}`)
    memory[userId].stage3++
    if (!data[memory[userId].stage3]) {
        memory[userId].stage2++
        memory[userId].stage3 = 0
        return next(userId)
    }
    if (typeof data[memory[userId].stage3] === 'string') {
        return client.replyMessage(replyToken, { type: 'text', text: data[memory[userId].stage3] })
    }
    switch (data[memory[userId].stage3].type) {
        case 'text':
            
            break;
        default:
            break;
    }
}

exports.handleEvent = handleEvent;