const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please log in to continue.'
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token missing.'
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'supersecretnutritracktokenjwtkey2025';
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // { id, email, full_name }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid token. Please log in again.'
    });
  }
}

module.exports = authMiddleware;
