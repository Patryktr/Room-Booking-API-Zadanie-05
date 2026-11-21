const { EventEmitter } = require("node:events");

function createEventBus({ logger = console } = {}) {
  const emitter = new EventEmitter();
  return {
    on: (eventName, listener) => emitter.on(eventName, listener),
    async publish(eventName, payload) {
      const results = await Promise.allSettled(
        emitter.listeners(eventName).map((listener) => listener(payload)),
      );
      results.forEach((result) => {
        if (result.status === "rejected")
          logger.error(`[event:${eventName}] listener failed`, result.reason);
      });
    },
  };
}

module.exports = { createEventBus };
