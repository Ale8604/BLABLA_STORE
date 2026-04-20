import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // 1. Función para abrir/cerrar el modal
  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  // 2. Función para añadir productos (o sumar cantidad)
  const addToCart = (product) => {
    setCart((prevCart) => {
      const isItemInCart = prevCart.find((item) => item.id === product.id);
      if (isItemInCart) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  // 3. Función para restar cantidad o eliminar si llega a 0
  const removeFromCart = (productId) => {
    setCart((prevCart) =>
      prevCart.reduce((acc, item) => {
        if (item.id === productId) {
          if (item.quantity > 1) {
            acc.push({ ...item, quantity: item.quantity - 1 });
          }
          // Si la cantidad es 1, no se hace push y desaparece del carrito
        } else {
          acc.push(item);
        }
        return acc;
      }, [])
    );
  };

  // 4. Cálculos automáticos
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  
  const totalPrice = cart.reduce((total, item) => {
    // Limpiamos el precio de comas y símbolos para la operación matemática
    const priceValue = parseFloat(String(item.price).replace(/[^0-9.-]+/g, ""));
    return total + (priceValue * item.quantity);
  }, 0);

  const deleteFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider 
      value={{
        cart,
        addToCart,
        removeFromCart,
        deleteFromCart,
        cartCount,
        isCartOpen,
        toggleCart,
        totalPrice,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);