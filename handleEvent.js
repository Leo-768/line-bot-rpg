const richMenuAliasToId = require('./data/richMenus.json')
const { client, ref, memory, messages, altText } = require("./index")

async function handleEvent(event//:import('@line/bot-sdk').WebhookEvent
) {

    if (event.type === 'follow') {
        client.linkRichMenuToUser(event.source.userId, richMenuAliasToId['start'])
        return client.replyMessage(event.replyToken, messages['welcome'])
    }

    if (event.type === 'message' && event.message.type === 'text') {
        if (event.message.text === "666")
            return client.linkRichMenuToUser(event.source.userId, richMenuAliasToId['next'])
        await dataSetUp(event.source.userId)
        return client.replyMessage(event.replyToken, { type: 'text', text: toString((await ref.child(event.source.userId).get()).val()) })
    }

    if (event.type === 'postback') {
        if (event.postback.data.startsWith('ui')){
            if (event.postback.data === 'ui-start') {
                await dataSetUp(event.source.userId)
                client.linkRichMenuToUser(event.source.userId, richMenuAliasToId['next'])
                memory[event.source.userId] = { stage: 'begin', stage2: 0, stage3: 0 }
                ref.child(event.source.userId).update(memory[event.source.userId])
                return run(event.source.userId, event.replyToken)
                //client.replyMessage(event.replyToken, { type: 'text', text: '...' })//message(event.source.userId))
            } else if (event.postback.data === 'ui-next' && !memory[event.source.userId].choose_lock) {
                return run(event.source.userId, event.replyToken)
            }
        }else if (event.postback.data.startsWith('choose')){
            const args = event.postback.data.split('.')
            if (!memory.stage === args[1] && !memory.stage2 === args[2] && !memory.stage3 === args[3] ) return
            const data_index = require(`./data/story/${args[1]}/index.json`)
            const data = require(`./data/story/${args[1]}/${args[2]}.json`)
        }
    }

    return Promise.resolve(null);
}

async function dataSetUp(userId) {
    if (!memory[userId]) memory[userId] = (await ref.child(userId).get()).val() || {}
}


function run(userId, replyToken) {
    const user_data = JSON.parse(JSON.stringify(memory[userId]))
    const index = require(`./data/story/${user_data.stage}/index.json`)
    const data = require(`./data/story/${user_data.stage}/${index[user_data.stage2]}`)
    //user_data.stage3++
    if (!data[user_data.stage3]) {
        memory[userId].stage2++
        memory[userId].stage3 = 0
        return run(userId)
    }
    // 純字串解析
    if (typeof data[user_data.stage3] === 'string') {
        memory[userId].stage3++
        return client.replyMessage(replyToken, { type: 'text', text: textVar(data[user_data.stage3], user_data) })
    }
    // need 解析
    if (data[user_data.stage3].need) {
        let success = true
        for (let i of data[user_data.stage3].need) {
            let variable = variable_path(user_data, i.variable)
            if (i.type === 'variable') {
                if (!((i.equal === undefined || variable === i.equal) && (i.min === undefined || variable >= i.min) && (i.max === undefined || variable <= i.max))) {
                    success = false
                    break
                }
            }
        }
        if (!success) {
            if (data[user_data.stage3].type === 'block-start') {
                let i = user_data.stage3 + 1
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
            } else {
                memory[userId].stage3++
            }
            return run(userId, replyToken)
        }
    }
    switch (data[user_data.stage3].type) {
        case 'text':
            client.replyMessage(replyToken, { type: 'text', text: textVar(data[user_data.stage3].text, user_data) })
            memory[userId].stage3++
            break
        case 'choose':
            {
                let choose = []
                for (const i of data[user_data.stage3].choose) {
                    choose.push({
                        type: 'postback', label: i['display-text'], data: `choose-${user_data.stage}-${user_data.stage2}-${user_data.stage3}`, displayText: (() => {
                            if (i['send-text'] === undefined) return i['display-text']
                            if (i['send-text'] === '') return null
                            return i['send-text']
                        })()
                    })
                }
                client.replyMessage(replyToken, {
                    type: 'template', altText: altText, template: {
                        type: 'buttons',
                        text: data[user_data.stage3].text,
                        actions: choose
                    }
                })
                memory[userId].choose_lock = true
            }
        default:
            break
    }
}

function textVar(text, variable) {
    return text.replace(/%(.*?)%/g, (match, p1, offset, string) => { return variable_path(variable, p1) }).replaceAll(':percent-sign:', '%')
}

function variable_path(variable, path) {
    for (let i of path.split('.')) {
        variable = variable[i]
    }
    return variable
}

exports.handleEvent = handleEvent;
