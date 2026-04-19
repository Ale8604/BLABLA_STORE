import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaInbox, FaPlusCircle, FaCog, FaBook, FaFileInvoiceDollar, FaUserCircle, FaSignOutAlt, FaCheckCircle } from 'react-icons/fa';
import logo from '../../assets/logo.png';
import styles from './AdminLayout.module.css';
import { useAuth } from '../../components/context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin/archivados', icon: <FaInbox size={18} />,           label: 'Archivado' },
  { to: '/admin/crear',      icon: <FaPlusCircle size={18} />,      label: 'Crear Producto' },
  { to: '/admin/ajustes',    icon: <FaCog size={18} />,             label: 'Ajustes' },
  { to: '/admin/inventario', icon: <FaBook size={18} />,            label: 'Inventario' },
  { to: '/admin/facturacion',icon: <FaFileInvoiceDollar size={18}/>, label: 'Facturación' },
];

const AdminLayout = () => {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const [open, setOpen]   = useState(false);
  const [toast, setToast] = useState(false);
  const dropdownRef       = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
    setToast(true);
    setTimeout(() => { setToast(false); navigate('/'); }, 2000);
  };

  return (
  <div className={styles.wrapper}>

    <AnimatePresence>
      {toast && (
        <motion.div
          className={styles.toast}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
        >
          <FaCheckCircle size={14} />
          Has cerrado sesión
        </motion.div>
      )}
    </AnimatePresence>

    <header className={styles.header}>
      <div className={styles.headerLogo}>
        <img src={logo} alt="BlaBla Store" className={styles.logo} />
        <span className={styles.panelTitle}>PANEL DE CONTROL</span>
      </div>
      <div className={styles.headerUser}>
        <span className={styles.userName}>Administrador</span>
        <div className={styles.userDropdownWrapper} ref={dropdownRef}>
          <button className={styles.logoutBtn} onClick={() => setOpen(p => !p)}>
            <FaUserCircle size={26} />
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                className={styles.userDropdown}
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              >
                <button className={styles.dropdownLogoutItem} onClick={handleLogout}>
                  <FaSignOutAlt size={13} /> Cerrar sesión
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>

    <div className={styles.body}>
      <aside className={styles.sidebar}>
        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
            >
              <span className={styles.navIcon}>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>

  </div>
  );
};

export default AdminLayout;
