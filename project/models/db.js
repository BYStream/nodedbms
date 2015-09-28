var cradle = require('cradle');
cradle.setup({
    host: 'localhost',
    port: 5984,
    cache: true,
    raw: false,
    forceSave: true
});
module.exports = new(cradle.Connection);
