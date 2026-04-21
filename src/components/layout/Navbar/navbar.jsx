import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaShoppingCart, FaUserCircle, FaSignInAlt, FaUserPlus,
  FaSignOutAlt, FaCheckCircle, FaSearch, FaTimes, FaBars,
} from 'react-icons/fa';
import logo from '../../../assets/logo.png';
import styles from './navbar.module.css';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const CATEGORIAS = [
  { label: 'Teléfonos',  to: '/?categoria=Teléfonos'  },
  { label: 'Accesorios', to: '/?categoria=Accesorios' },
  { label: 'Repuestos',  to: '/?categoria=Repuestos'  },
];

const Navbar = () => {
  const { cartCount, toggleCart } = useCart();
  const { user, logout }          = useAuth();
  const navigate                  = useNavigate();
  const [open, setOpen]           = useState(false);
  const [catOpen, setCatOpen]     = useState(false);
  const [toast, setToast]         = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal]   = useState('');
  const [menuOpen, setMenuOpen]     = useState(false);
  const dropdownRef = useRef(null);
  const catRef      = useRef(null);
  const catTimer    = useRef(null);
  const searchRef   = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const openCat  = () => { clearTimeout(catTimer.current); setCatOpen(true); };
  const closeCat = () => { catTimer.current = setTimeout(() => setCatOpen(false), 120); };

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchVal.trim();
    if (!q) return;
    navigate(`/?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setSearchVal('');
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchVal('');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
    {/* Mobile menu backdrop */}
    <AnimatePresence>
      {menuOpen && (
        <motion.div
          style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeMenu}
        />
      )}
    </AnimatePresence>

    {/* Mobile drawer */}
    <AnimatePresence>
      {menuOpen && (
        <motion.div
          className={styles.mobileMenu}
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        >
          <Link to="/" className={styles.mobileMenuItem} onClick={closeMenu}>Inicio</Link>
          <div className={styles.mobileDivider} />
          <p className={styles.mobileCatLabel}>Categorías</p>
          {CATEGORIAS.map(c => (
            <Link key={c.label} to={c.to} className={styles.mobileCatOption} onClick={closeMenu}>{c.label}</Link>
          ))}
          <div className={styles.mobileDivider} />
          <Link to="/ofertas" className={styles.mobileMenuItem} onClick={closeMenu}>Ofertas</Link>
          <Link to="/nosotros" className={styles.mobileMenuItem} onClick={closeMenu}>Acerca de nosotros</Link>
        </motion.div>
      )}
    </AnimatePresence>

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

      {/* Search mode */}
      <AnimatePresence>
        {searchOpen && (
          <motion.form
            className={styles.searchForm}
            initial={{ opacity: 0, scaleX: 0.85 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0.85 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            onSubmit={handleSearch}
          >
            <FaSearch size={14} className={styles.searchIcon} />
            <input
              ref={searchRef}
              className={styles.searchInput}
              placeholder="Buscar productos..."
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && closeSearch()}
            />
            <button type="button" className={styles.searchClose} onClick={closeSearch}>
              <FaTimes size={14} />
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Normal links */}
      {!searchOpen && (
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
      )}

      <div className={styles.navIcons}>
        {/* Hamburger — mobile only */}
        <motion.button
          className={styles.hamburger}
          onClick={() => setMenuOpen(p => !p)}
          whileTap={{ scale: 0.9 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={menuOpen ? 'close' : 'open'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ display: 'flex' }}
            >
              {menuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        {/* Search icon */}
        <button
          className={`${styles.iconBtn} ${searchOpen ? styles.iconBtnActive : ''}`}
          onClick={() => searchOpen ? closeSearch() : setSearchOpen(true)}
        >
          {searchOpen ? <FaTimes size={22} /> : <FaSearch size={20} />}
        </button>

        {/* Cart */}
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
