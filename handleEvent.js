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
                memory[event.source.userId] = { stage: 'begin', stage2: 0, stage3: 0 }
                ref.child(event.source.userId).update(memory[event.source.userId])
                run(event.source.userId, event.replyToken)
                //client.replyMessage(event.replyToken, { type: 'text', text: '...' })//message(event.source.userId))
            } else if (event.postback.data === 'ui-next') {
                run(event.source.userId, event.replyToken)
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
function run(userId, replyToken) {
    const user_data = memory[userId]
    const index = require(`./data/story/${user_data.stage}/index.json`)
    const data = require(`./data/story/${user_data.stage}/${index[user_data.stage2]}`)
    user_data.stage3++
    if (!data[user_data.stage3]) {
        memory[userId].stage2++
        memory[userId].stage3 = 0
        return run(userId)
    }
    // 純字串解析
    if (typeof data[user_data.stage3] === 'string') {
        memory[userId].stage3++
        return client.replyMessage(replyToken, { type: 'text', text: data[user_data.stage3] })
    }
    // need 解析
    if (data[user_data.stage3].need) {
        let success = true
        for (let i = 0; i < data[user_data.stage3].need; i++) {
            const data2 = data[user_data.stage3].need[i]
            let valuable = user_data
            if (data2.type === 'global') {
                valuable = valuable[data2.valuable]
            } else if (data2.type === 'var') {
                valuable = user_data.var[data2.valuable]
            }
            if (!(!(data2.equal && valuable === data2.equal) || !(data2.min && valuable >= data2.min) || !(data2.max && valuable <= data2.max))) {
                success = false
                break
            }
        }
        if (!success) {
            if (data[user_data.stage3].type === 'block-start') {
                let i = user_data.stage3
                let iterate = 1
                while (iterate > 0) {
                    if (data[i].type === 'block-end') {
                        iterate--
                    } else if (data[i].type === 'block-start') {
                        iterate++
                    }
                    i++
                }
                memory[userId].stage3 = i
            }else{
                memory[userId].stage3++
            }
            return run(userId, replyToken)
        }
    }
    switch (data[user_data.stage3].type) {
        case 'text':

            break;
        default:
            break;
    }
}

exports.handleEvent = handleEvent;