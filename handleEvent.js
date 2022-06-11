const { client, ref, memory, data } = require("./index")

async function handleEvent(event//:import('@line/bot-sdk').WebhookEvent
) {

    if (!memory.users[event.source.userId]) memory.users[event.source.userId] = (await ref.child('users').child(event.source.userId).get()).val() || {}

    if (event.type === 'follow') {
        client.linkRichMenuToUser(event.source.userId, data.richmenus['start'])
        return client.replyMessage(event.replyToken, data.messages['welcome'])
    }

    if (event.type === 'message' && event.message.type === 'text') {
        return client.replyMessage(event.replyToken, { type: 'text', text: JSON.stringify(memory.users) + "\n----\n" + (await ref.child('users').child(event.source.userId).get()).val() })
    }

    if (event.type === 'postback' && memory.coldown[event.source.userId] !== true) {
        memory.coldown[event.source.userId] = true
        setTimeout(() => {
            memory.coldown[event.source.userId] = false
        }, 500)
        if (event.postback.data.startsWith('ui')) {
            if (event.postback.data === 'ui-start') {
                client.linkRichMenuToUser(event.source.userId, data.richmenus['next'])
                memory.users[event.source.userId] = { stage: 'begin', stage2: 0, stage3: 0 }
                return run(event.source.userId, event.replyToken)
            } else if (event.postback.data === 'ui-next' && !memory.users[event.source.userId].choose_lock) {
                return run(event.source.userId, event.replyToken)
            }
        } else if (event.postback.data.startsWith('choose')) {
            const args = event.postback.data.split('-')
            if (!memory.users[event.source.userId].choose_lock || !(memory.users[event.source.userId].stage === args[1]) || !(memory.users[event.source.userId].stage2 === +args[2]) || !(memory.users[event.source.userId].stage3 === +args[3])) return
            const data_index = require(`./data/story/${args[1]}/index.json`)
            const story = require(`./data/story/${args[1]}/${data_index[args[2]]}`)
            memory.users[event.source.userId].lastchoose = +args[4]
            memory.users[event.source.userId].choose_lock = false
            client.linkRichMenuToUser(event.source.userId, data.richmenus['next'])
            if (story[memory.users[event.source.userId].stage3].choose[args[4]].action) {
                do_action(story[memory.users[event.source.userId].stage3].choose[args[4]].action, event.source.userId)
            } else {
                memory.users[event.source.userId].stage3++
            }
            run(event.source.userId, event.replyToken)
        }
    }

    return Promise.resolve(null)
}

function run(userId, replyToken) {
    const user_data = JSON.parse(JSON.stringify(memory.users[userId]))
    const index = require(`./data/story/${user_data.stage}/index.json`)
    const story = require(`./data/story/${user_data.stage}/${index[user_data.stage2]}`)
    const now = story[user_data.stage3]
    if (!now) {
        memory.users[userId].stage2++
        memory.users[userId].stage3 = 0
        return run(userId, replyToken)
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
            let variable = path_variable(user_data, i.variable)
            if (i.type === 'variable') {
                if (((i.equal === undefined || variable === i.equal) && (i.min === undefined || variable >= i.min) && (i.max === undefined || variable <= i.max))) {
                    success = !i.not
                } else {
                    success = !!i.not
                }
            }
            if (!success) break
        }
        if (!success) {
            if (now.type === 'block-start') {
                let i = user_data.stage3 + 1
                let iterate = 1
                while (iterate > 0) {
                    if (story[i].type === 'block-end') {
                        iterate--
                    } else if (story[i].type === 'block-start') {
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
            let choose = [{
                type: 'separator',
                margin: 'xs'
            }]
            now.choose.forEach((i, j) => {
                choose.push({
                    type: 'button',
                    action: {
                        type: 'postback', label: textVar(i['display-text'], memory), data: `choose-${user_data.stage}-${user_data.stage2}-${user_data.stage3}-${j}`, displayText: (() => {
                            if (i['send-text'] === undefined) return textVar(i['display-text'], memory)
                            if (i['send-text'] === '') return null
                            return textVar(i['send-text'], memory)
                        })()
                    },
                    style: 'secondary'
                })
                choose.push({
                    type: 'separator',
                    margin: 'xs'
                })
            })
            client.replyMessage(replyToken, {
                type: 'flex',
                altText: data.altText,
                contents: {
                    type: 'bubble',
                    size: 'giga',
                    body: {
                        type: 'box',
                        layout: 'vertical',
                        contents: choose
                    }
                }
            })
            client.unlinkRichMenuFromUser(userId)
            memory.users[userId].choose_lock = true
            break
        }
        case 'image': {
            const url = process.env.URL + '/file/' + now.image
            switch (now.image.type) {
                case '':

                    break
                default:
                    client.replyMessage(replyToken, {
                        type: 'image',
                        originalContentUrl: url,
                        previewImageUrl: url
                    })
                    memory.users[userId].stage3++
                    break
            }
        }
        default:
            memory.users[userId].stage3++
            break
    }
    if (now.action) {
        do_action(now.action, userId)
    }
}

function do_action(actions, userId) {
    for (const iterator of actions) {
        switch (iterator.type) {
            case 'linkrichmenu':
                client.linkRichMenuToUser(userId, data.richmenus[iterator.menu])
                break
            case 'unlinkrichmenu':
                client.unlinkRichMenuFromUser(userId)
                break
            case 'varset':
                path_variable(memory.users[userId], iterator.var, iterator.set)
                return
            case 'varadd':
                path_variable(memory.users[userId], iterator.var, iterator.add, true)
                return
            case 'jump':
                switch (iterator.jump) {
                    case 'stage':
                        memory.users[userId].stage = iterator.set
                        memory.users[userId].stage2 = 0
                        memory.users[userId].stage3 = 0
                        break
                    case 'stage2':
                        memory.users[userId].stage2 = iterator.set || memory.users[userId].stage2 + iterator.add
                        memory.users[userId].stage3 = 0
                        break
                    case 'stage3':
                        memory.users[userId].stage3 = iterator.set || memory.users[userId].stage3 + iterator.add
                        break
                    default:
                        memory.users[userId].stage = data.tags[iterator.jump].stage
                        memory.users[userId].stage2 = data.tags[iterator.jump].stage2
                        memory.users[userId].stage3 = data.tags[iterator.jump].stage3
                        break
                }
                break
            default:
                break
        }
    }
    return
}

function textVar(text, variable) {
    return text.replace(/%(.*?)%/g, (match, p1, offset, string) => { return path_variable(variable, p1) }).replaceAll(':percent-sign:', '%')
}

function path_variable(variable, path, set, add) {
    if (typeof set === 'undefined') return new Function('variable', `return variable["${path.replace('.', '"]["')}"]`)(variable)
    if (add) return new Function('variable', 'set', `variable["${path.replace('.', '"]["')}"]+=set`)(variable, set)
    return new Function('variable', 'set', `variable["${path.replace('.', '"]["')}"]=set`)(variable, set)
}


exports.handleEvent = handleEvent
