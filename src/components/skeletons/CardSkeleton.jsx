import styles from './Skeleton.module.css';

const CardSkeleton = () => (
  <div className={styles.card}>
    <div className={`${styles.bone} ${styles.colorRow}`} />
    <div className={`${styles.bone} ${styles.image}`} />
    <div className={styles.info}>
      <div className={`${styles.bone} ${styles.title}`} />
      <div className={`${styles.bone} ${styles.price}`} />
      <div className={`${styles.bone} ${styles.sub}`} />
      <div className={`${styles.bone} ${styles.btn}`} />
    </div>
  </div>
);

export default CardSkeleton;
