const { createEventBus } = require("../../src/events/eventBus");

test("listener failure is isolated from publisher", async () => {
  const logger = { error: jest.fn() };
  const bus = createEventBus({ logger });
  const successful = jest.fn();
  bus.on("event", async () => { throw new Error("listener failed"); });
  bus.on("event", successful);
  await expect(bus.publish("event", { id: 1 })).resolves.toBeUndefined();
  expect(successful).toHaveBeenCalled();
  expect(logger.error).toHaveBeenCalled();
});
