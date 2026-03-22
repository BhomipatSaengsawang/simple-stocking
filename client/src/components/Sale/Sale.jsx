import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // ✅ import useNavigate
import QRCode from 'qrcode';
import generatePayload from 'promptpay-qr';
import {
    Search, Plus, Minus, Trash2, ShoppingCart,
    CreditCard, X, Package, Tag,
    CheckCircle, AlertTriangle, Info,
    QrCode, Smartphone, Edit3, Banknote, Wifi,
} from 'lucide-react';
import styles from './Sale.module.css';
import ProductImage from '../ProductImage/ProductImage';

// ✅ Use env variable
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// ✅ Auth header helper
const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

/* ── PromptPay Setup Modal ─────────────────────────────────────── */
const PromptPaySetupModal = ({ onClose, onSaved, currentNumber }) => {
    const [input, setInput]   = useState(currentNumber || '');
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState('');
    const isEdit = !!currentNumber;

    const formatPhone = (num) => num?.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3') ?? '';

    const handleSave = async () => {
        const cleaned = input.replace(/\D/g, '');
        if (cleaned.length < 9 || cleaned.length > 10) {
            setError('กรุณากรอกเบอร์โทรศัพท์ 9-10 หลักให้ถูกต้อง');
            return;
        }
        setSaving(true);
        setError('');
        try {
            await axios.put(
                `${API_BASE}/user/promptpay`,
                { promptpay_number: cleaned },
                getAuthHeader()
            );
            onSaved(cleaned);
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'บันทึกไม่สำเร็จ');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div className={styles.modalTitleGroup}>
                        <div className={styles.modalIcon} style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', color: '#c084fc' }}>
                            <QrCode size={16} />
                        </div>
                        <h3>{isEdit ? 'แก้ไข PromptPay' : 'ตั้งค่า PromptPay'}</h3>
                    </div>
                    <button className={styles.modalClose} onClick={onClose} disabled={saving}>
                        <X size={15} />
                    </button>
                </div>
                <div className={styles.modalBody} style={{ paddingBottom: 0 }}>
                    {isEdit && (
                        <div className={styles.ppCurrentRow}>
                            <span className={styles.ppCurrentLabel}>หมายเลขปัจจุบัน</span>
                            <span className={styles.ppCurrentNumber}>{formatPhone(currentNumber)}</span>
                        </div>
                    )}
                    <p className={styles.modalSectionLabel}>
                        {isEdit ? 'หมายเลขใหม่' : 'หมายเลข PromptPay'}
                    </p>
                    <div className={`${styles.ppInputGroup} ${error ? styles.ppInputGroupError : ''}`}>
                        <Smartphone size={14} className={styles.ppInputIcon} />
                        <input
                            className={styles.ppInput}
                            type="tel"
                            placeholder="กรอกเบอร์มือถือ (10 หลัก)"
                            value={input}
                            onChange={e => { setInput(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                            onKeyDown={e => e.key === 'Enter' && handleSave()}
                            autoFocus
                        />
                        <span className={styles.ppInputCount}>{input.length}/10</span>
                    </div>
                    {error && <p className={styles.ppError}>{error}</p>}
                    <p className={styles.ppHint} style={{ marginTop: 10, marginBottom: 0 }}>
                        หมายเลขนี้จะใช้สร้าง QR Code สำหรับรับชำระเงิน
                    </p>
                </div>
                <div className={styles.modalActions} style={{ paddingTop: 20 }}>
                    <button className={styles.modalCancelBtn} onClick={onClose} disabled={saving}>ยกเลิก</button>
                    <button
                        className={styles.modalConfirmBtn}
                        onClick={handleSave}
                        disabled={saving || input.length < 9}
                        style={{ background: 'linear-gradient(135deg, #c084fc, #7c3aed)' }}
                    >
                        {saving
                            ? <><span className={styles.checkoutSpinner} />กำลังบันทึก...</>
                            : <><CheckCircle size={14} />{isEdit ? 'บันทึกการเปลี่ยนแปลง' : 'บันทึกและเปิดใช้งาน'}</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ── Confirm Payment Modal ─────────────────────────────────────── */
const ConfirmModal = ({ cart, subtotal, onConfirm, onCancel, loading, promptpayNumber }) => {
    const totalItems = cart.reduce((s, i) => s + i.qty, 0);
    const [payMethod, setPayMethod]       = useState('cash');
    const [qrDataUrl, setQrDataUrl]       = useState('');
    const [generatingQr, setGeneratingQr] = useState(false);

    const generateQR = useCallback(async () => {
        if (!promptpayNumber || payMethod !== 'qr_code') return;  // ✅ fixed
        setGeneratingQr(true);
        try {
            const payload = generatePayload(promptpayNumber, { amount: subtotal });
            const url = await QRCode.toDataURL(payload, {
                width: 220, margin: 2,
                color: { dark: '#0d1526', light: '#ffffff' },
            });
            setQrDataUrl(url);
        } catch (e) {
            console.error('QR generation failed', e);
        } finally {
            setGeneratingQr(false);
        }
    }, [promptpayNumber, subtotal, payMethod]);

    useEffect(() => {
        if (payMethod === 'qr_code') generateQR();  // ✅ fixed
        else setQrDataUrl('');
    }, [payMethod, generateQR]);

    const formatPhone = (num) => num?.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3') ?? '';

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <div className={styles.modalTitleGroup}>
                        <div className={styles.modalIcon}><CreditCard size={16} /></div>
                        <h3>ยืนยันการชำระเงิน</h3>
                    </div>
                    <button className={styles.modalClose} onClick={onCancel} disabled={loading}><X size={15} /></button>
                </div>
                <div className={styles.modalBody}>
                    <p className={styles.modalSectionLabel}>รายการสินค้า</p>
                    <div className={styles.modalItemList}>
                        {cart.map(item => (
                            <div key={item.products_id} className={styles.modalItem}>
                                <div className={styles.modalItemName}>
                                    <span>{item.products_name}</span>
                                    <span className={styles.modalItemQty}>× {item.qty}</span>
                                </div>
                                <span className={styles.modalItemPrice}>
                                    ฿{(item.products_price * item.qty).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className={styles.modalSummary}>
                        <span className={styles.modalSummaryCount}>{cart.length} รายการ ({totalItems} ชิ้น)</span>
                        <div>
                            <span className={styles.modalSummaryLabel}>ยอดรวม </span>
                            <span className={styles.modalSummaryTotal}>
                                ฿{subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>
                <div className={styles.ppMethodSection}>
                    <p className={styles.modalSectionLabel} style={{ marginBottom: 10 }}>วิธีชำระเงิน</p>
                    <div className={styles.ppMethodRow}>
                        <button
                            className={`${styles.ppMethodBtn} ${payMethod === 'cash' ? styles.ppMethodBtnActive : ''}`}
                            onClick={() => setPayMethod('cash')}
                        >
                            <Banknote size={16} /><span>เงินสด</span>
                        </button>
                        <button
                            className={`${styles.ppMethodBtn} ${payMethod === 'qr_code' ? styles.ppMethodBtnActivePp : ''} ${!promptpayNumber ? styles.ppMethodBtnDisabled : ''}`}  // ✅ fixed
                            onClick={() => promptpayNumber && setPayMethod('qr_code')}  // ✅ fixed
                            disabled={!promptpayNumber}
                            title={!promptpayNumber ? 'กรุณาตั้งค่า PromptPay ก่อน' : ''}
                        >
                            <QrCode size={16} /><span>PromptPay</span>
                            {!promptpayNumber && <span className={styles.ppMethodLock}>ยังไม่เปิดใช้</span>}
                        </button>
                    </div>
                </div>
                {payMethod === 'qr_code' && (  // ✅ fixed
                    <div className={styles.ppQrSection}>
                        <div className={styles.ppQrWrap}>
                            {generatingQr ? (
                                <div className={styles.ppQrLoading}>
                                    <span className={styles.checkoutSpinner}
                                        style={{ borderColor: 'rgba(192,132,252,0.3)', borderTopColor: '#c084fc' }} />
                                </div>
                            ) : qrDataUrl ? (
                                <img src={qrDataUrl} alt="PromptPay QR" className={styles.ppQrImg} />
                            ) : null}
                        </div>
                        <p className={styles.ppQrLabel}>{formatPhone(promptpayNumber)}</p>
                        <p className={styles.ppHint}>สแกน QR ด้วยแอปธนาคารเพื่อชำระเงิน</p>
                    </div>
                )}
                {payMethod === 'cash' && (
                    <div className={styles.modalPayNote}>
                        <Info size={13} /><span>ชำระด้วยเงินสด</span>
                    </div>
                )}
                <div className={styles.modalActions}>
                    <button className={styles.modalCancelBtn} onClick={onCancel} disabled={loading}>ยกเลิก</button>
                    <button className={styles.modalConfirmBtn} onClick={() => onConfirm(payMethod)} disabled={loading}>
                        {loading
                            ? <><span className={styles.checkoutSpinner} />กำลังดำเนินการ...</>
                            : <><CheckCircle size={14} />ยืนยันชำระเงิน ฿{subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ── Main Sale Component ───────────────────────────────────────── */
const Sale = () => {
    const navigate = useNavigate();

    const [products, setProducts]               = useState([]);
    const [cart, setCart]                       = useState([]);
    const [searchTerm, setSearchTerm]           = useState('');
    const [categories, setCategories]           = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading]                 = useState(true);
    const [checkingOut, setCheckingOut]         = useState(false);
    const [showConfirm, setShowConfirm]         = useState(false);
    const [showPromptPaySetup, setShowPromptPaySetup] = useState(false);
    const [promptpayNumber, setPromptpayNumber] = useState(null);
    const [toast, setToast]                     = useState(null);
    const [error, setError]                     = useState(null);

    const showToast = useCallback((msg, type = 'info', sub = '') => {
        setToast({ msg, type, sub });
        setTimeout(() => setToast(null), 4000);
    }, []);

    useEffect(() => {
        if (!localStorage.getItem('token')) navigate('/login');
    }, [navigate]);

    useEffect(() => {
        const fetchPromptPay = async () => {
            try {
                if (!localStorage.getItem('token')) return;
                const res = await axios.get(`${API_BASE}/user/promptpay`, getAuthHeader());
                if (res.data.promptpay_number) setPromptpayNumber(res.data.promptpay_number);
            } catch (e) { /* not critical */ }
        };
        fetchPromptPay();
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [prodRes, catRes] = await Promise.all([
                axios.get(`${API_BASE}/products`,   getAuthHeader()),
                axios.get(`${API_BASE}/categories`, getAuthHeader()),
            ]);
            setProducts((prodRes.data.data ?? []).filter(p => p.is_available === true));
            const catData = catRes.data.success ? catRes.data.data : catRes.data;
            setCategories(catData ?? []);
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
                return;
            }
            setError('ไม่สามารถโหลดข้อมูลได้');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const addToCart = useCallback((product) => {
        if (product.track_stock && product.products_stock <= 0) {
            showToast('สินค้าหมดสต็อก!', 'warn'); return;
        }
        setCart(prev => {
            const exist = prev.find(i => i.products_id === product.products_id);
            if (exist) {
                if (product.track_stock && exist.qty >= product.products_stock) {
                    showToast('ไม่สามารถเพิ่มเกินจำนวนสต็อกที่มี', 'warn');
                    return prev;
                }
                return prev.map(i => i.products_id === product.products_id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, {
                products_id    : product.products_id,
                products_name  : product.products_name,
                products_price : product.products_price,
                track_stock    : product.track_stock,
                qty            : 1,
            }];
        });
    }, [showToast]);

    const updateQty = useCallback((id, delta) => {
        setCart(prev => prev.reduce((acc, item) => {
            if (item.products_id !== id) { acc.push(item); return acc; }
            const newQty = item.qty + delta;
            if (newQty <= 0) return acc;
            const targetProd = products.find(p => p.products_id === id);
            if (targetProd?.track_stock && newQty > targetProd.products_stock) {
                showToast('ไม่สามารถเพิ่มเกินจำนวนสต็อกที่มี', 'warn');
                acc.push(item); return acc;
            }
            acc.push({ ...item, qty: newQty }); return acc;
        }, []));
    }, [products, showToast]);

    const removeFromCart = useCallback((id) => setCart(prev => prev.filter(i => i.products_id !== id)), []);
    const clearCart      = useCallback(() => setCart([]), []);
    const openConfirm    = () => { if (cart.length === 0 || checkingOut) return; setShowConfirm(true); };

    const handleCheckout = async (payMethod = 'cash') => {
        if (cart.length === 0 || checkingOut) return;
        const totalAmount = cart.reduce((sum, item) => sum + item.products_price * item.qty, 0);
        const itemCount   = cart.reduce((s, i) => s + i.qty, 0);
        setCheckingOut(true);
        setError(null);
        try {
            const res = await axios.post(
                `${API_BASE}/sales`,
                {
                    payment_method : payMethod,
                    total_amount   : totalAmount,
                    items          : cart.map(item => ({
                        product_id : item.products_id,
                        quantity   : item.qty,
                        unit_price : item.products_price,
                    })),
                },
                getAuthHeader()
            );
            if (res.status === 200 || res.status === 201) {
                setShowConfirm(false);
                clearCart();
                await fetchData();
                const saleId = res.data.order_id || res.data.sale_id;
                showToast(
                    `ชำระเงินสำเร็จ! บิล #${saleId}`,
                    'success',
                    `${itemCount} ชิ้น · ฿${totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} · ${payMethod === 'qr_code' ? 'PromptPay' : 'เงินสด'}`  // ✅ fixed
                );
            }
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
                return;
            }
            const errorMsg = err.response?.data?.error || 'เกิดข้อผิดพลาดในการชำระเงิน';
            setError(errorMsg);
            showToast(errorMsg, 'error');
        } finally {
            setCheckingOut(false);
        }
    };

    const filteredProducts = useMemo(() => products.filter(p => {
        const matchesSearch   = p.products_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || String(p.category_id) === String(selectedCategory);
        return matchesSearch && matchesCategory;
    }), [products, searchTerm, selectedCategory]);

    const subtotal   = useMemo(() => cart.reduce((sum, item) => sum + item.products_price * item.qty, 0), [cart]);
    const totalItems = cart.reduce((s, i) => s + i.qty, 0);

    if (loading) return (
        <div className={styles.page}>
            <div className={styles.loadingState}>
                <div className={styles.loadingDots}><span /><span /><span /></div>
                <p>กำลังโหลดระบบขาย...</p>
            </div>
        </div>
    );

    return (
        <div className={styles.page}>
            <div className={styles.blob1} />
            <div className={styles.blob2} />

            {showPromptPaySetup && (
                <PromptPaySetupModal
                    onClose={() => setShowPromptPaySetup(false)}
                    onSaved={(num) => {
                        setPromptpayNumber(num);
                        showToast('เปิดใช้งาน PromptPay สำเร็จ!', 'success', `หมายเลข ${num.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}`);
                    }}
                    currentNumber={promptpayNumber}
                />
            )}

            {showConfirm && (
                <ConfirmModal
                    cart={cart} subtotal={subtotal}
                    onConfirm={handleCheckout}
                    onCancel={() => !checkingOut && setShowConfirm(false)}
                    loading={checkingOut}
                    promptpayNumber={promptpayNumber}
                />
            )}

            {toast && (
                <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
                    <div className={styles.toastInner}>
                        <div className={styles.toastIcon}>
                            {toast.type === 'success' && <CheckCircle size={15} />}
                            {toast.type === 'warn'    && <AlertTriangle size={15} />}
                            {toast.type === 'error'   && <X size={15} />}
                            {toast.type === 'info'    && <Info size={15} />}
                        </div>
                        <div className={styles.toastBody}>
                            <span className={styles.toastTitle}>{toast.title ?? toast.msg}</span>
                            {toast.sub && <span className={styles.toastSub}>{toast.sub}</span>}
                        </div>
                        <button className={styles.toastClose} onClick={() => setToast(null)}><X size={11} /></button>
                    </div>
                    <div className={styles.toastBar} />
                </div>
            )}

            {error && (
                <div className={styles.errorBanner}>
                    <AlertTriangle size={15} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)}><X size={13} /></button>
                </div>
            )}

            <div className={styles.layout}>
                {/* Left: Product Grid */}
                <div className={styles.productSection}>
                    <div className={styles.productHeader}>
                        <div className={styles.titleBlock}>
                            <h1 className={styles.title}>ระบบขายสินค้า</h1>
                        </div>
                        <div className={styles.headerRight}>
                            <button
                                className={`${styles.promptpayBtn} ${promptpayNumber ? styles.promptpayBtnActive : ''}`}
                                onClick={() => setShowPromptPaySetup(true)}
                            >
                                <QrCode size={14} />
                                <span>{promptpayNumber ? 'PromptPay เปิดใช้งาน' : 'ตั้งค่า PromptPay'}</span>
                                {promptpayNumber && <span className={styles.promptpayDot} />}
                            </button>
                            <div className={styles.searchBox}>
                                <Search size={15} className={styles.searchIcon} />
                                <input
                                    type="text" placeholder="ค้นหาสินค้า..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button className={styles.clearSearch} onClick={() => setSearchTerm('')}>
                                        <X size={13} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles.catTabs}>
                        <button
                            className={`${styles.catTab} ${selectedCategory === 'all' ? styles.catTabActive : ''}`}
                            onClick={() => setSelectedCategory('all')}
                        >
                            <Package size={13} /><span>ทั้งหมด</span>
                            <span className={styles.catCount}>{products.length}</span>
                        </button>
                        {categories.map(cat => {
                            const count = products.filter(p => String(p.category_id) === String(cat.category_id)).length;
                            return (
                                <button
                                    key={cat.category_id}
                                    className={`${styles.catTab} ${selectedCategory === String(cat.category_id) ? styles.catTabActive : ''}`}
                                    onClick={() => setSelectedCategory(String(cat.category_id))}
                                >
                                    <Tag size={12} /><span>{cat.category_name}</span>
                                    <span className={styles.catCount}>{count}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className={styles.productGrid}>
                        {filteredProducts.length === 0 ? (
                            <div className={styles.emptyGrid}><Package size={36} /><p>ไม่พบสินค้า</p></div>
                        ) : filteredProducts.map((p, i) => {
                            const outOfStock = p.track_stock && p.products_stock <= 0;
                            const inCart = cart.find(c => c.products_id === p.products_id);
                            return (
                                <div
                                    key={p.products_id}
                                    className={`${styles.productCard} ${outOfStock ? styles.productCardOut : ''} ${inCart ? styles.productCardInCart : ''}`}
                                    style={{ animationDelay: `${i * 20}ms` }}
                                    onClick={() => addToCart(p)}
                                >
                                    {inCart && <div className={styles.cartQtyBadge}>{inCart.qty}</div>}
                                    {outOfStock && <div className={styles.outBadge}>หมด</div>}
                                    <div className={styles.productImageWrap}>
                                        <ProductImage imageUrl={p.image_url} productName={p.products_name} />
                                    </div>
                                    <div className={styles.productInfo}>
                                        <p className={styles.productName}>{p.products_name}</p>
                                        <p className={styles.productCat}>{p.category_name || 'ทั่วไป'}</p>
                                        <div className={styles.productFooter}>
                                            <span className={styles.productPrice}>฿{Number(p.products_price).toLocaleString()}</span>
                                            <span className={`${styles.stockLabel} ${outOfStock ? styles.stockLabelOut : ''}`}>
                                                {p.track_stock ? p.products_stock : '∞'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Cart */}
                <div className={styles.cartSection}>
                    <div className={styles.cartHeader}>
                        <div className={styles.cartTitleGroup}>
                            <ShoppingCart size={18} className={styles.cartIcon} />
                            <h2>ตะกร้าสินค้า</h2>
                            {cart.length > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
                        </div>
                        <button className={styles.clearBtn} onClick={clearCart} disabled={cart.length === 0}>
                            <Trash2 size={13} /><span>ล้าง</span>
                        </button>
                    </div>
                    <div className={styles.cartList}>
                        {cart.length === 0 ? (
                            <div className={styles.emptyCart}>
                                <ShoppingCart size={32} />
                                <p>ยังไม่มีสินค้าในตะกร้า</p>
                                <small>กดที่สินค้าเพื่อเพิ่ม</small>
                            </div>
                        ) : cart.map(item => (
                            <div key={item.products_id} className={styles.cartItem}>
                                <div className={styles.cartItemName}>
                                    <span>{item.products_name}</span>
                                    <small>฿{Number(item.products_price).toLocaleString()} / ชิ้น</small>
                                </div>
                                <div className={styles.cartItemRight}>
                                    <div className={styles.qtyControl}>
                                        <button onClick={() => updateQty(item.products_id, -1)}><Minus size={11} /></button>
                                        <span>{item.qty}</span>
                                        <button onClick={() => updateQty(item.products_id, 1)}><Plus size={11} /></button>
                                    </div>
                                    <span className={styles.itemSubtotal}>
                                        ฿{(item.products_price * item.qty).toLocaleString()}
                                    </span>
                                    <button className={styles.removeBtn} onClick={() => removeFromCart(item.products_id)}>
                                        <X size={13} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className={styles.cartFooter}>
                        <div className={styles.summaryRows}>
                            <div className={styles.summaryRow}>
                                <span>จำนวนรายการ</span>
                                <span>{cart.length} รายการ ({totalItems} ชิ้น)</span>
                            </div>
                            <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                                <span>ยอดรวมทั้งสิ้น</span>
                                <span className={styles.totalAmount}>
                                    ฿{subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                        <button
                            className={styles.checkoutBtn}
                            onClick={openConfirm}
                            disabled={cart.length === 0 || checkingOut}
                        >
                            <CreditCard size={17} />ชำระเงิน
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sale;