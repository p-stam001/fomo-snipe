const { handleRequest } = require("./lib/router");

module.exports = {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, env.ASSETS);
  },
};
