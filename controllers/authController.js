const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/hash');
const { signToken } = require('../utils/jwt');
const xss = require('xss');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password){
      return res.status(400).json({ ok: false, error: 'Missing fields' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ ok: false, error: 'Email already used' });
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({ name: xss(name), email: xss(email), passwordHash });
    const token = signToken({ sub: user._id });

    res.status(201).json({ ok: true, data: { user: { id: user._id, email: user.email, fullName: user.fullName }, token } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ ok: false, error: 'Register failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password){
      return res.status(400).json({ ok: false, error: 'Missing fields' });
    }
    const user = await User.findOne({ email });
    if (!user){
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }
    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }
    const token = signToken({ sub: user._id });
    res.json({ ok: true, data: { user: { id: user._id, email: user.email, fullName: user.fullName }, token } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ ok: false, error: 'Login failed' });
  }
};

const me = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  const u = await User.findById(req.user.id).select('-passwordHash');
  res.json({ ok: true, data: u });
};

module.exports = { register, login, me };