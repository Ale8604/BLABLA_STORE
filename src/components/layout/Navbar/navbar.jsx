import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShoppingCart, FaUserCircle, FaSignInAlt, FaUserPlus, FaSignOutAlt, FaCheckCircle } from 'react-icons/fa';
import logo from '../../../assets/logo.png';
import styles from './navbar.module.css';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const CATEGORIAS = [
  { label: 'Teléfonos',  to: '/?categoria=Teléfonos'  },
  { label: 'Accesorios', to: '/?categoria=Accesorios' },
];

const Navbar = () => {
  const { cartCount, toggleCart } = useCart();
  const { user, logout }          = useAuth();
  const navigate                  = useNavigate();
  const [open, setOpen]           = useState(false);
  const [catOpen, setCatOpen]     = useState(false);
  const [toast, setToast]         = useState(false);
  const dropdownRef               = useRef(null);
  const catRef                    = useRef(null);
  const catTimer                  = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openCat  = () => { clearTimeout(catTimer.current); setCatOpen(true); };
  const closeCat = () => { catTimer.current = setTimeout(() => setCatOpen(false), 120); };

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
        <li><Link to="/">INICIO</Link></li>
        <li
          className={styles.catItem}
          ref={catRef}
          onMouseEnter={openCat}
          onMouseLeave={closeCat}
        >
          <button className={styles.catTrigger}>CATEGORÍAS</button>
          <AnimatePresence>
            {catOpen && (
              <motion.ul
                className={styles.catDropdown}
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                exit={{    opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                onMouseEnter={openCat}
                onMouseLeave={closeCat}
              >
                {CATEGORIAS.map(c => (
                  <li key={c.label}>
                    <Link to={c.to} className={styles.catOption} onClick={() => setCatOpen(false)}>
                      {c.label}
                    </Link>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </li>
        <li><Link to="/ofertas">OFERTAS</Link></li>
        <li><Link to="/nosotros">ACERCA DE NOSOTROS</Link></li>
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
                    <Link to="/perfil" className={styles.dropdownItem} onClick={() => setOpen(false)}>
                      <FaUserCircle size={13} /> Mi perfil
                    </Link>
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
