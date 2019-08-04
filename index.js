const nanomsg = require('nanomsg')
const msgpack = require('msgpack-lite')

const createClient = (options = {}) => {
    const oak = {
        __queue: [],
        __events: {},
        __commands: {},
        __working: false,
    };

    oak.__inbound = nanomsg.socket('sub')
    oak.__outbound = nanomsg.socket('req')

    oak.__inbound.connect(options.inbound || 'ipc://oakwood-inbound')
    oak.__outbound.connect(options.outbound || 'ipc://oakwood-outbound')

    oak.__outbound.on('data', buffer => {
        const handler = oak.__queue.shift()
        const [err, data] = msgpack.decode(buffer)
        const [_1, _2, resolve, reject] = handler

        oak.__working = false
        setImmediate(handle)

        if (err) {
            reject(new Error(`method: ${_1}; ${data}`), err)
        } else {
            resolve(data)
        }
    })

    /* handle subscription events stream */
    oak.__inbound.on('data', buffer => {
        const [name, ...args] = msgpack.decode(buffer)
        if (!oak.__events.hasOwnProperty(name)) return
        oak.__events[name].map(handler => handler.apply({}, args))
    })

    const handle = () => {
        if (!oak.__queue.length)
            return;

        if (oak.__working)
            return;

        const [fn, args] = oak.__queue[0]
        const encoder = new msgpack.Encoder();

        encoder.write(fn)
        encoder.write(args)

        oak.__working = true
        oak.__outbound.send(encoder.read())
    }

    const call = async (fn, ...args) => {
        let newargs = args;

        /* handle conversion of arrays into floats */
        newargs = newargs.map(arg => {
            return Array.isArray(arg) ? arg.map(v => v + v * 0.00000001) : arg
        })

        newargs = newargs.map(v => {
            return typeof v == 'number' ? v + v * 0.0000000001 : v
        })

        /* enrich string arguments with additional length args */
        newargs = newargs.reduce((c, arg) => {
            return c.concat(typeof arg == "string" ? [arg, arg.length] : [arg])
        }, [])

        return new Promise((resolve, reject) => {
            oak.__queue.push([fn, newargs, resolve, reject])
            handle()
        })
    }

    /* initialize first connection, and load methods */
    call('oak__methods').then(data => {
        data.split(';').map(method => {
            oak[method.replace('oak_', '')] = call.bind(this, method)
        })

        if ("start" in oak.__events) {
            oak.__events["start"].map(fn => fn.apply({}))
        }
    })

    /* attach event handler impl */
    oak.event = (name, callback) => {
        if (!oak.__events.hasOwnProperty(name)) {
            oak.__events[name] = []
        }

        oak.__events[name].push(callback)
    }

    /* attach cmd handler impl */
    oak.cmd = (name, callback) => {
        oak.__commands[name] = callback
    }

    /* built-in chat->command handler */
    oak.event('player_chat', (pid, msg) => {
        if (msg.indexOf('/') === 0) {
            const [cmd, ...args] = msg.replace('/', '').split(' ')
            if (!oak.__commands.hasOwnProperty(cmd)) return
            oak.__commands[cmd].apply({}, [pid].concat(args))
        }
    })

    oak.log = (...args) => {
        oak.logn(args.map(a => typeof a != 'string' ? JSON.stringify(a) : a).join(' ') + '\n')
    }

    return oak;
}

module.exports = {
    createClient,
}
