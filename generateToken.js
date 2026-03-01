const jwt = require("jsonwebtoken");

const token = jwt.sign(
  { userId: "12345" },
  "mysecretkey",   // use same as JWT_SECRET in .env
  { expiresIn: "1h" }
);

console.log(token);