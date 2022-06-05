const Pusher = require('pusher');

const pusher = new Pusher({
    appId: "1419107",
    key: "9ed5b6068ed8653fce89",
    secret: "81fc490d4fbecba053e7",
    cluster: "ap1",
    useTLS: true
});

module.exports = pusher;
