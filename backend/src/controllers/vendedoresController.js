const prisma = require('../lib/prisma');

const getAll = async (req, res) => {
  try {
    const { sedeId } = req.query;
    const vendedores = await prisma.vendedor.findMany({
      where: sedeId ? { sedeId: Number(sedeId) } : undefined,
      include: { sede: { select: { id: true, nombre: true } } },
      orderBy: { nombre: 'asc' },
    });
    res.json(vendedores);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener vendedores' });
  }
};

const create = async (req, res) => {
  const { nombre, sedeId } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido' });
  if (!sedeId)         return res.status(400).json({ error: 'La sede es requerida' });
  try {
    const vendedor = await prisma.vendedor.create({
      data: { nombre: nombre.trim(), sedeId: Number(sedeId) },
      include: { sede: { select: { id: true, nombre: true } } },
    });
    res.status(201).json(vendedor);
  } catch (err) {
    console.error('create vendedor:', err);
    res.status(500).json({ error: 'Error al crear vendedor' });
  }
};

const update = async (req, res) => {
  const { nombre, activo, sedeId } = req.body;
  try {
    const vendedor = await prisma.vendedor.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(nombre !== undefined && { nombre: nombre.trim() }),
        ...(activo !== undefined && { activo }),
        ...(sedeId !== undefined && { sedeId: Number(sedeId) }),
      },
      include: { sede: { select: { id: true, nombre: true } } },
    });
    res.json(vendedor);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar vendedor' });
  }
};

const remove = async (req, res) => {
  try {
    await prisma.vendedor.update({
      where: { id: Number(req.params.id) },
      data:  { activo: false },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar vendedor' });
  }
};

module.exports = { getAll, create, update, remove };
