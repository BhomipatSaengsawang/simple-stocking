import React, {
    useState, useEffect,
    useCallback, useMemo,
} from 'react';
import axios from 'axios';
import {
    FaPlus, FaMinus, FaTrash,
    FaSearch, FaShoppingCart, FaCreditCard,
} from 'react-icons/fa';
import styles from './Sale.module.css';
import ProductImage from '../ProductImage/ProductImage';

// =================================================================
// CONSTANTS
// =================================================================
const API_BASE = 'http://localhost:8080/api';

// =================================================================
// COMPONENT
// =================================================================
const Sale = () => {

    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [checkingOut, setCheckingOut] = useState(false);
    const [toast, setToast] = useState(null); 
    const [error, setError] = useState(null);

    const showToast = useCallback((msg, type = 'info') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [prodRes, catRes] = await Promise.all([
                axios.get(`${API_BASE}/products`),
                axios.get(`${API_BASE}/categories`)
            ]);

            const availableOnly = (prodRes.data.data ?? []).filter(
                (p) => p.is_available === true
            );
            setProducts(availableOnly);

            const catData = catRes.data.success ? catRes.data.data : catRes.data;
            setCategories(catData ?? []);

        } catch (err) {
            console.error('[Sale] fetchData Error:', err);
            setError('ไม่สามารถโหลดข้อมูลได้');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ---------------------------------------------------------------
    // Cart: Add (Updated for Track Stock)
    // ---------------------------------------------------------------
    const addToCart = useCallback((product) => {
        // ✅ ถ้า Track Stock และของหมดจริงๆ ถึงจะห้ามเพิ่ม
        if (product.track_stock && product.products_stock <= 0) {
            showToast('สินค้าหมดสต็อก!', 'warn');
            return;
        }

        setCart((prev) => {
            const exist = prev.find((i) => i.products_id === product.products_id);

            if (exist) {
                // ✅ ตรวจสอบสต็อกเฉพาะสินค้าที่มีการ Track เท่านั้น
                if (product.track_stock && exist.qty >= product.products_stock) {
                    showToast('ไม่สามารถเพิ่มเกินจำนวนสต็อกที่มี', 'warn');
                    return prev;
                }
                return prev.map((i) =>
                    i.products_id === product.products_id
                        ? { ...i, qty: i.qty + 1 }
                        : i
                );
            }

            return [...prev, {
                products_id: product.products_id,
                products_name: product.products_name,
                products_price: product.products_price,
                track_stock: product.track_stock, // เก็บสถานะ track ไว้ใน cart ด้วย
                qty: 1,
            }];
        });
    }, [showToast]);

    // ---------------------------------------------------------------
    // Cart: Update Quantity (Updated for Track Stock)
    // ---------------------------------------------------------------
    const updateQty = useCallback((id, delta) => {
        setCart((prev) =>
            prev.reduce((acc, item) => {
                if (item.products_id !== id) {
                    acc.push(item);
                    return acc;
                }

                const newQty = item.qty + delta;
                if (newQty <= 0) return acc;

                const targetProd = products.find((p) => p.products_id === id);
                
                // ✅ ตรวจสอบเงื่อนไขสต็อกเฉพาะเมื่อมีการ Track เท่านั้น
                if (targetProd?.track_stock && newQty > targetProd.products_stock) {
                    showToast('ไม่สามารถเพิ่มเกินจำนวนสต็อกที่มี', 'warn');
                    acc.push(item);
                    return acc;
                }

                acc.push({ ...item, qty: newQty });
                return acc;
            }, [])
        );
    }, [products, showToast]);

    const removeFromCart = useCallback((id) => {
        setCart((prev) => prev.filter((i) => i.products_id !== id));
    }, []);

    const clearCart = useCallback(() => setCart([]), []);

    const handleCheckout = async () => {
        if (cart.length === 0 || checkingOut) return;
        const totalAmount = cart.reduce((sum, item) => sum + (item.products_price * item.qty), 0);

        setCheckingOut(true);
        setError(null);

        const checkoutData = {
            payment_method: 'cash',
            total_amount: totalAmount,
            items: cart.map((item) => ({
                product_id: item.products_id,
                quantity: item.qty,
                unit_price: item.products_price,
            })),
        };

        try {
            const res = await axios.post(`${API_BASE}/sales`, checkoutData);
            if (res.status === 200 || res.status === 201) {
                clearCart();
                await fetchData();
                const saleId = res.data.sale_id || res.data.data?.id;
                showToast(`✅ ชำระเงินสำเร็จ! บิลเลขที่: ${saleId}`, 'success');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'เกิดข้อผิดพลาดในการชำระเงิน';
            setError(errorMsg);
            showToast(`❌ ${errorMsg}`, 'error');
        } finally {
            setCheckingOut(false);
        }
    };

    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesSearch = p.products_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || String(p.category_id) === String(selectedCategory);
            return matchesSearch && matchesCategory;
        });
    }, [products, searchTerm, selectedCategory]);

    const subtotal = useMemo(() =>
        cart.reduce((sum, item) => sum + item.products_price * item.qty, 0),
        [cart]
    );

    if (loading) return <div className={styles.loading}>กำลังโหลดระบบขาย...</div>;

    return (
        <div className={styles.saleContainer}>
            {toast && <div className={`${styles.toast} ${styles[`toast--${toast.type}`]}`}>{toast.msg}</div>}
            {error && <div className={styles.errorBanner}><span>{error}</span><button onClick={() => setError(null)}>✕</button></div>}

            <section className={styles.productSection}>
                <div className={styles.searchBar}>
                    <FaSearch className={styles.searchIcon} />
                    <input type="text" placeholder="ค้นหาสินค้าเพื่อขาย..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                <div className={styles.filterContainer}>
                    <button className={selectedCategory === 'all' ? styles.activeTab : styles.tab} onClick={() => setSelectedCategory('all')}>ทั้งหมด</button>
                    {categories.map((cat) => (
                        <button key={cat.category_id} className={selectedCategory === String(cat.category_id) ? styles.activeTab : styles.tab} onClick={() => setSelectedCategory(String(cat.category_id))}>{cat.category_name}</button>
                    ))}
                </div>

                <div className={styles.productGrid}>
                    {filteredProducts.length === 0 ? (
                        <p className={styles.emptyMsg}>ไม่พบสินค้า</p>
                    ) : (
                        filteredProducts.map((p) => (
                            <div
                                key={p.products_id}
                                className={`${styles.productCard} ${(p.track_stock && p.products_stock <= 0) ? styles.outOfStock : ''}`}
                                onClick={() => addToCart(p)}
                            >
                                <div className={styles.imageWrapper}>
                                    <ProductImage imageUrl={p.image_url} productName={p.products_name} />
                                </div>
                                <div className={styles.productInfo}>
                                    <h4>{p.products_name}</h4>
                                    <p className={styles.category}>{p.category_name || 'ทั่วไป'}</p>
                                    <div className={styles.cardFooter}>
                                        <span className={styles.price}>฿{Number(p.products_price).toLocaleString()}</span>
                                        <span className={`${styles.stockLabel} ${(p.track_stock && p.products_stock <= 0) ? styles.stockEmpty : ''}`}>
                                            {/* ✅ แสดง ∞ ถ้าไม่แทรคสต็อก */}
                                            คลัง: {p.track_stock ? p.products_stock : '∞'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            <section className={styles.cartSection}>
                <div className={styles.cartHeader}>
                    <h3><FaShoppingCart /> ตะกร้าสินค้า {cart.length > 0 && <span className={styles.cartBadge}>{cart.length}</span>}</h3>
                    <button onClick={clearCart} className={styles.clearBtn} disabled={cart.length === 0}>ล้าง</button>
                </div>

                <div className={styles.cartList}>
                    {cart.length === 0 ? (
                        <p className={styles.emptyCart}>ยังไม่มีสินค้าในตะกร้า</p>
                    ) : (
                        cart.map((item) => (
                            <div key={item.products_id} className={styles.cartItem}>
                                <div className={styles.cartItemDesc}>
                                    <span>{item.products_name}</span>
                                    <small>฿{Number(item.products_price).toLocaleString()}</small>
                                </div>
                                <div className={styles.cartItemAction}>
                                    <div className={styles.qtyBox}>
                                        <button onClick={() => updateQty(item.products_id, -1)}><FaMinus /></button>
                                        <span>{item.qty}</span>
                                        <button onClick={() => updateQty(item.products_id, 1)}><FaPlus /></button>
                                    </div>
                                    <button className={styles.removeBtn} onClick={() => removeFromCart(item.products_id)}><FaTrash /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className={styles.cartSummary}>
                    <div className={styles.summaryLine}>
                        <span>ยอดรวมทั้งสิ้น</span>
                        <span className={styles.totalAmount}>฿{subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <button className={styles.checkoutBtn} onClick={handleCheckout} disabled={cart.length === 0 || checkingOut}>
                        <FaCreditCard /> {checkingOut ? 'กำลังดำเนินการ...' : 'ชำระเงิน'}
                    </button>
                </div>
            </section>
        </div>
    );
};

export default Sale;
