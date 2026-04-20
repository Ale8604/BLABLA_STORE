import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa';
import styles from './ProductCard.module.css';

const getOfferActive = (discountPercent, offerStart, offerEnd) => {
  if (!discountPercent) return false;
  const now = new Date();
  if (offerStart && new Date(offerStart) > now) return false;
  if (offerEnd   && new Date(offerEnd)   < now) return false;
  return true;
};

const ProductCard = ({ id, name, price, monthly, meses, colorVariants, image, discountPercent, offerStart, offerEnd }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const variants = Array.isArray(colorVariants) && colorVariants.length > 0 ? colorVariants : null;
  const [activeImage, setActiveImage] = useState(variants?.[0]?.image || image);

  const offerActive    = getOfferActive(discountPercent, offerStart, offerEnd);
  const displayPrice   = offerActive ? Math.round(price * (1 - discountPercent / 100)) : price;

  return (
    <div
      className={styles.card}
      onClick={() => navigate(`/producto/${id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {variants && (
        <div className={styles.colorSelectors}>
          {variants.map((v, i) => (
            <span
              key={i}
              className={`${styles.colorCircle} ${activeImage === v.image ? styles.colorCircleActive : ''}`}
              style={{ backgroundColor: v.color }}
              onMouseEnter={(e) => { e.stopPropagation(); setActiveImage(v.image); }}
            />
          ))}
        </div>
      )}

      {offerActive && (
        <div className={styles.discountBadge}>-{discountPercent}%</div>
      )}

      <div className={styles.imageContainer}>
        <AnimatePresence mode="crossfade">
          <motion.img
            key={activeImage}
            src={activeImage}
            alt={name}
            className={styles.productImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
        </AnimatePresence>
      </div>

      <div className={styles.info}>
        <h3 className={styles.productName}>{name}</h3>
        <div className={styles.priceRow}>
          <p className={styles.price}>${displayPrice.toLocaleString()}</p>
          {offerActive && <p className={styles.priceOriginal}>${price.toLocaleString()}</p>}
        </div>
        <p className={styles.installments}>Cuotas desde {monthly}$ por mes por {meses ?? 24} meses</p>

        <motion.div
          className={styles.detailRow}
          animate={{ gap: hovered ? '10px' : '6px' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <span className={styles.detailText}>Ver detalles</span>
          <motion.span
            animate={{ x: hovered ? 4 : 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <FaArrowRight size={11} className={styles.detailArrow} />
          </motion.span>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductCard;
