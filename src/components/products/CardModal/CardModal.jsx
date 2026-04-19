import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import styles from './CardModal.module.css';
import { FaPlus, FaMinus, FaShoppingBag, FaCheckCircle, FaTimes, FaUserCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const CardModal = () => {
  const { cart, isCartOpen, toggleCart, totalPrice, addToCart, removeFromCart, deleteFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const [isOrderSent, setIsOrderSent]   = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);

  const sendOrder = () => {
    const message = cart.map(item => `• ${item.name} (x${item.quantity}) - $${item.price}`).join('\n');
    const totalText = `\n\n*Total a pagar: $${totalPrice.toLocaleString()}*`;
    const header = `¡Hola! Me gustaría realizar el siguiente pedido en *BlaBla Store*:\n\n`;
    const encodedMessage = encodeURIComponent(header + message + totalText);
    const phoneNumber = import.meta.env.VITE_WHATSAPP_NUMBER;
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    setIsOrderSent(true);
    if (clearCart) clearCart();
  };

  const handleSendOrder = () => {
    if (cart.length === 0) return;
    if (!user) { setShowAuthPopup(true); return; }
    sendOrder();
  };

  const handleProceedAnyway = () => {
    setShowAuthPopup(false);
    sendOrder();
  };
  

    const handleFinishAndClear = () => {
    clearCart();           // 1. Vacía el carrito (esto pondrá el contador en 0)
    setIsOrderSent(false); // 2. Quita el aviso de "Gracias"
    toggleCart();          // 3. Cierra el modal
    setTimeout(() => setIsOrderSent(false), 500);
    };

  const handleClose = () => {
    toggleCart();
    setTimeout(() => setIsOrderSent(false), 500);
  };


  return (
    <AnimatePresence>
      {isCartOpen && (
        <motion.div
          className={styles.overlay}
          onClick={handleClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          <motion.div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: -16, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -16, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.title}>CARRITO</h2>
              <button className={styles.closeBtn} onClick={handleClose} aria-label="Cerrar carrito">
                <FaTimes size={16} />
              </button>
            </div>

            {isOrderSent ? (
              <motion.div className={styles.successState} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <FaCheckCircle size={60} className={styles.successIcon} />
                <h3>¡Gracias por tu pedido!</h3>
                <p>Tu solicitud ha sido enviada con éxito.</p>
                <button className={styles.orderBtn} onClick={handleFinishAndClear}>Continuar navegando</button>
              </motion.div>
            ) : cart.length === 0 ? (
              <div className={styles.emptyCart}>
                <FaShoppingBag size={50} className={styles.emptyIcon} />
                <p>Tu carrito está vacío</p>
                <span>¡Agrega algunos productos para empezar!</span>
              </div>
            ) : (
              <>
                <div className={styles.itemList}>
                  {cart.map((item) => (
                    <div key={item.id} className={styles.cartItem}>
                      <img src={item.image} alt={item.name} className={styles.itemImg} />
                      <div className={styles.itemInfo}>
                        <h4>{item.name}</h4>
                        <p>Precio - <span className={styles.greenText}>${item.price}</span></p>
                      </div>
                      <div className={styles.quantityControls}>
                        <button className={styles.qtyBtn} onClick={() => addToCart(item)}><FaPlus size={10}/></button>
                        <span>{item.quantity}</span>
                        <button className={styles.qtyBtn} onClick={() => removeFromCart(item.id)}><FaMinus size={10}/></button>
                      </div>
                      <button className={styles.deleteBtn} onClick={() => deleteFromCart(item.id)} aria-label="Eliminar producto">
                        <FaTimes size={11} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className={styles.footer}>
                  <div className={styles.totalContainer}>
                    <span>Precio Total</span>
                    <span>${totalPrice.toLocaleString()}</span>
                  </div>
                  <button className={styles.orderBtn} onClick={handleSendOrder}>Realizar Pedido</button>
                </div>
              </>
            )}

            <AnimatePresence>
              {showAuthPopup && (
                <motion.div
                  className={styles.authOverlay}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    className={styles.authPopup}
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.92, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <FaUserCircle size={38} className={styles.authIcon} />
                    <h3 className={styles.authTitle}>¡Sé parte de nuestro equipo!</h3>
                    <p className={styles.authText}>Los miembros registrados pueden acceder a descuentos y promociones exclusivas.</p>
                    <div className={styles.authActions}>
                      <Link to="/registro" className={styles.authBtnPrimary} onClick={toggleCart}>Unirse</Link>
                      <button className={styles.authBtnDanger} onClick={handleProceedAnyway}>Realizar pedido</button>
                    </div>
                    <button className={styles.authDismiss} onClick={() => setShowAuthPopup(false)}>Volver al carrito</button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CardModal;