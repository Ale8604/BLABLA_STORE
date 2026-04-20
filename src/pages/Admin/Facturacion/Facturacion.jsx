import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFileInvoiceDollar, FaTimesCircle, FaFilePdf, FaUser, FaPhone, FaIdCard, FaSearch } from 'react-icons/fa';
import { api } from '../../../lib/api';
import styles from './Facturacion.module.css';

const STATUS_LABEL = { PENDING: 'Pendiente', CONFIRMED: 'Confirmado', CANCELLED: 'Cancelado' };
const STATUS_COLOR = { PENDING: styles.badgePending, CONFIRMED: styles.badgeConfirmed, CANCELLED: styles.badgeCancelled };

const generatePDF = async (order) => {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  // Header background
  doc.setFillColor(11, 14, 20);
  doc.rect(0, 0, W, 40, 'F');

  // Logo text
  doc.setTextColor(91, 124, 250);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('BlaBla Store', 14, 18);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Tecnología de calidad, al alcance de todos', 14, 26);
  doc.text('C.C. Monte Bianco, PB Local 19 · Valencia, Carabobo', 14, 32);

  // Invoice code (top right)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(order.invoiceCode, W - 14, 16, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(new Date(order.createdAt).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' }), W - 14, 23, { align: 'right' });

  // Client info box
  doc.setFillColor(245, 247, 252);
  doc.roundedRect(14, 48, W - 28, 22, 3, 3, 'F');
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL CLIENTE', 20, 56);
  doc.setFont('helvetica', 'normal');
  const clientName   = order.clientName   || order.user?.nombre   || 'No registrado';
  const clientPhone  = order.clientPhone  || order.user?.telefono || '—';
  const clientCedula = order.clientCedula || order.user?.cedula   || '—';
  const clientEmail  = order.user?.email  || '—';
  doc.text(`Nombre: ${clientName}   ·   C.I.: ${clientCedula}`, 20, 63);
  doc.text(`Teléfono: ${clientPhone}   ·   Email: ${clientEmail}`, 20, 69);

  // Items table
  autoTable(doc, {
    startY: 78,
    head: [['Producto', 'Especificaciones', 'Precio Unit.', 'Cant.', 'Subtotal']],
    body: order.items.map(i => [
      i.name,
      i.specs || '—',
      `$${Number(i.price).toLocaleString()}`,
      i.quantity,
      `$${(Number(i.price) * i.quantity).toLocaleString()}`,
    ]),
    headStyles: {
      fillColor: [11, 14, 20],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [248, 249, 252] },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 50 },
      2: { halign: 'right' },
      3: { halign: 'center' },
      4: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = doc.lastAutoTable.finalY + 8;

  // Total
  doc.setFillColor(91, 124, 250);
  doc.roundedRect(W - 80, finalY, 66, 14, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', W - 76, finalY + 9);
  doc.text(`$${Number(order.total).toLocaleString()}`, W - 16, finalY + 9, { align: 'right' });

  // Footer
  doc.setTextColor(160, 160, 160);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Gracias por tu compra · BlaBla Store · blablastore.com', W / 2, 285, { align: 'center' });

  doc.save(`Factura-${order.invoiceCode}.pdf`);
};

const Facturacion = () => {
  const [orders,   setOrders]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('ALL');
  const [search,   setSearch]   = useState('');
  const [saving,   setSaving]   = useState(false);
  const [editName,   setEditName]   = useState('');
  const [editPhone,  setEditPhone]  = useState('');
  const [editCedula, setEditCedula] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/orders');
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectOrder = (order) => {
    setSelected(order);
    setEditName(order.clientName   || order.user?.nombre   || '');
    setEditPhone(order.clientPhone || order.user?.telefono || '');
    setEditCedula(order.clientCedula || order.user?.cedula || '');
  };

  const handleConfirm = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await api.patch(`/orders/${selected.id}/status`, {
        status:       'CONFIRMED',
        clientName:   editName,
        clientPhone:  editPhone,
        clientCedula: editCedula,
      });
      const merged = { ...selected, ...updated };
      setOrders(prev => prev.map(o => o.id === merged.id ? merged : o));
      setSelected(merged);
      await generatePDF(merged);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!selected) return;
    const updated = await api.patch(`/orders/${selected.id}/status`, { status: 'CANCELLED' });
    const merged  = { ...selected, ...updated };
    setOrders(prev => prev.map(o => o.id === merged.id ? merged : o));
    setSelected(merged);
  };

  const handleDownloadPDF = () => selected && generatePDF(selected);

  const filtered = orders.filter(o => {
    const matchStatus = filter === 'ALL' || o.status === filter;
    const matchSearch = !search ||
      o.invoiceCode?.toLowerCase().includes(search.toLowerCase()) ||
      o.clientName?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.pageTitle}>FACTURACIÓN</h2>

      <div className={styles.layout}>
        {/* ── Lista ── */}
        <div className={styles.list}>
          <div className={styles.listHeader}>
            <div className={styles.searchBox}>
              <FaSearch size={12} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder="Buscar por código o cliente…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className={styles.filterTabs}>
              {['ALL','PENDING','CONFIRMED','CANCELLED'].map(s => (
                <button
                  key={s}
                  className={`${styles.filterTab} ${filter === s ? styles.filterTabActive : ''}`}
                  onClick={() => setFilter(s)}
                >
                  {s === 'ALL' ? 'Todos' : STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className={styles.empty}>Cargando pedidos…</div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>No hay pedidos.</div>
          ) : (
            filtered.map(order => (
              <motion.div
                key={order.id}
                className={`${styles.orderRow} ${selected?.id === order.id ? styles.orderRowActive : ''}`}
                onClick={() => selectOrder(order)}
                whileHover={{ x: 3 }}
                transition={{ duration: 0.15 }}
              >
                <div className={styles.orderRowLeft}>
                  <span className={styles.orderCode}>{order.invoiceCode}</span>
                  <span className={styles.orderClient}>{order.clientName || order.user?.nombre || 'Sin nombre'}</span>
                  <span className={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div className={styles.orderRowRight}>
                  <span className={styles.orderTotal}>${Number(order.total).toLocaleString()}</span>
                  <span className={`${styles.badge} ${STATUS_COLOR[order.status]}`}>{STATUS_LABEL[order.status]}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* ── Detalle ── */}
        <div className={styles.detail}>
          <AnimatePresence mode="wait">
            {!selected ? (
              <motion.div key="empty" className={styles.detailEmpty} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <FaFileInvoiceDollar size={44} className={styles.detailEmptyIcon} />
                <p>Seleccioná un pedido para ver el detalle</p>
              </motion.div>
            ) : (
              <motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

                <div className={styles.detailHeader}>
                  <div>
                    <h3 className={styles.detailCode}>{selected.invoiceCode}</h3>
                    <p className={styles.detailDate}>{new Date(selected.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`${styles.badge} ${STATUS_COLOR[selected.status]}`}>{STATUS_LABEL[selected.status]}</span>
                </div>

                {/* Client info */}
                <div className={styles.clientBox}>
                  <div className={styles.clientField}>
                    <FaUser size={11} className={styles.clientIcon} />
                    <input
                      className={styles.clientInput}
                      placeholder="Nombre del cliente"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                    />
                  </div>
                  <div className={styles.clientField}>
                    <FaPhone size={11} className={styles.clientIcon} />
                    <input
                      className={styles.clientInput}
                      placeholder="Teléfono"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                    />
                  </div>
                  <div className={styles.clientField}>
                    <FaIdCard size={11} className={styles.clientIcon} />
                    <input
                      className={styles.clientInput}
                      placeholder="Cédula"
                      value={editCedula}
                      onChange={e => setEditCedula(e.target.value)}
                    />
                  </div>
                </div>

                {/* Items */}
                <div className={styles.itemsTable}>
                  <div className={styles.tableHead}>
                    <span>Producto</span>
                    <span>Cant.</span>
                    <span>Precio</span>
                    <span>Subtotal</span>
                  </div>
                  {selected.items.map((item, i) => (
                    <div key={i} className={styles.tableRow}>
                      <div>
                        <p className={styles.itemName}>{item.name}</p>
                        {item.specs && <p className={styles.itemSpecs}>{item.specs}</p>}
                      </div>
                      <span>{item.quantity}</span>
                      <span>${Number(item.price).toLocaleString()}</span>
                      <span>${(Number(item.price) * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className={styles.totalRow}>
                    <span>Total</span>
                    <span>${Number(selected.total).toLocaleString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                  {selected.status === 'PENDING' && (
                    <>
                      <button className={styles.btnConfirm} onClick={handleConfirm} disabled={saving}>
                        <FaFilePdf size={14} />
                        {saving ? 'Generando…' : 'Confirmar y Generar PDF'}
                      </button>
                      <button className={styles.btnCancel} onClick={handleCancel}>
                        <FaTimesCircle size={13} /> Cancelar pedido
                      </button>
                    </>
                  )}
                  {selected.status === 'CONFIRMED' && (
                    <button className={styles.btnPdf} onClick={handleDownloadPDF}>
                      <FaFilePdf size={14} /> Descargar PDF
                    </button>
                  )}
                  {selected.status === 'CANCELLED' && (
                    <div className={styles.cancelledNote}>
                      <FaTimesCircle size={13} /> Pedido cancelado
                    </div>
                  )}
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Facturacion;
