import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShoppingCart, FaUserCircle, FaSignInAlt, FaUserPlus, FaSignOutAlt, FaCheckCircle } from 'react-icons/fa';
import logo from '../../../assets/logo.png';
import styles from './navbar.module.css';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { cartCount, toggleCart } = useCart();
  const { user, logout }          = useAuth();
  const navigate                  = useNavigate();
  const [open, setOpen]           = useState(false);
  const [toast, setToast]         = useState(false);
  const dropdownRef               = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  return (
    <>
    <AnimatePresence>
      {toast && (
        <motion.div
          className={styles.toast}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        >
          <FaCheckCircle size={15} />
          Sesión cerrada correctamente
        </motion.div>
      )}
    </AnimatePresence>
    <nav className={styles.navContainer}>
      <div className={styles.logoWrapper}>
        <Link to="/"><img src={logo} alt="BlaBla Store" className={styles.logo} /></Link>
      </div>

      <ul className={styles.menuLinks}>
        <li><Link to="/accesorios">ACCESORIOS</Link></li>
        <li><Link to="/ofertas">OFERTAS</Link></li>
        <li><Link to="/">CELULARES</Link></li>
        <li><Link to="/servicio">SERVICIO TÉCNICO</Link></li>
      </ul>

      <div className={styles.navIcons}>
        <button className={styles.iconBtn} onClick={toggleCart}>
          <div className={styles.cartWrapper}>
            <FaShoppingCart size={25} />
            {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
          </div>
        </button>

        {/* User dropdown */}
        <div className={styles.userWrapper} ref={dropdownRef}>
          <button
            className={`${styles.iconBtn} ${open ? styles.iconBtnActive : ''}`}
            onClick={() => setOpen(p => !p)}
          >
            <FaUserCircle size={25} />
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                className={styles.dropdown}
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0,  scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              >
                {user ? (
                  <>
                    <div className={styles.dropdownUser}>
                      <FaUserCircle size={28} className={styles.dropdownAvatar} />
                      <div>
                        <p className={styles.dropdownName}>{user.nombre || 'Usuario'}</p>
                        <p className={styles.dropdownEmail}>{user.email}</p>
                      </div>
                    </div>
                    <div className={styles.dropdownDivider} />
                    <button className={styles.dropdownItem} onClick={handleLogout}>
                      <FaSignOutAlt size={13} /> Cerrar sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className={styles.dropdownItem} onClick={() => setOpen(false)}>
                      <FaSignInAlt size={13} /> Iniciar sesión
                    </Link>
                    <Link to="/registro" className={styles.dropdownItem} onClick={() => setOpen(false)}>
                      <FaUserPlus size={13} /> Crear usuario
                    </Link>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
    </>
  );
};

export default Navbar;
