// misc helpers
const crypto = require("crypto");

// uuid4 is 36 chars including hyphens 123e4567-e89b-12d3-a456-426614174000
// the secret format has been 32 chars no hyphens.
function newSecret()  {
  return crypto.randomUUID().replaceAll("-" , "");
}

module.exports = {
  newSecret,
}