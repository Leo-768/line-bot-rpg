const { client, ref, memory, data } = require("./index")
require('dotenv').config()

async function handleEvent(event) {
    if (!memory.users[event.source.userId]) memory.users[event.source.userId] = (await ref.child('users').child(event.source.userId).get()).val() || {}

    if (event.type === 'follow') {
        if (JSON.stringify(memory.users[event.source.userId]) === '{}') menu(event.source.userId, 'start', true)
        return client.replyMessage(event.replyToken, data.messages['welcome'])
    }

    if (memory.coldown[event.source.userId] !== true && event.type === 'message' && event.message.type === 'text') {
        if (event.message.text === 'menu' && memory.users[event.source.userId].menu) {
            client.linkRichMenuToUser(event.source.userId, data.richmenus[memory.users[event.source.userId].menu])
            let msg = require(`./data/imagemap/${memory.users[event.source.userId].menu}.json`)
            msg.type = 'imagemap'
            msg.baseUrl = process.env.URL + '/file/menu/' + memory.users[event.source.userId].menu
            return client.replyMessage(event.replyToken, msg)
        }
        if (memory.users[event.source.userId].typing){
            const data_index = require(`./data/story/${memory.users[event.source.userId].stage.stage}/index.json`)
            const story = require(`./data/story/${memory.users[event.source.userId].stage.stage}/${data_index[memory.users[event.source.userId].stage.stage2]}`)
            memory.users[event.source.userId].lasttype = event.message.text
            memory.users[event.source.userId].choose_lock = false
            memory.users[event.source.userId].typing = false
            if (story[memory.users[event.source.userId].stage.stage3].action) do_action(story[memory.users[userId].stage.stage3].action, event.source.userId)
            memory.users[event.source.userId].stage.stage3++
            run(event.source.userId, event.replyToken)
        }
        return getData(event.source.userId, event.replyToken, event.message.text)
    }

    if (event.type === 'postback' && memory.coldown[event.source.userId] !== true) getData(event.source.userId, event.replyToken, event.postback.data)

    return Promise.resolve(null)
}

function getData(userId, replyToken, data) {
    memory.coldown[userId] = true
    setTimeout(() => {
        memory.coldown[userId] = false
    }, 500)
    if (data.startsWith('ui')) {
        if (data === 'ui-start') {
            memory.users[userId] = { stage: {stage: 'begin', stage2: 0, stage3: 0}, var: { none: true } }
            return run(userId, replyToken)
        } else if (data === 'ui-next' && !memory.users[userId].choose_lock) {
            return run(userId, replyToken)
        }
    } else if (data.startsWith('choose')) {
        const args = data.split('-')
        if (!memory.users[userId].choose_lock || !(memory.users[userId].stage.stage === args[1]) || !(memory.users[userId].stage.stage2 === +args[2]) || !(memory.users[userId].stage.stage3 === +args[3])) return
        const data_index = require(`./data/story/${args[1]}/index.json`)
        const story = require(`./data/story/${args[1]}/${data_index[args[2]]}`)
        memory.users[userId].lastchoose = +args[4]
        memory.users[userId].choose_lock = false
        if (story[memory.users[userId].stage.stage3].choose[args[4]].action) do_action(story[memory.users[userId].stage.stage3].choose[args[4]].action, userId)
        if (memory.users[userId].jumpping){
            delete memory.users[userId].jumpping
        }else{
            memory.users[userId].stage.stage3++
        }
        run(userId, replyToken)
    }
}

