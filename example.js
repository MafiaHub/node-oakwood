const assert = require('assert')
const {createClient} = require('./')

const oak = createClient({
    inbound: 'tcp://192.168.1.3:10101',
    outbound: 'tcp://192.168.1.3:10102',
})

/* intiailization */

oak.event('start', async () => {
    console.log("[info] connected to the server")
    oak.log("[info] hello world from nodejs")
})

oak.event('stop', async () => {
    console.log('[info] stop has been called')
})

/* general player events */

const spawnPlayer = pid => {
    oak.playerPositionSet(pid, [-1774.59301758, -4.88487052917, -2.40491962433])
    oak.playerHealthSet(pid, 200)
    oak.playerSpawn(pid)
}

oak.event('playerConnect', async pid => {
    console.log('[info] player connected', pid)
    spawnPlayer(pid)
})

oak.event('playerDeath', async pid => {
    console.log('[info] player connected', pid)
    spawnPlayer(pid)
})

oak.event('playerDisconnect', pid => {
    console.log('[info] player disconnected', pid)
})

/* chat system */

oak.event('playerChat', async (pid, text) => {
    /* skip messages with commands */
    if (text.indexOf('/') === 0){
        return;
    }

    /* get author player name */
    const name = await oak.playerNameGet(pid)
    const msg = `[chat] ${name}: ${text}`

    /* log stuff into our local console */
    console.log(msg)

    /* send messages to each clients' chat windows */
    oak.chatBroadcast(msg)
})

/* helper commands */

oak.cmd('spawn', async pid => {
    spawnPlayer(pid)
})

oak.cmd('help', async (pid) => {
    console.log('player asks for help', pid)
    oak.chatSend(pid, '[info] sorry, we cant help you')
})

oak.cmd('goto', async (pid, targetid) => {
    const tid = parseInt(targetid)

    if (tid === NaN) {
        return oak.chatSend(pid, `[error] provided argument should be a valid number`)
    }

    if (await oak.playerInvalid(tid)) {
        return oak.chatSend(pid, `[error] player you provided was not found`)
    }

    /* get target position */
    const pos = await oak.playerPositionGet(tid)

    /* set our player position */
    oak.playerPositionSet(pid, pos)
})
