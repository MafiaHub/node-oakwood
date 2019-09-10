# oakwood-node

A library that connects to your server and allows you to write custom gamemodes/scripts/tools.

## Instructions

While getting `oakwood` package is as simple as installing it via `npm`, it requires a specific dependencies to be met depending on a platform:

### Ubuntu

To install `oakwood` package on Ubuntu, you need to install prerequisite system packages we use natively:
1. `$ apt install nanomsg`
2. `$ apt install libnanomsg-dev`
3. Follow the rest of the guide.

### Windows

On Windows, we need to make sure essential build tools are installed on the machine:
1. `npm install --global windows-build-tools`
2. Then we can safely follow the rest of the guide.

### Setup

First, we need to install the oakwood package. Having met the system dependencies, oakwood package should be successfully built and installed to your folder via:
```$ npm i oakwood --save```

Afterwards, you can simply create a new file such as `freeride.js`, copy an example from below and launch it to start the gamemode. As you can see, using the oakwood package is just matter of `require`-ing specific methods or resources you need.

Don't forget to set up your connection strings on both sides so that your gamemode can communicate with the server!

## Documentation

You can visit the following [docs page](https://docs.oakwood-mp.net/public-api) to learn more about the API we use. You can also find an interesting read about how this gamemode works behind the scene here.

## Example

A minimal example showcasing the basic usage of the library.

```js
const {createClient} = require('oakwood')
const oak = createClient()

oak.event('start', async () => {
    console.log("[info] connected to the server")
    oak.log("[info] hello world from nodejs")
})

oak.event('playerConnect', async pid => {
    console.log('[info] player connected', pid)

    oak.playerPositionSet(pid, [-1774.59301758, -4.88487052917, -2.40491962433])
    oak.playerHealthSet(pid, 200)
    oak.playerSpawn(pid)
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
```

A more detailed example can be checked out in [example.js](example.js) file.
