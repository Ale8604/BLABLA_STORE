import { motion } from 'framer-motion';

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 22, filter: 'blur(6px)' }}
    animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
    exit={{
      opacity: 0,
      y: -10,
      filter: 'blur(4px)',
      transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
    }}
    transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
    style={{ width: '100%', height: '100%' }}
  >
    {children}
  </motion.div>
);

export default PageTransition;
