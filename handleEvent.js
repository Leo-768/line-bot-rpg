const richMenuAliasToId = require('./data/richMenus.json')
const { client, ref, memory, messages, altText } = require("./index")

async function handleEvent(event//:import('@line/bot-sdk').WebhookEvent
) {

    if (!memory.users[event.source.userId]) memory.users[event.source.userId] = (await ref.child('users').child(event.source.userId).get()).val() || { test: true }

    if (event.type === 'follow') {
        client.linkRichMenuToUser(event.source.userId, richMenuAliasToId['start'])
        return client.replyMessage(event.replyToken, messages['welcome'])
    }

    if (event.type === 'message' && event.message.type === 'text') {
        return client.replyMessage(event.replyToken, { type: 'text', text: JSON.stringify(memory.users) + "\n----\n" + (await ref.child('users').child(event.source.userId).get()).val() })
    }

    if (event.type === 'postback') {
        if (event.postback.data.startsWith('ui')) {
            if (event.postback.data === 'ui-start') {
                client.linkRichMenuToUser(event.source.userId, richMenuAliasToId['next'])
                memory.users[event.source.userId] = { stage: 'begin', stage2: 0, stage3: 0 }
                ref.child(event.source.userId).update(memory.users[event.source.userId])
                return run(event.source.userId, event.replyToken)
            } else if (event.postback.data === 'ui-next' && !memory.users[event.source.userId].choose_lock) {
                return run(event.source.userId, event.replyToken)
            }
        } else if (event.postback.data.startsWith('choose')) {
            const args = event.postback.data.split('-')
            if (!memory.users[event.source.userId].choose_lock && !memory.users[event.source.userId].stage === args[1] && !memory.users[event.source.userId].stage2 === args[2] && !memory.users[event.source.userId].stage3 === args[3]) return
            const data_index = require(`./data/story/${args[1]}/index.json`)
            const data = require(`./data/story/${args[1]}/${data_index[args[2]]}.json`)
            if (data[memory.users[event.source.userId].stage3].choose[args[4]].action) do_action(data[memory.users[event.source.userId].stage3].choose[args[4]].action)
            memory.users[event.source.userId].lastchoose = args[4]
            memory.users[event.source.userId].choose_lock = false
            memory.users[event.source.userId].stage3++
            run(event.source.userId, event.replyToken)
        }
    }

    return Promise.resolve(null)
}

function run(userId, replyToken) {
    const user_data = JSON.parse(JSON.stringify(memory.users[userId]))
    const index = require(`./data/story/${user_data.stage}/index.json`)
    const data = require(`./data/story/${user_data.stage}/${index[user_data.stage2]}`)
    const now = data[user_data.stage3]
    if (!now) {
        memory.users[userId].stage2++
        memory.users[userId].stage3 = 0
        return run(userId)
    }
    // 純字串解析
    if (typeof now === 'string') {
        memory.users[userId].stage3++
        return client.replyMessage(replyToken, { type: 'text', text: textVar(now, user_data) })
    }
    // need 解析
    if (now.need) {
        let success = true
        for (const i of now.need) {
            let variable = variable_path(user_data, i.variable)
            if (i.type === 'variable') {
                if (!((i.equal === undefined || variable === i.equal) && (i.min === undefined || variable >= i.min) && (i.max === undefined || variable <= i.max))) {
                    success = false
                    break
                }
            }
        }
        if (!success) {
            if (now.type === 'block-start') {
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
                memory.users[userId].stage3 = i
            } else {
                memory.users[userId].stage3++
            }
            return run(userId, replyToken)
        }
    }
    switch (now.type) {
        case 'text':
            client.replyMessage(replyToken, { type: 'text', text: textVar(now.text, user_data) })
            memory.users[userId].stage3++
            break
        case 'choose': {
            let choose = []
            for (const i of now.choose) {
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
                    text: now.text,
                    actions: choose
                }
            })
            client.unlinkRichMenuFromUser(userId)
            memory.users[userId].choose_lock = true
        }
        default:
            break
    }
}

function do_action(actions) {
    return
}

function textVar(text, variable) {
    return text.replace(/%(.*?)%/g, (match, p1, offset, string) => { return variable_path(variable, p1) }).replaceAll(':percent-sign:', '%')
}

function variable_path(variable, path) {
    for (const i of path.split('.')) {
        variable = variable[i]
    }
    return variable
}

exports.handleEvent = handleEvent