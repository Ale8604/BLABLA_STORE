const prisma = require('../lib/prisma');

const generateInvoiceCode = (id) => {
  const year = new Date().getFullYear();
  return `BBS-${year}-${String(id).padStart(5, '0')}`;
};

const create = async (req, res) => {
  const { items, userId, clientName, clientPhone, sedeId, vendedorId } = req.body;

  if (!items?.length)
    return res.status(400).json({ error: 'El pedido debe tener al menos un producto' });

  try {
    const productIds = items.map(i => Number(String(i.productId).split('-')[0]));
    const products   = await prisma.product.findMany({ where: { id: { in: productIds } } });

    const total = items.reduce((sum, item) => {
      const pid     = Number(String(item.productId).split('-')[0]);
      const product = products.find(p => p.id === pid);
      return sum + (item.price ?? product?.price ?? 0) * item.quantity;
    }, 0);

    const order = await prisma.order.create({
      data: {
        userId:      userId     ?? null,
        sedeId:      sedeId     ? Number(sedeId)     : null,
        vendedorId:  vendedorId ? Number(vendedorId) : null,
        clientName:  clientName  || '',
        clientPhone: clientPhone || '',
        total,
        items: {
          create: items.map(item => {
            const pid     = Number(String(item.productId).split('-')[0]);
            const product = products.find(p => p.id === pid);
            return {
              productId:    pid,
              name:         item.name         || product?.name || '',
              specs:        item.specs        || '',
              colorVariant: item.colorVariant || '',
              quantity:     item.quantity,
              price:        item.price ?? product?.price ?? 0,
            };
          }),
        },
      },
    });

    const invoiceCode = generateInvoiceCode(order.id);
    const updated = await prisma.order.update({
      where: { id: order.id },
      data:  { invoiceCode },
      include: { items: true },
    });

    res.status(201).json(updated);
  } catch (err) {
    console.error('create order:', err);
    res.status(500).json({ error: 'Error al crear el pedido' });
  }
};

const getAll = async (req, res) => {
  try {
    const { status } = req.query;
    const orders = await prisma.order.findMany({
      where:   status ? { status } : undefined,
      include: {
        items:    true,
        user:     { select: { email: true, nombre: true, telefono: true } },
        sede:     { select: { id: true, nombre: true } },
        vendedor: { select: { id: true, nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    console.error('getAll orders:', err);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
};

const getOne = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where:   { id: Number(req.params.id) },
      include: {
        items:    true,
        user:     { select: { email: true, nombre: true, telefono: true } },
        sede:     { select: { id: true, nombre: true } },
        vendedor: { select: { id: true, nombre: true } },
      },
    });
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener pedido' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status, clientName, clientPhone, clientCedula, sedeId, vendedorId } = req.body;
    const orderId = Number(req.params.id);

    const current = await prisma.order.findUnique({
      where:   { id: orderId },
      include: { items: true },
    });
    if (!current) return res.status(404).json({ error: 'Pedido no encontrado' });

    const stockOps = [];
    const needsStock =
      (status === 'CONFIRMED' && current.status !== 'CONFIRMED') ||
      (status === 'CANCELLED' && current.status === 'CONFIRMED');

    if (needsStock) {
      const isConfirm = status === 'CONFIRMED';
      const delta     = isConfirm ? -1 : 1;

      // Group items by productId to batch-fetch products once
      const productIds = [...new Set(current.items.map(i => i.productId))];
      const dbProducts = await prisma.product.findMany({ where: { id: { in: productIds } } });

      for (const item of current.items) {
        const dbProduct = dbProducts.find(p => p.id === item.productId);
        if (!dbProduct) continue;

        const variants = Array.isArray(dbProduct.colorVariants) ? dbProduct.colorVariants : [];

        if (item.colorVariant && variants.length > 0) {
          // Per-color stock: update the matching variant's stock in JSON
          const updatedVariants = variants.map(v =>
            v.color === item.colorVariant
              ? { ...v, stock: Math.max(0, (v.stock ?? 0) + delta * item.quantity) }
              : v
          );
          stockOps.push(
            prisma.product.update({
              where: { id: item.productId },
              data:  { colorVariants: updatedVariants },
            })
          );
        } else {
          // Global stock fallback (accessories, products without color variants)
          stockOps.push(
            prisma.product.update({
              where: { id: item.productId },
              data:  { stock: { [isConfirm ? 'decrement' : 'increment']: item.quantity } },
            })
          );
        }
      }
    }

    const [order] = await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data:  {
          status,
          ...(clientName   !== undefined && { clientName   }),
          ...(clientPhone  !== undefined && { clientPhone  }),
          ...(clientCedula !== undefined && { clientCedula }),
          ...(sedeId     !== undefined   && { sedeId:     sedeId     ? Number(sedeId)     : null }),
          ...(vendedorId !== undefined   && { vendedorId: vendedorId ? Number(vendedorId) : null }),
        },
        include: {
          items:    true,
          user:     { select: { email: true, nombre: true } },
          sede:     { select: { id: true, nombre: true } },
          vendedor: { select: { id: true, nombre: true } },
        },
      }),
      ...stockOps,
    ]);

    res.json(order);
  } catch (err) {
    console.error('updateStatus:', err);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where:   { userId: req.user.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    console.error('getMyOrders:', err);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
};

module.exports = { create, getAll, getOne, updateStatus, getMyOrders };
