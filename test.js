const WP = require('./index')
const wirePusher = new WP(process.env.WIREPUSHER_TEST_ID)
wirePusher.notify({ title: 'title', message: 'message', type: 'type' }).then(success => {
    console.log('Notification successfully sent!', success)
}, failure => {
    console.error('Sending failed', failure)
})