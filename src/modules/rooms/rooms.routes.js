const express = require("express");
const validate = require("../../middleware/validate");
const { roomIdParams, createRoomBody } = require("./rooms.schemas");
function createRoomsRouter(c, authorize) {
  const r = express.Router();
  r.get("/", c.list);
  r.post("/", authorize("ADMIN"), validate({ body: createRoomBody }), c.create);
  r.get("/:id", validate({ params: roomIdParams }), c.getById);
  return r;
}
module.exports = { createRoomsRouter };
