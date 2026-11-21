const { toReservationResponse } = require("./reservations.mapper");
function createReservationsController(service) {
  return {
    async create(req, res) {
      const x = await service.createReservation(req.validated.body, req.user);
      res.location(`/api/reservations/${x.id}`);
      return res.status(201).json(toReservationResponse(x));
    },
    async list(req, res) {
      const x = await service.listReservations(req.validated.query, req.user);
      return res.json({
        data: x.data.map(toReservationResponse),
        meta: x.meta,
      });
    },
    async getById(req, res) {
      return res.json(
        toReservationResponse(
          await service.getReservation(req.validated.params.id, req.user),
        ),
      );
    },
    async cancel(req, res) {
      return res.json(
        toReservationResponse(
          await service.cancelReservation(req.validated.params.id, req.user),
        ),
      );
    },
  };
}
module.exports = { createReservationsController };
