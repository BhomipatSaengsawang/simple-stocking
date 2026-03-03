import React, {
    useState, useEffect,
    useCallback, useRef, useMemo,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import styles from './ProductForm.module.css';

// ================================================================
// CONSTANTS
// ================================================================
const API_BASE = 'http://localhost:8080/api';
const MAX_FILE_MB = 5;
const MAX_FILE_SIZE = MAX_FILE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const INITIAL_FORM = {
    name: '',
    des: '',
    price: '',
    cost: '',
    stock: '0',
    category_id: '',
    min_stock_lev: '10',
    available: true,
    track_stock: true, // ✅ เพิ่มสถานะเปิด/ปิด Track Stock (เริ่มต้นเป็นเปิด)
    image: null,
};

// ================================================================
// HELPERS
// ================================================================
const validateForm = (formData) => {
    if (!formData.name.trim()) return 'กรุณากรอกชื่อสินค้า';
    if (!formData.price) return 'กรุณากรอกราคาสินค้า';
    if (Number(formData.price) < 0) return 'ราคาสินค้าต้องไม่ติดลบ';
    if (Number(formData.cost) < 0) return 'ต้นทุนต้องไม่ติดลบ';

    // ✅ ตรวจสอบเงื่อนไขสต็อกเฉพาะเมื่อมีการเปิด Track Stock เท่านั้น
    if (formData.track_stock) {
        if (Number(formData.stock) < 0) return 'จำนวน Stock ต้องไม่ติดลบ';
        if (Number(formData.min_stock_lev) < 0) return 'Min Stock ต้องไม่ติดลบ';
    }
    return null;
};

const validateImageFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
        return `รองรับเฉพาะไฟล์ ${ALLOWED_TYPES.map(t => t.split('/')[1].toUpperCase()).join(', ')} เท่านั้น`;
    }
    if (file.size > MAX_FILE_SIZE) {
        return `ขนาดไฟล์ต้องไม่เกิน ${MAX_FILE_MB} MB`;
    }
    return null;
};

