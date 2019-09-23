const nanomsg   = require('nanomsg')
const msgpack   = require('msgpack-typed-numbers')
const Long      = require('long')
const timeout   = require('p-timeout')
const camelCase = require('camel-case')

const createClient = (options = {}) => {
    const oak = {
        __queue: [],
        __events: {},
        __commands: {},
        __uniqueid: null,
        __heartbeat: null,
        __working: false,
    };

    oak.__inbound = nanomsg.socket('respondent')
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

        oak.__working = true
        oak.__outbound.send(msgpack.encode([fn, args]))
    }

    const call = async (fn, ...args) => {
        let newargs = args;

        const conv = number => {
            if (typeof number !== 'number') {
                return number;
            }

            return new msgpack.Float(number)
        }

        /* handle conversion of arrays into floats */
        newargs = newargs.map(arg => {
            return Array.isArray(arg) ? arg.map(conv) : arg
        })

        newargs = newargs.map(conv)

        /* enrich string arguments with additional length args */
        newargs = newargs.reduce((c, arg) => {
            return c.concat(typeof arg == "string" ? [`${arg}\0`, unescape(encodeURIComponent(arg)).length] : [arg])
        }, [])

        const promise = new Promise((resolve, reject) => {
            oak.__queue.push([fn, newargs, resolve, reject])
            handle()
        })

        return timeout(promise, options.timeout || 500)
    }

    const trigger = (name, ...args) => oak.__events.hasOwnProperty(name)
        ? oak.__events[name].map(fn => fn.apply({}, args))
        : null

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
    oak.event('playerChat', (pid, msg) => {
        msg = msg.trim()

        if (msg.startsWith('/')) {
            const [cmd, ...args] = msg.replace('/', '').split(' ')

            if (!oak.__commands.hasOwnProperty(cmd)) {
                return trigger('unknownCommand', pid, msg)
            }

            oak.__commands[cmd].apply({}, [pid].concat(args))
        }
    })

    oak.log = (...args) => {
        oak.logn(args.map(a => typeof a != 'string' ? JSON.stringify(a) : a).join(' ') + '\n')
    }

    oak.__heartbeat = setInterval(() => {
        call('oak__heartbeat').then(async (uid) => {
            if (oak.__uniqueid == uid)
                return;

            if (oak.__uniqueid !== null)
                trigger("stop")

            oak.__uniqueid = uid;

            /* initialize first connection, and load methods */
            const data = await call('oak__methods')

            data.split(';').map(method => {
                oak[camelCase(method.replace('oak_', ''))] = call.bind(this, method)
            })

            trigger("start")
        }).catch(err => {
            if (oak.__uniqueid !== null) {
                oak.__uniqueid = null;
                trigger('stop')
            }
        })
    }, options.heartbeatInterval || 1000)

    return oak;
}

module.exports = createClient
