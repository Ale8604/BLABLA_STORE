import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStore, FaPlus, FaEdit, FaUsers, FaToggleOn, FaToggleOff, FaTimes, FaCheck } from 'react-icons/fa';
import { api } from '../../../lib/api';
import styles from './Cajas.module.css';

const PREFIX = 'BLABLA STORE ';

const Cajas = () => {
  const [sedes,   setSedes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // null | 'create' | sede object
  const [nombre,  setNombre]  = useState('');
  const [direccion, setDireccion] = useState('');
  const [saving,  setSaving]  = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try { setSedes(await api.get('/sedes')); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setNombre(''); setDireccion(''); setModal('create'); };
  const openEdit   = (sede) => { setNombre(sede.nombre.replace(PREFIX, '')); setDireccion(sede.direccion); setModal(sede); };

  const handleSave = async () => {
    if (!nombre.trim()) return;
    setSaving(true);
    try {
      const fullName = `${PREFIX}${nombre.trim()}`;
      if (modal === 'create') {
        const nueva = await api.post('/sedes', { nombre: fullName, direccion });
        setSedes(prev => [...prev, { ...nueva, _count: { vendedores: 0, orders: 0 } }]);
      } else {
        const updated = await api.patch(`/sedes/${modal.id}`, { nombre: fullName, direccion });
        setSedes(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
      }
      setModal(null);
    } finally { setSaving(false); }
  };

  const toggleActiva = async (sede) => {
    const updated = await api.patch(`/sedes/${sede.id}`, { activa: !sede.activa });
    setSedes(prev => prev.map(s => s.id === sede.id ? { ...s, ...updated } : s));
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>CAJAS Y SEDES</h2>
          <p className={styles.pageSub}>Gestiona las sedes y sus vendedores</p>
        </div>
        <button className={styles.btnAdd} onClick={openCreate}>
          <FaPlus size={13} /> Nueva sede
        </button>
      </div>

      {loading ? (
        <div className={styles.grid}>
          {[...Array(4)].map((_, i) => <div key={i} className={styles.skeletonCard} />)}
        </div>
      ) : sedes.length === 0 ? (
        <div className={styles.empty}>
          <FaStore size={40} className={styles.emptyIcon} />
          <p>No hay sedes creadas aún.</p>
          <button className={styles.btnAdd} onClick={openCreate}><FaPlus size={12} /> Crear primera sede</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {sedes.map((sede, i) => (
            <motion.div
              key={sede.id}
              className={`${styles.card} ${!sede.activa ? styles.cardInactiva : ''}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <div className={styles.cardTop}>
                <div className={styles.cardIcon}><FaStore size={22} /></div>
                <div className={styles.cardActions}>
                  <button className={styles.iconBtn} onClick={() => openEdit(sede)} title="Editar">
                    <FaEdit size={14} />
                  </button>
                  <button className={styles.iconBtn} onClick={() => toggleActiva(sede)} title={sede.activa ? 'Desactivar' : 'Activar'}>
                    {sede.activa ? <FaToggleOn size={18} className={styles.toggleOn} /> : <FaToggleOff size={18} className={styles.toggleOff} />}
                  </button>
                </div>
              </div>

              <h3 className={styles.cardName}>{sede.nombre}</h3>
              {sede.direccion && <p className={styles.cardDir}>{sede.direccion}</p>}

              <div className={styles.cardStats}>
                <span className={styles.statItem}>
                  <FaUsers size={12} /> {sede._count?.vendedores ?? 0} vendedores
                </span>
                <span className={styles.statItem}>
                  {sede._count?.orders ?? 0} pedidos
                </span>
              </div>

              <button className={styles.btnVer} onClick={() => navigate(`/admin/cajas/${sede.id}`)}>
                Ver caja <span>→</span>
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      <AnimatePresence>
        {modal && (
          <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setModal(null)}>
            <motion.div className={styles.modal} initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }} transition={{ duration: 0.2 }} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>{modal === 'create' ? 'Nueva sede' : 'Editar sede'}</h3>
                <button className={styles.modalClose} onClick={() => setModal(null)}><FaTimes size={14} /></button>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Nombre de la sede</label>
                <div className={styles.prefixInput}>
                  <span className={styles.prefix}>BLABLA STORE</span>
                  <input
                    className={styles.input}
                    placeholder="Ej: Norte, Centro, Las Americas..."
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                  />
                </div>
                {nombre && <p className={styles.preview}>Nombre final: <strong>BLABLA STORE {nombre}</strong></p>}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Dirección (opcional)</label>
                <input
                  className={styles.input}
                  placeholder="Ej: C.C. Monte Bianco, PB Local 5"
                  value={direccion}
                  onChange={e => setDireccion(e.target.value)}
                />
              </div>

              <div className={styles.modalActions}>
                <button className={styles.btnCancel} onClick={() => setModal(null)}>Cancelar</button>
                <button className={styles.btnSave} onClick={handleSave} disabled={!nombre.trim() || saving}>
                  <FaCheck size={12} /> {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Cajas;