// ================================================================
// COMPONENT
// ================================================================
const ProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    // --- States ---
    const [categories, setCategories] = useState([]);
    const [showCatModal, setShowCatModal] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [catLoading, setCatLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditMode);
    const [error, setError] = useState(null);
    const [isDirty, setIsDirty] = useState(false);

    const blobUrlRef = useRef(null);

    // Click outside dropdown handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Cleanup object URL
    useEffect(() => {
        return () => {
            if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        };
    }, []);

    // Fetch Data
    useEffect(() => {
        const initData = async () => {
            try {
                const requests = [axios.get(`${API_BASE}/categories`)];
                if (isEditMode) requests.push(axios.get(`${API_BASE}/products/${id}`));

                const [catRes, prodRes] = await Promise.all(requests);
                setCategories(catRes.data.success ? catRes.data.data : catRes.data);

                if (isEditMode && prodRes) {
                    const p = prodRes.data.data;
                    setFormData({
                        name: p.products_name || '',
                        des: p.products_des || '',
                        price: p.products_price || '',
                        cost: p.products_cost || '',
                        stock: p.products_stock || '0',
                        category_id: p.category_id || '',
                        min_stock_lev: p.min_stock_level || '10',
                        available: p.is_available !== false,
                        track_stock: p.track_stock !== false, // ✅ โหลดสถานะ Track Stock
                        image: null,
                    });
                    if (p.image_url) setPreview(`http://localhost:8080${p.image_url}`);
                }
            } catch (err) {
                console.error('[ProductForm] Init Error:', err);
                setError('ไม่สามารถโหลดข้อมูลได้');
            } finally {
                setFetching(false);
            }
        };
        initData();
    }, [id, isEditMode]);

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCatName.trim()) return;
        setCatLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/categories`, { name: newCatName.trim() });
            if (res.data.success) {
                const newCat = res.data.data;
                setCategories(prev => [...prev, newCat]);
                setFormData(prev => ({ ...prev, category_id: newCat.category_id }));
                setNewCatName('');
                setShowCatModal(false);
            }
        } catch (err) {
            alert(err.response?.data?.error || 'ไม่สามารถเพิ่มหมวดหมู่ได้');
        } finally {
            setCatLoading(false);
        }
    };

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setIsDirty(true);
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }, []);

    const handleImageChange = useCallback((e) => {
        const file = e.target.files[0];
        if (!file) return;
        const fileError = validateImageFile(file);
        if (fileError) {
            setError(fileError);
            e.target.value = '';
            return;
        }
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        const newUrl = URL.createObjectURL(file);
        blobUrlRef.current = newUrl;
        setIsDirty(true);
        setError(null);
        setFormData((prev) => ({ ...prev, image: file }));
        setPreview(newUrl);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        const validationError = validateForm(formData);
        if (validationError) {
            setError(validationError);
            return;
        }
        setLoading(true);
        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (key === 'image' && !value) return;
                data.append(key, value);
            });
            const url = `${API_BASE}/products${isEditMode ? `/${id}` : ''}`;
            const method = isEditMode ? 'put' : 'post';
            await axios({ method, url, data });
            setIsDirty(false);
            navigate('/inventory');
        } catch (err) {
            setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึก');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className={styles.loading}>กำลังโหลดข้อมูล...</div>;

    return (
        <div className={styles.pageContainer}>
            <header className={styles.topHeader}>
                <div className={styles.headerLeft}>
                    <button type="button" onClick={() => navigate(-1)} className={styles.iconBtn}><ArrowLeft size={20} /></button>
                    <h2>{isEditMode ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h2>
                </div>
                <button type="submit" form="productForm" className={styles.saveBtn} disabled={loading || !formData.name.trim()}>
                    {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
            </header>

            <main className={styles.formContent}>
                {error && <div className={styles.errorBanner}>{error} <button onClick={() => setError(null)}>✕</button></div>}

                <form id="productForm" onSubmit={handleSubmit} noValidate>
                    <div className={styles.mainGrid}>
                        <div className={styles.infoColumn}>
                            {/* Name */}
                            <div className={styles.inputGroup}>
                                <label htmlFor="name">ชื่อสินค้า *</label>
                                <input id="name" name="name" value={formData.name} onChange={handleChange} className={styles.underlinedInput} placeholder="ชื่อสินค้า" required />
                            </div>

                            {/* Category */}
                            <div className={styles.inputGroup}>
                                <label>หมวดหมู่</label>
                                <div className={styles.customDropdown} ref={dropdownRef}>
                                    <div className={styles.dropdownHeader} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                        {categories.find(c => c.category_id === formData.category_id)?.category_name || 'No category'}
                                        <span className={styles.arrow}>{isDropdownOpen ? '▲' : '▼'}</span>
                                    </div>
                                    {isDropdownOpen && (
                                        <div className={styles.dropdownList}>
                                            <div className={styles.dropdownItem} onClick={() => { setFormData({ ...formData, category_id: '' }); setIsDropdownOpen(false); }}>No category</div>
                                            {categories.map((cat) => (
                                                <div key={cat.category_id} className={styles.dropdownItem} onClick={() => { setFormData({ ...formData, category_id: cat.category_id }); setIsDropdownOpen(false); }}>{cat.category_name}</div>
                                            ))}
                                            <div className={styles.addItemBtn} onClick={() => { setShowCatModal(true); setIsDropdownOpen(false); }}>+ Add category</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Price & Cost */}
                            <div className={styles.dualGrid}>
                                <div className={styles.inputGroup}>
                                    <label>ราคาขาย *</label>
                                    <input type="number" name="price" value={formData.price} onChange={handleChange} className={styles.underlinedInput} placeholder="0.00" />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>ต้นทุน</label>
                                    <input type="number" name="cost" value={formData.cost} onChange={handleChange} className={styles.underlinedInput} placeholder="0.00" />
                                </div>
                            </div>

                            {/* ✅ ฟีเจอร์ใหม่: เปิด/ปิดการ Track Stock */}
                            <div className={styles.checkboxGroup} style={{ marginTop: '1.5rem', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                                <input type="checkbox" id="track_stock" name="track_stock" checked={formData.track_stock} onChange={handleChange} />
                                <label htmlFor="track_stock" style={{ fontWeight: '600', color: '#1e293b' }}>ติดตามจำนวนสต็อกสินค้า (Track Inventory)</label>
                            </div>

                            {/* ✅ ส่วนของ Stock - จะแสดงเฉพาะเมื่อ track_stock เป็น true */}
                            {formData.track_stock && (
                                <div style={{ marginTop: '1rem', borderLeft: '3px solid #6366f1', paddingLeft: '15px' }}>
                                    <div className={styles.inputGroup}>
                                        <label htmlFor="stock">จำนวนสต็อกปัจจุบัน</label>
                                        <input id="stock" type="number" name="stock" value={formData.stock} onChange={handleChange} className={styles.underlinedInput} placeholder="0" />
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label>Min Stock (แจ้งเตือนสต็อกต่ำ)</label>
                                        <input type="number" name="min_stock_lev" value={formData.min_stock_lev} onChange={handleChange} className={styles.underlinedInput} />
                                    </div>

                                </div>
                            )}

                            {/* Available */}
                            <div className={styles.checkboxGroup} style={{ marginTop: '1rem' }}>
                                <input type="checkbox" id="available" name="available" checked={formData.available} onChange={handleChange} />
                                <label htmlFor="available">พร้อมขาย (Available for sale)</label>
                            </div>
                        </div>

                        {/* Image Column */}
                        <div className={styles.imageColumn}>
                            <div className={styles.imageUploadCard}>
                                <input type="file" id="imageInput" style={{ display: 'none' }} onChange={handleImageChange} accept={ALLOWED_TYPES.join(',')} />
                                <label htmlFor="imageInput" className={styles.imageLabel}>
                                    {preview ? <img src={preview} alt="Preview" className={styles.imagePreview} /> :
                                        <div className={styles.placeholder}><ImageIcon size={48} color="#ccc" /><p>คลิกเพื่อเพิ่มรูป</p></div>}
                                </label>
                            </div>
                        </div>
                    </div>
                </form>
            </main>

            {/* Modal หมวดหมู่ */}
            {showCatModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.categoryModal}>
                        <h3>สร้างหมวดหมู่ใหม่</h3>
                        <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} autoFocus className={styles.underlinedInput} />
                        <div className={styles.modalActions}>
                            <button type="button" onClick={handleAddCategory} disabled={catLoading || !newCatName.trim()}>บันทึก</button>
                            <button type="button" onClick={() => setShowCatModal(false)}>ยกเลิก</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductForm;
