import React, { useState } from 'react'; // 1. Importar useState
import { useCart } from '../../context/CartContext';
import styles from './CardModal.module.css';
import { FaPlus, FaMinus, FaShoppingBag, FaCheckCircle } from 'react-icons/fa'; // Icono de check
import { motion, AnimatePresence } from 'framer-motion';

const CardModal = () => {
  const { cart, isCartOpen, toggleCart, totalPrice, addToCart, removeFromCart, clearCart } = useCart();
  const [isOrderSent, setIsOrderSent] = useState(false); // 2. Estado para la confirmación

  const handleSendOrder = () => {
    if (cart.length === 0) return;

    // Lógica de WhatsApp
    const message = cart.map(item => `• ${item.name} (x${item.quantity}) - $${item.price}`).join('\n');
    const totalText = `\n\n*Total a pagar: $${totalPrice.toLocaleString()}*`;
    const header = `¡Hola! Me gustaría realizar el siguiente pedido en *BlaBla Store*:\n\n`;
    const encodedMessage = encodeURIComponent(header + message + totalText);
    const phoneNumber = import.meta.env.VITE_WHATSAPP_NUMBER; 

    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');

    // 3. Activar pantalla de éxito y limpiar carrito
    setIsOrderSent(true);
    
    // Opcional: Si quieres que el carrito se vacíe automáticamente tras enviar:
    // clearCart(); 
  };

  // Resetear el estado de éxito cuando se cierra el modal
  const handleClose = () => {
    toggleCart();
    setTimeout(() => setIsOrderSent(false), 500); // Esperamos a que termine la animación de salida
  };

  if (!isCartOpen) return null;

  return (
    <AnimatePresence>
      {isCartOpen && (
        <motion.div className={styles.overlay} onClick={handleClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div 
            className={styles.modal} 
            onClick={(e) => e.stopPropagation()}
            initial={{ y: -20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.95 }}
          >
            <h2 className={styles.title}>CARRITO</h2>

            {isOrderSent ? (
              /* PANTALLA DE GRACIAS */
              <motion.div 
                className={styles.successState}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <FaCheckCircle size={60} className={styles.successIcon} />
                <h3>¡Gracias por tu pedido!</h3>
                <p>Tu solicitud ha sido enviada con éxito. Gracias por preferirnos.</p>
                <button className={styles.orderBtn} onClick={handleClose}>
                  Continuar navegando
                </button>
              </motion.div>
            ) : cart.length === 0 ? (
              /* CARRITO VACÍO */
              <div className={styles.emptyCart}>
                <FaShoppingBag size={50} className={styles.emptyIcon} />
                <p>Tu carrito está vacío</p>
              </div>
            ) : (
              /* LISTA DE PRODUCTOS (Lo que ya tienes) */
              <>
                <div className={styles.itemList}>
                  {cart.map((item) => (
                    <div key={item.id} className={styles.cartItem}>
                      {/* ... contenido del item ... */}
                    </div>
                  ))}
                </div>
                <div className={styles.footer}>
                  <div className={styles.totalContainer}>
                    <span>Precio Total</span>
                    <span>${totalPrice.toLocaleString()}</span>
                  </div>
                  <button className={styles.orderBtn} onClick={handleSendOrder}>
                    Realizar Pedido
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CardModal;