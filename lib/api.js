const { handleRecover } = require("./recover");
const { handleReport } = require("./report");

async function handleApi(request, env) {
  const url = new URL(request.url);

  if (url.pathname === "/api/recover") {
    return handleRecover(request);
  }
  if (url.pathname === "/api/report") {
    return handleReport(request, env);
  }

  return null;
}

module.exports = { handleApi };
