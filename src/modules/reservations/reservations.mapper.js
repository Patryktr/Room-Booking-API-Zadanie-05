function toReservationResponse(r) {
  return {
    id: r.id,
    roomId: r.roomId,
    ...(r.room
      ? {
          room: {
            id: r.room.id,
            name: r.room.name,
            building: r.room.building
              ? { id: r.room.building.id, name: r.room.building.name }
              : null,
          },
        }
      : {}),
    user: r.user ? { id: r.user.id, email: r.user.email } : null,
    participants: r.participants,
    startTime: new Date(r.startTime).toISOString(),
    endTime: new Date(r.endTime).toISOString(),
    status: r.status,
    createdAt: new Date(r.createdAt).toISOString(),
    cancelledAt: r.cancelledAt ? new Date(r.cancelledAt).toISOString() : null,
  };
}
module.exports = { toReservationResponse };
