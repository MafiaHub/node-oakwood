const {createClient} = require('./')

const oak = createClient({
    inbound: 'tcp://192.168.1.3:10101',
    outbound: 'tcp://192.168.1.3:10102',
})

/* intiailization */

oak.event('start', async () => {
    console.log("[info] connected to the server")
    oak.log("[info] hello world from nodejs")

    oak.player_health_set(0, 100)
    oak.vehicle_position_set(0, [-10, -1764.23233, 0])
})

/* general player events */

const spawnplayer = pid => {
    oak.player_position_set(pid, [-1774.59301758, -4.88487052917, -2.40491962433])
    oak.player_health_set(pid, 200)
    oak.player_spawn(pid)
}

oak.event('player_connect', async pid => {
    console.log('[info] player connected', pid)
    spawnplayer(pid)
})

oak.event('player_death', async pid => {
    console.log('[info] player connected', pid)
    spawnplayer(pid)
})

oak.event('player_disconnect', pid => {
    console.log('[info] player disconnected', pid)
})

/* chat system */

oak.event('player_chat', async (pid, text) => {
    /* skip messages with commands */
    if (text.indexOf('/') === 0){
        return;
    }

    /* get author player name */
    const name = await oak.player_name_get(pid)
    const msg = `[chat] ${name}: ${text}`

    /* log stuff into our local console */
    console.log(msg)

    /* send messages to each clients' chat windows */
    oak.chat_broadcast(msg)
})

/* helper commands */

oak.cmd('spawn', async pid => {
    spawnplayer(pid)
})

oak.cmd('help', async (pid) => {
    console.log('player asks for help', pid)
    oak.chat_send('[info] sorry, we cant help you')
})

oak.cmd('goto', async (pid, targetid) => {
    const tid = parseInt(targetid)

    if (tid === NaN) {
        return oak.chat_send(pid, `[error] provided argument should be a valid number`)
    }

    if (await oak.player_invalid(tid)) {
        return oak.chat_send(pid, `[error] player you provided was not found`)
    }

    /* get target position */
    const pos = await oak.player_position_get(tid)

    /* set our player position */
    oak.player_position_set(pid, pos)
})
