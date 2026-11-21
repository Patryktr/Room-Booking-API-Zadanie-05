const express = require("express");
const validate = require("../../middleware/validate");
const { idParams, createBuildingBody } = require("./buildings.schemas");
function createBuildingsRouter(c, authorize) {
  const r = express.Router();
  r.get("/", c.list);
  r.post(
    "/",
    authorize("ADMIN"),
    validate({ body: createBuildingBody }),
    c.create,
  );
  r.get("/:id/rooms", validate({ params: idParams }), c.listRooms);
  r.get("/:id", validate({ params: idParams }), c.getById);
  return r;
}
module.exports = { createBuildingsRouter };
