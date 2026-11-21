const express = require("express");
const validate = require("../../middleware/validate");
const {
  idParams,
  listReservationsQuery,
  createReservationBody,
} = require("./reservations.schemas");
function createReservationsRouter(c) {
  const r = express.Router();
  r.get("/", validate({ query: listReservationsQuery }), c.list);
  r.post("/", validate({ body: createReservationBody }), c.create);
  r.get("/:id", validate({ params: idParams }), c.getById);
  r.patch("/:id/cancel", validate({ params: idParams }), c.cancel);
  return r;
}
module.exports = { createReservationsRouter };
