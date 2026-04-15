import React from 'react';
import { useCart } from '../../context/CartContext'; // Importa el contexto
import styles from './ProductCard.module.css';

const ProductCard = ({ id, name, price, monthly, colors, image }) => {
  const { addToCart } = useCart(); // Extrae la función para agregar

  const handleAddClick = () => {
    // Creamos el objeto del producto que se va al carrito
    const product = { id, name, price, image };
    addToCart(product);
  };

  // Colores por defecto si no vienen en las props (Naranja, Blanco, Azul Slate)
  const defaultColors = ['#FF8A00', '#FFFFFF', '#4B4E6D'];
  const displayColors = colors || defaultColors;

  return (
    <div className={styles.card}>
      <div className={styles.colorSelectors}>
        {displayColors.map((color, index) => (
          <span 
            key={index} 
            className={styles.colorCircle} 
            style={{ backgroundColor: color }}
          ></span>
        ))}
      </div>
      {/* ... resto de tu código de colores e imagen ... */}
      <div className={styles.imageContainer}>
        {/* Asegúrate de que src esté usando la variable correcta */}
        <img src={image} alt={name} className={styles.productImage} /> 
      </div>
      
      <div className={styles.info}>
        <h3 className={styles.productName}>{name}</h3>
        <p className={styles.price}>${price}</p>
        <p className={styles.installments}>Cuotas desde {monthly}$ por mes por 24 meses</p>
        
        {/* Conectamos el click aquí */}
        <button className={styles.addBtn} onClick={handleAddClick}>
          Agregar al Carrito
        </button>
      </div>
    </div>
  );
};

export default ProductCard;