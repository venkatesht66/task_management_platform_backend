const bcrypt = require('bcryptjs');

const hashPassword = async(pwd) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pwd, salt);
}

const comparePassword = async(pwd, hash) => {
  return bcrypt.compare(pwd, hash);
}

module.exports = { hashPassword, comparePassword };