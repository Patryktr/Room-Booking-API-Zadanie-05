const knexFactory = require("knex");
const config = require("../../knexfile");
module.exports = knexFactory(config);
