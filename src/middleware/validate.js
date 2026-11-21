const { ValidationError } = require("../errors/AppError");

function validate(schemas) {
  return (req, _res, next) => {
    const validated = {};

    for (const part of ["params", "query", "body"]) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part] ?? {});
      if (!result.success) {
        const details = result.error.issues.map((issue) => ({
          location: part,
          field: issue.path.join("."),
          message: issue.message,
        }));
        return next(new ValidationError(details));
      }

      validated[part] = result.data;
    }

    req.validated = validated;
    return next();
  };
}

module.exports = validate;