function run(userId, replyToken) {
    const user_data = JSON.parse(JSON.stringify(memory.users[userId]))
    const index = require(`./data/story/${user_data.stage.stage}/index.json`)
    const story = require(`./data/story/${user_data.stage.stage}/${index[user_data.stage.stage2]}`)
    const now = story[user_data.stage.stage3]
    if (!now) {
        memory.users[userId].stage.stage2++
        memory.users[userId].stage.stage3 = 0
        return run(userId, replyToken)
    }
    // ???????????????
    if (typeof now === 'string') {
        memory.users[userId].stage.stage3++
        menu(userId, 'next')
        return client.replyMessage(replyToken, { type: 'text', text: textVar(now, user_data) })
    }
    // need ??????
    if (now.need) {
        let success = true
        for (const i of now.need) {
            let variable = path_variable(user_data, i.variable)
            if (i.type === 'variable') {
                if (i.equal !== undefined) {
                    if(Array.isArray(i.equal)){
                        if(i.equal.indexOf(variable) !== -1){
                            success = !i.not
                        }else{
                            success = !!i.not
                        }
                    }else if (variable === i.equal){
                        success = !i.not
                    }else{
                        success =!!i.not
                    }
                } else if ((i.min === undefined || variable >= i.min) && (i.max === undefined || variable <= i.max)) {
                    success = !i.not
                } else {
                    success = !!i.not
                }
            }
            if (!success) break
        }
        if (!success) {
            if (now.type === 'block-start') {
                let i = user_data.stage.stage3 + 1
                let iterate = 1
                while (iterate > 0) {
                    if (story[i].type === 'block-end') {
                        iterate--
                    } else if (story[i].type === 'block-start') {
                        iterate++
                    }
                    i++
                }
                memory.users[userId].stage.stage3 = i
            } else {
                memory.users[userId].stage.stage3++
            }
            return run(userId, replyToken)
        }
    }
    switch (now.type) {
        case 'text':
            client.replyMessage(replyToken, { type: 'text', text: textVar(now.text, user_data) })
            menu(userId, 'next')
            break
        case '---':
            client.replyMessage(replyToken, {
                type: 'flex',
                altText: data.altText,
                contents: {
                    type: 'bubble',
                    size: 'giga',
                    body: {
                        type: 'box',
                        layout: 'vertical',
                        contents: [{
                            type: 'separator',
                            margin: 'xs'
                        }]
                    }
                }
            })
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
                        type: 'postback', label: textVar(i['display-text'], memory), data: `choose-${user_data.stage.stage}-${user_data.stage.stage2}-${user_data.stage.stage3}-${j}`, displayText: (() => {
                            if (i['send-text'] === undefined) return textVar(i['display-text'], memory)
                            if (i['send-text'] === '') return undefined
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
            menu(userId)
            memory.users[userId].choose_lock = true
            return
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
                    break
            }
            menu(userId, 'next')
            break
        }
        case 'anchor':
            memory.users[userId].anchor[now.anchor] = now.set
            break
        case 'stop':
            break
        default:
            if (now.input){
                menu(userId)
                memory.users[userId].choose_lock = true
                memory.users[userId].typing = true
                memory.users[userId].stage.stage3--
            }
            if (now.action) {
                do_action(now.action, userId, user_data)
            }
            if (memory.users[userId].jumpping){
                delete memory.users[userId].jumpping
            }else{
                memory.users[userId].stage.stage3++
            }
            return run(userId, replyToken)
    }
    if (now.input) {
        menu(userId)
        memory.users[userId].choose_lock = true
        memory.users[userId].typing = true
        memory.users[userId].jumpping = true
    }
    if (now.action) {
        do_action(now.action, userId, user_data)
    }
    if (memory.users[userId].jumpping){
        delete memory.users[userId].jumpping
    }else{
        memory.users[userId].stage.stage3++
    }
}

function do_action(actions, userId, user_data = JSON.parse(JSON.stringify(memory.users[userId]))) {
    for (const iterator of actions) {
        switch (iterator.type) {
            case 'menu':
                menu(userId, iterator.menu || false, true)
                break
            case 'set':
                if(typeof iterator.set === 'string') iterator.set = textVar(iterator.set,memory.users[userId])
                path_variable(memory.users[userId], iterator.var, iterator.set)
                return
            case 'add':
                path_variable(memory.users[userId], iterator.var, iterator.add, true)
                return
            case 'jump':
                switch (iterator.jump) {
                    case 'stage':
                        memory.users[userId].stage = {stage: iterator.set,stage2: 0, stage3: 0}
                        break
                    case 'stage2':
                        memory.users[userId].stage.stage2 = iterator.set || user_data.stage.stage2 + iterator.add || 0
                        memory.users[userId].stage.stage3 = 0
                        break
                    case 'stage3':
                        memory.users[userId].stage.stage3 = iterator.set || user_data.stage.stage3 + iterator.add || 0
                        break
                    default:
                        if (memory.users[userId].anchor[iterator.jump]) memory.users[userId].stage = memory.users[userId].anchor[iterator.jump]
                        memory.users[userId].stage = data.tags[iterator.jump]
                        break
                }
                memory.users[userId].jumpping = true
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
    if (typeof set === 'undefined') return new Function('variable', `return variable.${path}`)(variable)
    if (add) return new Function('variable', 'set', `variable.${path}+=set`)(variable, set)
    return new Function('variable', 'set', `variable.${path}=set`)(variable, set)
}

function menu(userId, set = false, cover = false) {
    if (set) {
        if (memory.users[userId].menu === set || memory.users[userId].menu && !cover) return
        client.linkRichMenuToUser(userId, data.richmenus[set])
        memory.users[userId].menu = set
    } else if (memory.users[userId].menu) {
        client.unlinkRichMenuFromUser(userId)
        delete memory.users[userId].menu
    }
}

exports.handleEvent = handleEvent
