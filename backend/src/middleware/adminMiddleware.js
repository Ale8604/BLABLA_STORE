const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'ADMIN')
    return res.status(403).json({ error: 'Acceso restringido a administradores' });
  next();
};

module.exports = adminMiddleware;
