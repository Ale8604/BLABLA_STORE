import React from 'react';
import { FaShoppingCart, FaUserCircle } from "react-icons/fa";
import logo from '../../../assets/logo.png'; 
import styles from './navbar.module.css';
import { useCart } from '../../context/CartContext'; // Ajusta la ruta si es necesario

const Navbar = () => {
  const { cartCount } = useCart(); // Obtenemos el número de elementos en el carrito

  return (
    <nav className={styles.navContainer}>
      <div className={styles.logoWrapper}>
        <img src={logo} alt="BlaBla Store" className={styles.logo} />
      </div>

      <ul className={styles.menuLinks}>
        <li><a href="#accesorios">ACCESORIOS</a></li>
        <li><a href="#ofertas">OFERTAS</a></li>
        <li><a href="#celulares">CELULARES</a></li>
        <li><a href="#servicio">SERVICIO TÉCNICO</a></li>
      </ul>

<div className={styles.navIcons}>
  <button className={styles.iconBtn}>
    <div className={styles.cartWrapper}> {/* Nuevo contenedor */}
      <FaShoppingCart size={25} />
      {cartCount > 0 && (
        <span className={styles.cartBadge}>{cartCount}</span>
      )}
    </div>
  </button>
  <button className={styles.iconBtn}>
    <FaUserCircle size={25} />
  </button>
</div>
    </nav>
  );
};

export default Navbar;