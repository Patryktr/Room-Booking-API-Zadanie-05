function registerEventListeners({ eventBus, auditLogRepository }) {
  for (const eventType of ["reservation.created", "reservation.cancelled"])
    eventBus.on(eventType, (payload) =>
      auditLogRepository.create({ eventType, payload }),
    );
  eventBus.on("reservation.cancelled", (payload) => {
    if (payload.cancelledBy !== payload.userId)
      console.log(`[notification] to: <email właściciela rezerwacji ${payload.reservationId}>`);
  });
}

module.exports = { registerEventListeners };
