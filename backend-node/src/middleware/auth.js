import jwt from 'jsonwebtoken';

function getToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

export function requireAuth(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ msg: 'Missing token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = { id: decoded.sub, role: decoded.role };
    return next();
  } catch (e) {
    return res.status(401).json({ msg: 'Invalid token' });
  }
}

export function requireRole(roles = []) {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (!userRole) return res.status(403).json({ msg: 'Forbidden' });
    if (!roles.includes(userRole)) return res.status(403).json({ msg: 'Forbidden' });
    return next();
  };
}

