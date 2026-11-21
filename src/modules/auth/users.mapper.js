function toUserResponse(u) {
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    createdAt: new Date(u.createdAt).toISOString(),
  };
}
module.exports = { toUserResponse };
