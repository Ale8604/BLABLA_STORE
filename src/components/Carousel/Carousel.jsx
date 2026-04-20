import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useBanners } from '../context/BannersContext';
import styles from './Carousel.module.css';

const INTERVAL = 10000;

const centerVariants = {
  enter: (dir) => ({
    x: dir > 0 ? '40%' : '-40%',
    rotateY: dir > 0 ? 35 : -35,
    opacity: 0,
    scale: 0.85,
  }),
  center: {
    x: 0,
    rotateY: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  },
  exit: (dir) => ({
    x: dir > 0 ? '-40%' : '40%',
    rotateY: dir > 0 ? -35 : 35,
    opacity: 0,
    scale: 0.85,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  }),
};

const Carousel = () => {
  const { activeBanners } = useBanners();
  const [current, setCurrent]     = useState(0);
  const [direction, setDirection] = useState(1);
  const timerRef                  = useRef(null);
  const total = activeBanners.length;

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    if (total > 1) {
      timerRef.current = setInterval(() => {
        setDirection(1);
        setCurrent(c => (c + 1) % total);
      }, INTERVAL);
    }
  }, [total]);

  useEffect(() => { resetTimer(); return () => clearInterval(timerRef.current); }, [resetTimer]);
  useEffect(() => { setCurrent(0); }, [total]);

  const goNext = () => { setDirection(1);  setCurrent(c => (c + 1) % total);          resetTimer(); };
  const goPrev = () => { setDirection(-1); setCurrent(c => (c - 1 + total) % total);  resetTimer(); };
  const goTo   = (i) => { setDirection(i > current ? 1 : -1); setCurrent(i);          resetTimer(); };

  if (total === 0) return null;

  const prevIdx = (current - 1 + total) % total;
  const nextIdx = (current + 1) % total;

  return (
    <div className={styles.wrapper}>
      <div className={styles.stage}>

        {/* Lateral izquierdo — rotado en Y */}
        {total > 1 && (
          <div className={`${styles.side} ${styles.sideLeft}`} onClick={goPrev}>
            <img src={activeBanners[prevIdx].image} alt="" className={styles.image} />
            <div className={styles.overlay} />
          </div>
        )}

        {/* Centro con animación 3D */}
        <div className={styles.centerBox}>
          <AnimatePresence mode="popLayout" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={centerVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className={styles.centerSlide}
              style={{ transformPerspective: 1000 }}
            >
              <img
                src={activeBanners[current].image}
                alt={activeBanners[current].title || ''}
                className={styles.image}
              />
              {activeBanners[current].title && (
                <div className={styles.caption}>{activeBanners[current].title}</div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Lateral derecho — rotado en Y */}
        {total > 1 && (
          <div className={`${styles.side} ${styles.sideRight}`} onClick={goNext}>
            <img src={activeBanners[nextIdx].image} alt="" className={styles.image} />
            <div className={styles.overlay} />
          </div>
        )}
      </div>

      {total > 1 && (
        <>
          <button className={`${styles.arrow} ${styles.arrowLeft}`} onClick={goPrev}>
            <FaChevronLeft size={18} />
          </button>
          <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={goNext}>
            <FaChevronRight size={18} />
          </button>
          <div className={styles.dots}>
            {activeBanners.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Carousel;
