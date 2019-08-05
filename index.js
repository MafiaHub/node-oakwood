const constants = {
    OAK_VISIBILITY_NAME      : 0,
    OAK_VISIBILITY_ICON      : 1,
    OAK_VISIBILITY_RADAR     : 2,
    OAK_VISIBILITY_MODEL     : 3,
    OAK_VISIBILITY_COLLISION : 4,

    OAK_SEAT_FRONT_LEFT      : 0,
    OAK_SEAT_FRONT_RIGHT     : 1,
    OAK_SEAT_REAR_LEFT       : 2,
    OAK_SEAT_REAR_RIGHT      : 3,
}

module.exports = Object.assign({},
    require('./src/main.js'),
    require('./src/players.js'),
    require('./src/vehicles.js'),
    constants,
)
