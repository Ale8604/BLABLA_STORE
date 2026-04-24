import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMagic, FaCheck, FaExclamationCircle, FaPlay } from 'react-icons/fa';
import { useProducts } from '../../../components/context/ProductsContext';
import { uploadImage } from '../../../lib/supabase';
import { api } from '../../../lib/api';
import styles from './QuitarFondos.module.css';

const PROXY = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/proxy-image?url=`;

const STATUS = { IDLE: 'idle', PROCESSING: 'processing', DONE: 'done', ERROR: 'error' };

const QuitarFondos = () => {
  const { products, updateProduct, loadProducts } = useProducts();
  const workerRef = useRef(null);

  // Productos inactivos con imagen
  const pending = products.filter(p => !p.active && !p.draft && !p.archived && p.image);

  const [itemStatus, setItemStatus] = useState({});
  const [running,    setRunning]    = useState(false);
  const [current,   setCurrent]    = useState(null);
  const abortRef = useRef(false);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../../../workers/removeBg.worker.js', import.meta.url),
      { type: 'module' }
    );
    return () => workerRef.current?.terminate();
  }, []);

  const setStatus = (id, status, extra = {}) =>
    setItemStatus(prev => ({ ...prev, [id]: { status, ...extra } }));

  const processOne = async (product) => {
    setStatus(product.id, STATUS.PROCESSING);
    setCurrent(product.id);

    // Determine images to process (colorVariants or single image)
    const variants = Array.isArray(product.colorVariants) && product.colorVariants.length > 0
      ? product.colorVariants : null;

    try {
      if (variants) {
        // Process each variant image
        const updatedVariants = await Promise.all(
          variants.map(async (v) => {
            if (!v.image) return v;
            const newImage = await removeBgFromUrl(v.image);
            return { ...v, image: newImage };
          })
        );
        const newMainImage = updatedVariants[0]?.image || product.image;
        await updateProduct(product.id, {
          colorVariants: updatedVariants,
          image: newMainImage,
          active: true,
        });
      } else {
        const newImage = await removeBgFromUrl(product.image);
        await updateProduct(product.id, { image: newImage, active: true });
      }

      setStatus(product.id, STATUS.DONE);
    } catch (err) {
      console.error(`Error en producto ${product.id}:`, err);
      setStatus(product.id, STATUS.ERROR, { msg: err.message });
    }
    setCurrent(null);
  };

  const removeBgFromUrl = async (imageUrl) => {
    // Fetch via proxy if external URL, directly if already a blob/supabase URL
    const isExternal = imageUrl.startsWith('http') && !imageUrl.includes('supabase');
    const fetchUrl   = isExternal ? `${PROXY}${encodeURIComponent(imageUrl)}` : imageUrl;

    const res    = await fetch(fetchUrl);
    if (!res.ok) throw new Error(`No se pudo bajar la imagen (${res.status})`);
    const blob   = await res.blob();
    const buffer = await blob.arrayBuffer();

    const result = await new Promise((resolve, reject) => {
      const handler = ({ data }) => {
        workerRef.current.removeEventListener('message', handler);
        data.ok ? resolve(data) : reject(new Error(data.error));
      };
      workerRef.current.addEventListener('message', handler);
      workerRef.current.postMessage({ buffer, mimeType: blob.type }, [buffer]);
    });

    const processedBlob = new Blob([result.buffer], { type: result.type });
    const blobUrl = URL.createObjectURL(processedBlob);
    const supabaseUrl = await uploadImage(blobUrl);
    URL.revokeObjectURL(blobUrl);
    return supabaseUrl;
  };

  const handleProcessAll = async () => {
    abortRef.current = false;
    setRunning(true);
    for (const product of pending) {
      if (abortRef.current) break;
      const already = itemStatus[product.id];
      if (already?.status === STATUS.DONE) continue;
      await processOne(product);
    }
    setRunning(false);
    setCurrent(null);
    await loadProducts();
  };

  const handleProcessOne = async (product) => {
    setRunning(true);
    await processOne(product);
    setRunning(false);
    await loadProducts();
  };

  const handleStop = () => { abortRef.current = true; };

  const doneCount  = Object.values(itemStatus).filter(s => s.status === STATUS.DONE).length;
  const errorCount = Object.values(itemStatus).filter(s => s.status === STATUS.ERROR).length;
  const totalDone  = pending.filter(p => itemStatus[p.id]?.status === STATUS.DONE).length;

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.pageTitle}>QUITAR FONDOS</h2>

      {/* Header card */}
      <div className={styles.headerCard}>
        <div className={styles.headerInfo}>
          <p className={styles.headerDesc}>
            Estos productos fueron importados y están <strong>inactivos</strong>. Al quitarles el fondo se activan automáticamente para los clientes.
          </p>
          {pending.length > 0 && (
            <div className={styles.progressRow}>
              <div className={styles.progressBar}>
                <motion.div
                  className={styles.progressFill}
                  animate={{ width: `${(totalDone / pending.length) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span className={styles.progressLabel}>{totalDone} / {pending.length}</span>
            </div>
          )}
        </div>

        <div className={styles.headerActions}>
          {pending.length === 0 ? (
            <p className={styles.allDoneMsg}><FaCheck size={14} /> Todo al día</p>
          ) : running ? (
            <button className={styles.stopBtn} onClick={handleStop}>Detener</button>
          ) : (
            <button className={styles.processAllBtn} onClick={handleProcessAll}>
              <FaPlay size={12} /> Quitar fondo a todos ({pending.length})
            </button>
          )}
        </div>
      </div>

      {/* Product list */}
      {pending.length === 0 && Object.keys(itemStatus).length === 0 ? (
        <div className={styles.emptyCard}>
          <FaCheck size={32} className={styles.emptyIcon} />
          <p className={styles.emptyText}>No hay productos pendientes</p>
          <p className={styles.emptyHint}>Los productos importados aparecerán aquí automáticamente</p>
        </div>
      ) : (
        <div className={styles.productList}>
          {pending.map(product => {
            const state   = itemStatus[product.id];
            const isProc  = state?.status === STATUS.PROCESSING;
            const isDone  = state?.status === STATUS.DONE;
            const isError = state?.status === STATUS.ERROR;
            const variants = Array.isArray(product.colorVariants) && product.colorVariants.length > 0
              ? product.colorVariants : null;

            return (
              <div
                key={product.id}
                className={`${styles.productRow} ${isDone ? styles.productRowDone : ''} ${isError ? styles.productRowError : ''}`}
              >
                {/* Images */}
                <div className={styles.imageGroup}>
                  {variants
                    ? variants.map((v, i) => (
                        <div key={i} className={styles.imageWrap}>
                          <img src={v.image} alt="" className={styles.thumb} />
                          {isProc && <div className={styles.imgOverlay}><div className={styles.spinner} /></div>}
                        </div>
                      ))
                    : (
                      <div className={styles.imageWrap}>
                        <img src={product.image} alt="" className={styles.thumb} />
                        {isProc && <div className={styles.imgOverlay}><div className={styles.spinner} /></div>}
                      </div>
                    )
                  }
                </div>

                {/* Info */}
                <div className={styles.productInfo}>
                  <span className={styles.productName}>{product.name}</span>
                  <span className={styles.productPrice}>${product.price.toLocaleString()}</span>
                  {variants && (
                    <span className={styles.variantCount}>{variants.length} colores</span>
                  )}
                </div>

                {/* Status / Action */}
                <div className={styles.productAction}>
                  {isDone && (
                    <AnimatePresence>
                      <motion.span
                        className={styles.statusDone}
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                      >
                        <FaCheck size={11} /> Listo · Activo
                      </motion.span>
                    </AnimatePresence>
                  )}
                  {isError && (
                    <span className={styles.statusError} title={state.msg}>
                      <FaExclamationCircle size={11} /> Error
                    </span>
                  )}
                  {isProc && (
                    <span className={styles.statusProc}>
                      <div className={styles.spinnerSmall} /> Procesando…
                    </span>
                  )}
                  {!state && (
                    <button
                      className={styles.singleBtn}
                      onClick={() => handleProcessOne(product)}
                      disabled={running}
                    >
                      <FaMagic size={11} /> Quitar fondo
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuitarFondos;
