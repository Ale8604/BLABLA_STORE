import React from 'react';
import { useCart } from '../../context/CartContext';
import styles from './CardModal.module.css';
import { FaPlus, FaMinus } from 'react-icons/fa';

const CartModal = () => {
  const { cart, isCartOpen, toggleCart, totalPrice } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className={styles.overlay} onClick={toggleCart}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>CARRITO</h2>
        
        <div className={styles.itemList}>
          {cart.map((item) => (
            <div key={item.id} className={styles.cartItem}>
              <img src={item.image} alt={item.name} className={styles.itemImg} />
              <div className={styles.itemInfo}>
                <h4>{item.name}</h4>
                <p>Precio - <span className={styles.greenText}>${item.price}</span></p>
              </div>
              <div className={styles.quantityControls}>
                <button className={styles.qtyBtn}><FaPlus size={10}/></button>
                <span>{item.quantity}</span>
                <button className={styles.qtyBtn}><FaMinus size={10}/></button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <div className={styles.totalContainer}>
            <span className={styles.totalLabel}>Precio Total</span>
            <span className={styles.totalAmount}>${totalPrice}</span>
          </div>
          <button className={styles.orderBtn}>Realizar Pedido</button>
        </div>
      </div>
    </div>
  );
};

export default CartModal;