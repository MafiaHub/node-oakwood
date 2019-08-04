# oakwood-node

A library that connects to your server and allows you to write custom gamemodes/scripts/tools.

## Instructions

All you need to to is to install the oakwood dependency, and use `require` it into your nodejs project.

```$ npm i oakwood --save```

## Example

A minimal example showcasing the basic usage of the library.

```js
const {createClient} = require('oakwood')
const oak = createClient()

oak.event('start', async () => {
    console.log("[info] connected to the server")
    oak.log("[info] hello world from nodejs")
})

oak.event('player_connect', async pid => {
    console.log('[info] player connected', pid)

    oak.player_position_set(pid, [-1774.59301758, -4.88487052917, -2.40491962433])
    oak.player_health_set(pid, 200)
    oak.player_spawn(pid)
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
```

A more detailed example can be checked out in [example.js](example.js) file.
