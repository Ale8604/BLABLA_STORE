import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaUserCircle, FaEnvelope, FaLock, FaEye, FaEyeSlash,
  FaCheckCircle, FaBoxOpen, FaClock, FaBan,
} from 'react-icons/fa';
import Navbar from '../../components/layout/Navbar/navbar';
import Footer from '../../components/layout/Footer/Footer';
import CardModal from '../../components/products/CardModal/CardModal';
import { useAuth } from '../../components/context/AuthContext';
import { api } from '../../lib/api';
import styles from './PerfilPage.module.css';

const STATUS_MAP = {
  PENDING:   { label: 'Pendiente',  color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  icon: <FaClock size={11} /> },
  CONFIRMED: { label: 'Confirmado', color: '#4ade80', bg: 'rgba(74,222,128,0.12)', icon: <FaCheckCircle size={11} /> },
  CANCELLED: { label: 'Cancelado',  color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: <FaBan size={11} /> },
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });

const PerfilPage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('cuenta');

  // ── Datos personales ──
  const [nombre, setNombre]         = useState(user?.nombre || '');
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoOk, setInfoOk]         = useState(false);
  const [infoErr, setInfoErr]       = useState('');

  // ── Contraseña ──
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass]         = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [savingPass, setSavingPass]   = useState(false);
  const [passOk, setPassOk]           = useState(false);
  const [passErr, setPassErr]         = useState('');

  // ── Mis pedidos ──
  const [orders, setOrders]         = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersErr, setOrdersErr]   = useState('');

  useEffect(() => {
    if (activeTab !== 'pedidos') return;
    setLoadingOrders(true);
    setOrdersErr('');
    api.get('/orders/mine')
      .then(data => setOrders(data))
      .catch(err => setOrdersErr(err.message || 'Error al cargar pedidos'))
      .finally(() => setLoadingOrders(false));
  }, [activeTab]);

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setSavingInfo(true);
    setInfoErr('');
    setInfoOk(false);
    try {
      const updated = await api.patch('/auth/me', { nombre });
      updateUser(updated);
      setInfoOk(true);
      setTimeout(() => setInfoOk(false), 3000);
    } catch (err) {
      setInfoErr(err.message);
    } finally {
      setSavingInfo(false);
    }
  };

  const handleChangePass = async (e) => {
    e.preventDefault();
    if (newPass.length < 6) { setPassErr('La contraseña debe tener al menos 6 caracteres.'); return; }
    setSavingPass(true);
    setPassErr('');
    setPassOk(false);
    try {
      await api.patch('/auth/me/password', { currentPassword: currentPass, newPassword: newPass });
      setPassOk(true);
      setCurrentPass('');
      setNewPass('');
      setTimeout(() => setPassOk(false), 3000);
    } catch (err) {
      setPassErr(err.message);
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <CardModal />
      <main className={styles.main}>

        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className={styles.avatarCircle}>
            <FaUserCircle size={52} />
          </div>
          <div>
            <h1 className={styles.headerName}>{user?.nombre || 'Mi cuenta'}</h1>
            <p className={styles.headerEmail}>{user?.email}</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'cuenta' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('cuenta')}
          >
            Mi cuenta
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'pedidos' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('pedidos')}
          >
            Mis pedidos
          </button>
        </div>

        {/* ── Mi cuenta ── */}
        {activeTab === 'cuenta' && (
          <motion.div
            className={styles.grid}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Datos personales */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Datos personales</h2>
              <form className={styles.form} onSubmit={handleSaveInfo}>
                <div className={styles.field}>
                  <FaUserCircle className={styles.fieldIcon} size={14} />
                  <input
                    type="text"
                    placeholder="Nombre"
                    className={styles.input}
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <FaEnvelope className={styles.fieldIcon} size={14} />
                  <input
                    type="email"
                    className={styles.input}
                    value={user?.email || ''}
                    disabled
                    title="El email no se puede cambiar"
                  />
                </div>
                {infoErr && <p className={styles.error}>{infoErr}</p>}
                {infoOk  && <p className={styles.success}><FaCheckCircle size={13} /> Datos actualizados</p>}
                <button type="submit" className={styles.btn} disabled={savingInfo}>
                  {savingInfo ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </form>
            </div>

            {/* Cambiar contraseña */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Cambiar contraseña</h2>
              <form className={styles.form} onSubmit={handleChangePass}>
                <div className={styles.field}>
                  <FaLock className={styles.fieldIcon} size={14} />
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    placeholder="Contraseña actual"
                    className={styles.input}
                    value={currentPass}
                    onChange={e => setCurrentPass(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowCurrent(p => !p)} tabIndex={-1}>
                    {showCurrent ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                  </button>
                </div>
                <div className={styles.field}>
                  <FaLock className={styles.fieldIcon} size={14} />
                  <input
                    type={showNew ? 'text' : 'password'}
                    placeholder="Nueva contraseña"
                    className={styles.input}
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowNew(p => !p)} tabIndex={-1}>
                    {showNew ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                  </button>
                </div>
                {passErr && <p className={styles.error}>{passErr}</p>}
                {passOk  && <p className={styles.success}><FaCheckCircle size={13} /> Contraseña actualizada</p>}
                <button type="submit" className={styles.btn} disabled={savingPass}>
                  {savingPass ? 'Actualizando...' : 'Cambiar contraseña'}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* ── Mis pedidos ── */}
        {activeTab === 'pedidos' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {loadingOrders ? (
              <div className={styles.ordersLoading}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={styles.orderSkeleton} />
                ))}
              </div>
            ) : ordersErr ? (
              <p className={styles.error}>{ordersErr}</p>
            ) : orders.length === 0 ? (
              <div className={styles.ordersEmpty}>
                <FaBoxOpen size={40} className={styles.ordersEmptyIcon} />
                <p>Aún no tienes pedidos</p>
                <span>Tus compras aparecerán aquí</span>
              </div>
            ) : (
              <div className={styles.ordersList}>
                {orders.map(order => {
                  const st = STATUS_MAP[order.status] || STATUS_MAP.PENDING;
                  return (
                    <div key={order.id} className={styles.orderCard}>
                      <div className={styles.orderCardTop}>
                        <div className={styles.orderCardLeft}>
                          <span className={styles.orderInvoice}>{order.invoiceCode || `#${order.id}`}</span>
                          <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
                        </div>
                        <span
                          className={styles.orderBadge}
                          style={{ color: st.color, background: st.bg }}
                        >
                          {st.icon} {st.label}
                        </span>
                      </div>

                      <div className={styles.orderItems}>
                        {order.items.map(item => (
                          <div key={item.id} className={styles.orderItem}>
                            <span className={styles.orderItemName}>{item.name}</span>
                            {item.specs && <span className={styles.orderItemSpecs}>{item.specs}</span>}
                            <span className={styles.orderItemQty}>×{item.quantity}</span>
                            <span className={styles.orderItemPrice}>${item.price.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <div className={styles.orderCardBottom}>
                        <span className={styles.orderTotalLabel}>Total</span>
                        <span className={styles.orderTotal}>${order.total.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default PerfilPage;
