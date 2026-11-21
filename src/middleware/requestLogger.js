const { randomUUID } = require("node:crypto");

function requestLogger(req, res, next) {
  req.id = req.get("X-Request-Id") || randomUUID();
  res.set("X-Request-Id", req.id);
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    console.log(
      `[${req.id}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${elapsedMs.toFixed(1)} ms)`,
    );
  });

  next();
}

module.exports = requestLogger;
