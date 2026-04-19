const prisma = require('../lib/prisma');

const create = async (req, res) => {
  const { items, userId } = req.body;

  if (!items?.length)
    return res.status(400).json({ error: 'El pedido debe tener al menos un producto' });

  const productIds = items.map(i => i.productId);
  const products   = await prisma.product.findMany({ where: { id: { in: productIds } } });

  const total = items.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    return sum + (product?.price ?? 0) * item.quantity;
  }, 0);

  const order = await prisma.order.create({
    data: {
      userId: userId ?? null,
      total,
      items: {
        create: items.map(item => {
          const product = products.find(p => p.id === item.productId);
          return {
            productId: item.productId,
            quantity:  item.quantity,
            price:     product?.price ?? 0,
          };
        }),
      },
    },
    include: { items: { include: { product: true } } },
  });

  res.status(201).json(order);
};

const getAll = async (req, res) => {
  const orders = await prisma.order.findMany({
    include: { items: { include: { product: true } }, user: { select: { email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
};

const updateStatus = async (req, res) => {
  const { status } = req.body;
  const order = await prisma.order.update({
    where: { id: Number(req.params.id) },
    data:  { status },
  });
  res.json(order);
};

module.exports = { create, getAll, updateStatus };
