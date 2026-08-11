const jwt = require('jsonwebtoken');
const { authRequired } = require('./auth');

function repAuthRequired(req, res, next) {
  authRequired(req, res, () => {
    if (req.user?.role !== 'representative') {
      return res.status(403).json({ error: 'rep_required' });
    }
    return next();
  });
}

function signRepToken(rep) {
  return jwt.sign(
    {
      id: rep.id,
      email: rep.email,
      fullName: rep.full_name || null,
      role: 'representative',
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' },
  );
}

module.exports = { repAuthRequired, signRepToken };
