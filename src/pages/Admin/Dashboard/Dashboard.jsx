import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaDollarSign, FaShoppingCart, FaClock, FaBoxOpen,
  FaArrowRight, FaCheckCircle, FaTimesCircle, FaChartBar, FaStore,
} from 'react-icons/fa';
import { api } from '../../../lib/api';
import { useProducts } from '../../../components/context/ProductsContext';
import styles from './Dashboard.module.css';

const STATUS_LABEL = { PENDING: 'Pendiente', CONFIRMED: 'Confirmado', CANCELLED: 'Cancelado' };
const STATUS_ICON  = {
  PENDING:   <FaClock size={11} />,
  CONFIRMED: <FaCheckCircle size={11} />,
  CANCELLED: <FaTimesCircle size={11} />,
};

const cardVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.35 } }),
};

const Dashboard = () => {
  const [orders,  setOrders]  = useState([]);
  const [sedes,   setSedes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const { activeProducts } = useProducts();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get('/orders'), api.get('/sedes')])
      .then(([o, s]) => { setOrders(o); setSedes(s); })
      .finally(() => setLoading(false));
  }, []);

  const confirmed  = orders.filter(o => o.status === 'CONFIRMED');
  const pending    = orders.filter(o => o.status === 'PENDING');
  const cancelled  = orders.filter(o => o.status === 'CANCELLED');
  const totalRevenue = confirmed.reduce((s, o) => s + o.total, 0);

  const topProducts = (() => {
    const map = {};
    confirmed.forEach(o =>
      o.items?.forEach(item => {
        map[item.name] = (map[item.name] || 0) + item.quantity;
      })
    );
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  })();

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  const kpis = [
    {
      label:   'Ingresos totales',
      value:   `$${totalRevenue.toLocaleString()}`,
      icon:    <FaDollarSign size={20} />,
      color:   styles.kpiGreen,
      sub:     `${confirmed.length} ventas confirmadas`,
    },
    {
      label:   'Pedidos totales',
      value:   orders.length,
      icon:    <FaShoppingCart size={20} />,
      color:   styles.kpiBlue,
      sub:     `Últimos ${orders.length} registros`,
    },
    {
      label:   'Pendientes',
      value:   pending.length,
      icon:    <FaClock size={20} />,
      color:   styles.kpiOrange,
      sub:     pending.length > 0 ? 'Requieren atención' : 'Todo al día',
    },
    {
      label:   'Productos activos',
      value:   activeProducts.length,
      icon:    <FaBoxOpen size={20} />,
      color:   styles.kpiPurple,
      sub:     `${cancelled.length} pedidos cancelados`,
    },
  ];

  const maxTop = topProducts[0]?.[1] || 1;

  const sedeStats = sedes.map(sede => {
    const sedeOrders = confirmed.filter(o => o.sedeId === sede.id);
    return {
      ...sede,
      ventas:   sedeOrders.length,
      ingresos: sedeOrders.reduce((s, o) => s + o.total, 0),
    };
  }).sort((a, b) => b.ingresos - a.ingresos);

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>DASHBOARD</h2>
          <p className={styles.pageSub}>Resumen general del negocio</p>
        </div>
        <button className={styles.btnFacturacion} onClick={() => navigate('/admin/facturacion')}>
          Ver facturación <FaArrowRight size={12} />
        </button>
      </div>

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            className={`${styles.kpiCard} ${kpi.color}`}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <div className={styles.kpiIcon}>{kpi.icon}</div>
            <div className={styles.kpiBody}>
              <span className={styles.kpiValue}>
                {loading ? <span className={styles.skeleton} /> : kpi.value}
              </span>
              <span className={styles.kpiLabel}>{kpi.label}</span>
              <span className={styles.kpiSub}>{kpi.sub}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className={styles.bottomGrid}>
        {/* Últimos pedidos */}
        <motion.div
          className={styles.card}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.35 }}
        >
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Últimos pedidos</h3>
            <button className={styles.cardLink} onClick={() => navigate('/admin/facturacion')}>
              Ver todos <FaArrowRight size={11} />
            </button>
          </div>

          {loading ? (
            <div className={styles.loadingRows}>
              {[...Array(5)].map((_, i) => <div key={i} className={styles.skeletonRow} />)}
            </div>
          ) : recentOrders.length === 0 ? (
            <p className={styles.empty}>No hay pedidos aún.</p>
          ) : (
            <div className={styles.orderList}>
              {recentOrders.map(order => (
                <div
                  key={order.id}
                  className={styles.orderRow}
                  onClick={() => navigate('/admin/facturacion')}
                >
                  <div className={styles.orderLeft}>
                    <span className={styles.orderCode}>{order.invoiceCode || `#${order.id}`}</span>
                    <span className={styles.orderClient}>
                      {order.clientName || order.user?.nombre || 'Sin nombre'}
                    </span>
                  </div>
                  <div className={styles.orderRight}>
                    <span className={styles.orderTotal}>${Number(order.total).toLocaleString()}</span>
                    <span className={`${styles.badge} ${styles[`badge${order.status}`]}`}>
                      {STATUS_ICON[order.status]}
                      {STATUS_LABEL[order.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Top productos */}
        <motion.div
          className={styles.card}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.35 }}
        >
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Productos más vendidos</h3>
            <FaChartBar size={15} className={styles.cardIcon} />
          </div>

          {loading ? (
            <div className={styles.loadingRows}>
              {[...Array(5)].map((_, i) => <div key={i} className={styles.skeletonRow} />)}
            </div>
          ) : topProducts.length === 0 ? (
            <p className={styles.empty}>Sin ventas confirmadas aún.</p>
          ) : (
            <div className={styles.topList}>
              {topProducts.map(([name, qty], i) => (
                <div key={name} className={styles.topRow}>
                  <span className={styles.topRank}>{i + 1}</span>
                  <div className={styles.topInfo}>
                    <span className={styles.topName}>{name}</span>
                    <div className={styles.barTrack}>
                      <motion.div
                        className={styles.barFill}
                        initial={{ width: 0 }}
                        animate={{ width: `${(qty / maxTop) * 100}%` }}
                        transition={{ delay: 0.5 + i * 0.08, duration: 0.5 }}
                      />
                    </div>
                  </div>
                  <span className={styles.topQty}>{qty} uds.</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Resumen por estado */}
        <motion.div
          className={styles.card}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.35 }}
        >
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Resumen de estados</h3>
          </div>
          <div className={styles.statusSummary}>
            {[
              { label: 'Confirmados', count: confirmed.length,  pct: orders.length ? (confirmed.length / orders.length) * 100 : 0,  cls: styles.barConfirmed },
              { label: 'Pendientes',  count: pending.length,    pct: orders.length ? (pending.length  / orders.length) * 100 : 0,  cls: styles.barPending  },
              { label: 'Cancelados',  count: cancelled.length,  pct: orders.length ? (cancelled.length/ orders.length) * 100 : 0,  cls: styles.barCancelled},
            ].map(({ label, count, pct, cls }) => (
              <div key={label} className={styles.statusRow}>
                <div className={styles.statusMeta}>
                  <span className={styles.statusLabel}>{label}</span>
                  <span className={styles.statusCount}>{count}</span>
                </div>
                <div className={styles.barTrack}>
                  <motion.div
                    className={`${styles.barFill} ${cls}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                  />
                </div>
                <span className={styles.statusPct}>{Math.round(pct)}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Métricas por sede */}
      {sedes.length > 0 && (
        <motion.div
          className={styles.card}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.35 }}
        >
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Ventas por sede</h3>
            <button className={styles.cardLink} onClick={() => navigate('/admin/cajas')}>
              Gestionar <FaArrowRight size={11} />
            </button>
          </div>
          <div className={styles.sedeGrid}>
            {sedeStats.map(sede => (
              <div key={sede.id} className={styles.sedeCard}
                onClick={() => navigate(`/admin/cajas/${sede.id}`)}
                style={{ cursor: 'pointer' }}>
                <div className={styles.sedeIcon}><FaStore size={16} /></div>
                <div className={styles.sedeInfo}>
                  <span className={styles.sedeNombre}>{sede.nombre}</span>
                  <span className={styles.sedeSub}>{sede.ventas} ventas confirmadas</span>
                </div>
                <span className={styles.sedeIngresos}>${Number(sede.ingresos).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
