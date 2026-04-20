import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPercent, FaPlus, FaTrash, FaEdit, FaCheck, FaTimes, FaSave } from 'react-icons/fa';
import { api } from '../../../lib/api';
import styles from './Comisiones.module.css';

const CATEGORIAS_DEFAULT = ['Teléfonos','Tablets','Accesorios','Laptops','Audífonos','Cargadores','Otros'];

const Comisiones = () => {
  const [rules,    setRules]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);
  const [cat,      setCat]      = useState('');
  const [pct,      setPct]      = useState('');
  const [catInput, setCatInput] = useState('custom');
  const [saving,   setSaving]   = useState(false);
  const [editing,  setEditing]  = useState(null); // { id, porcentaje }

  const load = async () => {
    setLoading(true);
    try { setRules(await api.get('/comisiones')); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setCat(''); setPct(''); setCatInput('custom'); setModal('create'); };

  const handleSave = async () => {
    const categoria = catInput === 'custom' ? cat : catInput;
    if (!categoria.trim() || pct === '') return;
    setSaving(true);
    try {
      const rule = await api.post('/comisiones', { categoria, porcentaje: Number(pct) });
      setRules(prev => {
        const idx = prev.findIndex(r => r.id === rule.id);
        return idx >= 0 ? prev.map(r => r.id === rule.id ? rule : r) : [...prev, rule];
      });
      setModal(null);
    } finally { setSaving(false); }
  };

  const handleInlineEdit = async (rule) => {
    const pctVal = Number(editing.porcentaje);
    if (isNaN(pctVal) || pctVal < 0 || pctVal > 100) return;
    const updated = await api.post('/comisiones', { categoria: rule.categoria, porcentaje: pctVal });
    setRules(prev => prev.map(r => r.id === updated.id ? updated : r));
    setEditing(null);
  };

  const handleDelete = async (id) => {
    await api.delete(`/comisiones/${id}`);
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const existingCats = rules.map(r => r.categoria);
  const availableCats = CATEGORIAS_DEFAULT.filter(c => !existingCats.includes(c));

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>COMISIONES</h2>
          <p className={styles.pageSub}>Configura el porcentaje de comisión por categoría de producto</p>
        </div>
        <button className={styles.btnAdd} onClick={openCreate}>
          <FaPlus size={13} /> Nueva regla
        </button>
      </div>

      <div className={styles.info}>
        <FaPercent size={13} className={styles.infoIcon} />
        <p>La comisión se calcula sobre el subtotal de cada ítem vendido según su categoría, aplicado a las ventas <strong>confirmadas</strong> del mes.</p>
      </div>

      {loading ? (
        <div className={styles.list}>
          {[...Array(4)].map((_, i) => <div key={i} className={styles.skeletonRow} />)}
        </div>
      ) : rules.length === 0 ? (
        <div className={styles.empty}>
          <FaPercent size={36} className={styles.emptyIcon} />
          <p>No hay reglas de comisión configuradas.</p>
          <button className={styles.btnAdd} onClick={openCreate}><FaPlus size={12} /> Agregar primera regla</button>
        </div>
      ) : (
        <div className={styles.list}>
          <div className={styles.listHeader}>
            <span>Categoría</span>
            <span>% Comisión</span>
            <span>Acciones</span>
          </div>
          <AnimatePresence>
            {rules.map((rule, i) => (
              <motion.div key={rule.id} className={styles.row}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ delay: i * 0.05 }}>
                <span className={styles.rowCat}>{rule.categoria}</span>
                <div className={styles.rowPct}>
                  {editing?.id === rule.id ? (
                    <div className={styles.editPct}>
                      <input
                        className={styles.pctInput}
                        type="number" min="0" max="100" step="0.1"
                        value={editing.porcentaje}
                        onChange={e => setEditing(prev => ({ ...prev, porcentaje: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleInlineEdit(rule)}
                        autoFocus
                      />
                      <span className={styles.pctSign}>%</span>
                      <button className={styles.iconBtnGreen} onClick={() => handleInlineEdit(rule)}><FaCheck size={11} /></button>
                      <button className={styles.iconBtn} onClick={() => setEditing(null)}><FaTimes size={11} /></button>
                    </div>
                  ) : (
                    <span className={styles.pctBadge}>{rule.porcentaje}%</span>
                  )}
                </div>
                <div className={styles.rowActions}>
                  <button className={styles.iconBtn} onClick={() => setEditing({ id: rule.id, porcentaje: rule.porcentaje })} title="Editar">
                    <FaEdit size={13} />
                  </button>
                  <button className={styles.iconBtnRed} onClick={() => handleDelete(rule.id)} title="Eliminar">
                    <FaTrash size={12} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal nueva regla */}
      <AnimatePresence>
        {modal && (
          <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setModal(null)}>
            <motion.div className={styles.modal} initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }} transition={{ duration: 0.2 }} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Nueva regla de comisión</h3>
                <button className={styles.modalClose} onClick={() => setModal(null)}><FaTimes size={14} /></button>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Categoría</label>
                <select className={styles.input} value={catInput} onChange={e => setCatInput(e.target.value)}>
                  {availableCats.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="custom">Otra (escribir)</option>
                </select>
                {catInput === 'custom' && (
                  <input className={styles.input} placeholder="Nombre de la categoría" value={cat}
                    onChange={e => setCat(e.target.value)} />
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Porcentaje de comisión</label>
                <div className={styles.pctField}>
                  <input className={styles.input} type="number" min="0" max="100" step="0.1"
                    placeholder="Ej: 3.5" value={pct} onChange={e => setPct(e.target.value)} />
                  <span className={styles.pctSuffix}>%</span>
                </div>
                {pct && <p className={styles.preview}>Ejemplo: venta de $100 → comisión de <strong>${(100 * Number(pct) / 100).toFixed(2)}</strong></p>}
              </div>

              <div className={styles.modalActions}>
                <button className={styles.btnCancel} onClick={() => setModal(null)}>Cancelar</button>
                <button className={styles.btnSave} onClick={handleSave}
                  disabled={(!cat.trim() && catInput === 'custom') || pct === '' || saving}>
                  <FaSave size={12} /> {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Comisiones;
