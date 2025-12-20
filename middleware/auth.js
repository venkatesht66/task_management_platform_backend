const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const auth = async(req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ ok: false, error: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ ok: false, error: 'User not found' });
    req.user = { id: user._id, role: user.role };
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ ok: false, error: 'Invalid token' });
  }
};

module.exports = auth;