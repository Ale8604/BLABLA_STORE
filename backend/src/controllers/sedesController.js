const prisma = require('../lib/prisma');

const getAll = async (req, res) => {
  try {
    const sedes = await prisma.sede.findMany({
      include: {
        _count: { select: { vendedores: true, orders: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(sedes);
  } catch (err) {
    console.error('getAll sedes:', err);
    res.status(500).json({ error: 'Error al obtener sedes' });
  }
};

const getOne = async (req, res) => {
  try {
    const sede = await prisma.sede.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        vendedores: { where: { activo: true }, orderBy: { nombre: 'asc' } },
        _count: { select: { orders: true } },
      },
    });
    if (!sede) return res.status(404).json({ error: 'Sede no encontrada' });
    res.json(sede);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener sede' });
  }
};

const create = async (req, res) => {
  const { nombre, direccion } = req.body;
  if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido' });
  try {
    const sede = await prisma.sede.create({ data: { nombre: nombre.trim(), direccion: direccion || '' } });
    res.status(201).json(sede);
  } catch (err) {
    console.error('create sede:', err);
    res.status(500).json({ error: 'Error al crear sede' });
  }
};

const update = async (req, res) => {
  const { nombre, direccion, activa } = req.body;
  try {
    const sede = await prisma.sede.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(nombre    !== undefined && { nombre: nombre.trim() }),
        ...(direccion !== undefined && { direccion }),
        ...(activa    !== undefined && { activa }),
      },
    });
    res.json(sede);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar sede' });
  }
};

const remove = async (req, res) => {
  try {
    await prisma.sede.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar sede' });
  }
};

const getStats = async (req, res) => {
  const sedeId = Number(req.params.id);
  const { mes, anio } = req.query;

  const now   = new Date();
  const year  = Number(anio) || now.getFullYear();
  const month = Number(mes)  || now.getMonth() + 1;
  const from  = new Date(year, month - 1, 1);
  const to    = new Date(year, month, 1);

  try {
    const orders = await prisma.order.findMany({
      where: {
        sedeId,
        status:    'CONFIRMED',
        createdAt: { gte: from, lt: to },
      },
      include: {
        items:    true,
        vendedor: { select: { id: true, nombre: true } },
      },
    });

    const rules = await prisma.commissionRule.findMany();
    const ruleMap = Object.fromEntries(rules.map(r => [r.categoria, r.porcentaje]));

    const vendedorMap = {};
    for (const order of orders) {
      const vid = order.vendedorId;
      if (!vid) continue;
      if (!vendedorMap[vid]) {
        vendedorMap[vid] = {
          id:         vid,
          nombre:     order.vendedor?.nombre || 'Desconocido',
          ventas:     0,
          total:      0,
          comision:   0,
          detalle:    {},
        };
      }
      vendedorMap[vid].ventas++;
      vendedorMap[vid].total += order.total;

      for (const item of order.items) {
        const cat = item.categoria || 'Sin categoría';
        const pct = ruleMap[cat] ?? 0;
        const sub = item.price * item.quantity;
        vendedorMap[vid].comision += sub * (pct / 100);
        if (!vendedorMap[vid].detalle[cat]) vendedorMap[vid].detalle[cat] = 0;
        vendedorMap[vid].detalle[cat] += sub * (pct / 100);
      }
    }

    res.json({
      totalVentas:  orders.length,
      totalIngresos: orders.reduce((s, o) => s + o.total, 0),
      vendedores:   Object.values(vendedorMap),
      mes: month,
      anio: year,
    });
  } catch (err) {
    console.error('getStats sede:', err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

module.exports = { getAll, getOne, create, update, remove, getStats };
