const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

const register = async (req, res) => {
  try {
    const { email, password, nombre, apellido, cedula, telefono, direccion } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    if (password.length < 8)
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });

    // Verificaciones en paralelo para mayor velocidad
    const [emailExists, cedulaExists, telefonoExists] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      cedula   ? prisma.user.findFirst({ where: { cedula } })   : null,
      telefono ? prisma.user.findFirst({ where: { telefono } }) : null,
    ]);

    if (emailExists)
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo electrónico.' });
    if (cedulaExists)
      return res.status(409).json({ error: 'Ya existe una cuenta registrada con esa cédula.' });
    if (telefonoExists)
      return res.status(409).json({ error: 'Ya existe una cuenta registrada con ese número de teléfono.' });

    const role   = email === process.env.ADMIN_EMAIL ? 'ADMIN' : 'CLIENT';
    const hashed = await bcrypt.hash(password, 10);
    const user   = await prisma.user.create({
      data: { email, password: hashed, role, nombre, apellido, cedula, telefono, direccion },
    });

    res.status(201).json({ token: signToken(user), role: user.role });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Error interno al crear la cuenta' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return res.status(401).json({ error: 'Credenciales incorrectas' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: 'Credenciales incorrectas' });

    res.json({ token: signToken(user), role: user.role });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Error interno al iniciar sesión' });
  }
};

const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, role: true, nombre: true, apellido: true, createdAt: true },
    });
    res.json(user);
  } catch (err) {
    console.error('me error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

const findAccount = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    const user = await prisma.user.findUnique({
      where: { email },
      select: { email: true, nombre: true, apellido: true, cedula: true, telefono: true, direccion: true },
    });

    if (!user) return res.status(404).json({ error: 'No existe ninguna cuenta con ese correo electrónico.' });

    res.json(user);
  } catch (err) {
    console.error('findAccount error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, cedula, password } = req.body;
    if (!email || !cedula || !password)
      return res.status(400).json({ error: 'Datos incompletos' });
    if (password.length < 8)
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'Cuenta no encontrada' });

    if (user.cedula !== cedula)
      return res.status(401).json({ error: 'La cédula no coincide con la cuenta.' });

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { email }, data: { password: hashed } });

    res.json({ ok: true });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ error: 'Error interno al actualizar la contraseña' });
  }
};

const updateMe = async (req, res) => {
  try {
    const { nombre } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { nombre },
      select: { id: true, email: true, role: true, nombre: true, apellido: true },
    });
    res.json(user);
  } catch (err) {
    console.error('updateMe error:', err);
    res.status(500).json({ error: 'Error interno al actualizar los datos' });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'Datos incompletos' });
    if (newPassword.length < 6)
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid)
      return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

    res.json({ ok: true });
  } catch (err) {
    console.error('updatePassword error:', err);
    res.status(500).json({ error: 'Error interno al cambiar la contraseña' });
  }
};

module.exports = { register, login, me, findAccount, resetPassword, updateMe, updatePassword };
