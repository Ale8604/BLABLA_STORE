import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaInbox, FaPlusCircle, FaBook, FaFileInvoiceDollar, FaBullhorn, FaUserCircle, FaSignOutAlt, FaCheckCircle, FaTachometerAlt, FaBars, FaTimes, FaFileExcel, FaEdit, FaMagic } from 'react-icons/fa';
import logo from '../../assets/logo.png';
import styles from './AdminLayout.module.css';
import { useAuth } from '../../components/context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin/dashboard',   icon: <FaTachometerAlt size={18} />,    label: 'Dashboard' },
  { to: '/admin/inventario',  icon: <FaBook size={18} />,             label: 'Inventario' },
  { to: '/admin/crear',       icon: <FaPlusCircle size={18} />,       label: 'Crear Producto' },
  { to: '/admin/archivados',  icon: <FaInbox size={18} />,            label: 'Archivado' },
  { to: '/admin/publicidad',  icon: <FaBullhorn size={18} />,         label: 'Publicidad' },
  { to: '/admin/facturacion', icon: <FaFileInvoiceDollar size={18}/>, label: 'Facturación' },
  { to: '/admin/editar',       icon: <FaEdit size={18} />,       label: 'Editar Producto' },
  { to: '/admin/quitar-fondos', icon: <FaMagic size={18} />,      label: 'Quitar Fondos'  },
  { to: '/admin/importar',   icon: <FaFileExcel size={18} />,     label: 'Importar Excel' },
];

const AdminLayout = () => {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const [open, setOpen]       = useState(false);
  const [toast, setToast]     = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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

    {/* Mobile drawer backdrop */}
    <AnimatePresence>
      {menuOpen && (
        <motion.div
          className={styles.drawerBackdrop}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setMenuOpen(false)}
        />
      )}
    </AnimatePresence>

    {/* Mobile drawer */}
    <AnimatePresence>
      {menuOpen && (
        <motion.div
          className={styles.drawer}
          initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        >
          <div className={styles.drawerHeader}>
            <img src={logo} alt="BlaBla Store" className={styles.logo} />
            <button className={styles.drawerClose} onClick={() => setMenuOpen(false)}>
              <FaTimes size={18} />
            </button>
          </div>
          <nav className={styles.drawerNav}>
            {NAV_ITEMS.map(({ to, icon, label }) => (
              <NavLink
                key={to} to={to}
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <span className={styles.navIcon}>{icon}</span>
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>

    <header className={styles.header}>
      <div className={styles.headerLogo}>
        {/* Hamburger — mobile only */}
        <motion.button className={styles.hamburger} onClick={() => setMenuOpen(true)} whileTap={{ scale: 0.9 }}>
          <FaBars size={20} />
        </motion.button>
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
