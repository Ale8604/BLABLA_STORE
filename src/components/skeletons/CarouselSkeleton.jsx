import styles from './Skeleton.module.css';

const CarouselSkeleton = () => (
  <div className={styles.carouselWrapper}>
    <div className={`${styles.bone} ${styles.carouselSide}`} />
    <div className={`${styles.bone} ${styles.carouselCenter}`} />
    <div className={`${styles.bone} ${styles.carouselSide}`} />
  </div>
);

export default CarouselSkeleton;
