const richMenuAliasToId = require('./data/richMenus.json');
const { client, ref, memory } = require("./index");

async function handleEvent(event//:import('@line/bot-sdk').WebhookEvent
) {
    
    if (event.type === 'follow'){
        client.linkRichMenuToUser(event.source.userId, richMenuAliasToId['start']);
        return client.replyMessage(event.replyToken,require('./data/message/welcome.json'))
    }

    if (event.type === 'message' && event.message.type === 'text') {
        if (event.message.text === "666")
            return client.linkRichMenuToUser(event.source.userId, richMenuAliasToId['next']);
            dataSetUp(event.source.userId)
        return client.replyMessage(event.replyToken, { type: 'text', text: toString((await ref.child(event.source.userId).get()).val()) });
    }
    
    if (event.type === 'postback') {
        if (event.postback.data.startsWith('main'))
            return client.unlinkRichMenuFromUser(event.source.userId);
    }
    
    return Promise.resolve(null);
}

async function dataSetUp(userId){
    if (!memory[userId]) memory[userId] = (await ref.child(userId).get()).val() || {}
}

exports.handleEvent = handleEvent;