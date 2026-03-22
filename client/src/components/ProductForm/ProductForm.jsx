import React, {
    useState, useEffect,
    useCallback, useRef,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, Image as ImageIcon, Package, Tag,
    DollarSign, BarChart2, AlertTriangle, CheckCircle,
    ChevronDown, Plus, X, Save
} from 'lucide-react';
import styles from './ProductForm.module.css';

// ✅ Use env variable
const API_BASE    = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const SERVER_BASE = import.meta.env.VITE_SERVER_URL || 'http://localhost:8080';

const MAX_FILE_MB   = 5;
const MAX_FILE_SIZE = MAX_FILE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const INITIAL_FORM = {
    name: '', des: '', price: '', cost: '',
    stock: '0', category_id: '', min_stock_lev: '10',
    available: true, track_stock: true, image: null,
};

// ✅ Auth header helper
const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const validateFields = (data) => {
    const errors = {};
    if (!data.name || data.name.trim() === '') errors.name = 'กรุณากรอกชื่อสินค้า';
    else if (data.name.trim().length < 2) errors.name = 'ชื่อสินค้าต้องมีอย่างน้อย 2 ตัวอักษร';
    if (data.price === '' || data.price === null || data.price === undefined) errors.price = 'กรุณากรอกราคาสินค้า';
    else if (isNaN(Number(data.price))) errors.price = 'ราคาต้องเป็นตัวเลขเท่านั้น';
    else if (Number(data.price) < 0) errors.price = 'ราคาต้องไม่ติดลบ';
    if (data.cost !== '' && Number(data.cost) < 0) errors.cost = 'ต้นทุนต้องไม่ติดลบ';
    if (data.track_stock) {
        if (Number(data.stock) < 0) errors.stock = 'จำนวน Stock ต้องไม่ติดลบ';
        if (Number(data.min_stock_lev) < 0) errors.min_stock_lev = 'Min Stock ต้องไม่ติดลบ';
    }
    return errors;
};

const validateImageFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type))
        return `รองรับเฉพาะไฟล์ ${ALLOWED_TYPES.map(t => t.split('/')[1].toUpperCase()).join(', ')} เท่านั้น`;
    if (file.size > MAX_FILE_SIZE) return `ขนาดไฟล์ต้องไม่เกิน ${MAX_FILE_MB} MB`;
    return null;
};

const ProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    const [categories, setCategories]       = useState([]);
    const [showCatModal, setShowCatModal]   = useState(false);
    const [newCatName, setNewCatName]       = useState('');
    const [catLoading, setCatLoading]       = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const [formData, setFormData]     = useState(INITIAL_FORM);
    const [preview, setPreview]       = useState(null);
    const [loading, setLoading]       = useState(false);
    const [fetching, setFetching]     = useState(isEditMode);
    const [error, setError]           = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [dragOver, setDragOver]     = useState(false);
    const blobUrlRef = useRef(null);

    // ✅ Redirect to login if no token
    useEffect(() => {
        if (!localStorage.getItem('token')) navigate('/login');
    }, [navigate]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setIsDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => () => {
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    }, []);

    useEffect(() => {
        const initData = async () => {
            try {
                // ✅ Send auth header on all requests
                const authHeader = getAuthHeader();
                const requests = [axios.get(`${API_BASE}/categories`, authHeader)];
                if (isEditMode) requests.push(axios.get(`${API_BASE}/products/${id}`, authHeader));

                const [catRes, prodRes] = await Promise.all(requests);
                setCategories(catRes.data.success ? catRes.data.data : catRes.data);

                if (isEditMode && prodRes) {
                    const p = prodRes.data.data;
                    setFormData({
                        name          : p.products_name   || '',
                        des           : p.products_des    || '',
                        price         : p.products_price  || '',
                        cost          : p.products_cost   || '',
                        stock         : p.products_stock  || '0',
                        category_id   : p.category_id     || '',
                        min_stock_lev : p.min_stock_level || '10',
                        available     : p.is_available !== false,
                        track_stock   : p.track_stock  !== false,
                        image         : null,
                    });
                    // ✅ Use SERVER_BASE env variable instead of hardcoded URL
                    if (p.image_url) setPreview(`${SERVER_BASE}${p.image_url}`);
                }
            } catch (err) {
                console.error(err);
                // ✅ Handle expired token
                if (err.response?.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login');
                    return;
                }
                setError('ไม่สามารถโหลดข้อมูลได้');
            } finally {
                setFetching(false);
            }
        };
        initData();
    }, [id, isEditMode, navigate]);

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCatName.trim()) return;
        setCatLoading(true);
        try {
            // ✅ Auth header
            const res = await axios.post(
                `${API_BASE}/categories`,
                { name: newCatName.trim() },
                getAuthHeader()
            );
            if (res.data.success) {
                const newCat = res.data.data;
                setCategories(prev => [...prev, newCat]);
                setFormData(prev => ({ ...prev, category_id: newCat.category_id }));
                setNewCatName('');
                setShowCatModal(false);
            }
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
                return;
            }
            alert(err.response?.data?.error || 'ไม่สามารถเพิ่มหมวดหมู่ได้');
        } finally {
            setCatLoading(false);
        }
    };

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    }, []);

    const applyImageFile = useCallback((file) => {
        if (!file) return;
        const fileError = validateImageFile(file);
        if (fileError) { setError(fileError); return; }
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        const newUrl = URL.createObjectURL(file);
        blobUrlRef.current = newUrl;
        setError(null);
        setFormData(prev => ({ ...prev, image: file }));
        setPreview(newUrl);
    }, []);

    const handleImageChange = useCallback((e) => {
        applyImageFile(e.target.files[0]);
        e.target.value = '';
    }, [applyImageFile]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        applyImageFile(e.dataTransfer.files[0]);
    }, [applyImageFile]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        const errors = validateFields(formData);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            const firstErrorField = Object.keys(errors)[0];
            const el = document.getElementById(firstErrorField);
            if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
            return;
        }
        setFieldErrors({});
        setLoading(true);
        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (key === 'image' && !value) return;
                data.append(key, value);
            });
            const url = `${API_BASE}/products${isEditMode ? `/${id}` : ''}`;

            // ✅ Auth header with multipart (let axios set Content-Type automatically)
            await axios({
                method  : isEditMode ? 'put' : 'post',
                url,
                data,
                headers : { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            navigate('/inventory');
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
                return;
            }
            setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึก');
        } finally {
            setLoading(false);
        }
    };

    const selectedCategory = categories.find(c => c.category_id === formData.category_id);

    if (fetching) return (
        <div className={styles.page}>
            <div className={styles.loadingState}>
                <div className={styles.loadingDots}><span /><span /><span /></div>
                <p>กำลังโหลดข้อมูล...</p>
            </div>
        </div>
    );

    return (
        <div className={styles.page}>
            <div className={styles.blob1} />
            <div className={styles.blob2} />

            <div className={styles.inner}>
                <header className={styles.topHeader}>
                    <div className={styles.headerLeft}>
                        <button type="button" onClick={() => navigate(-1)} className={styles.backBtn}>
                            <ArrowLeft size={16} />
                        </button>
                        <div>
                            <h1 className={styles.title}>
                                {isEditMode ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
                            </h1>
                        </div>
                    </div>
                    <button type="submit" form="productForm" className={styles.saveBtn} disabled={loading}>
                        {loading
                            ? <><span className={styles.savingDot} />กำลังบันทึก...</>
                            : <><Save size={15} />บันทึก</>
                        }
                    </button>
                </header>

                {error && (
                    <div className={styles.errorBanner}>
                        <AlertTriangle size={15} />
                        <span>{error}</span>
                        <button onClick={() => setError(null)}><X size={14} /></button>
                    </div>
                )}

                {Object.keys(fieldErrors).length > 0 && (
                    <div className={styles.validationBanner}>
                        <AlertTriangle size={15} />
                        <div>
                            <strong>กรุณากรอกข้อมูลให้ครบถ้วน</strong>
                            <ul>
                                {Object.values(fieldErrors).filter(Boolean).map((msg, i) => (
                                    <li key={i}>{msg}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                <form id="productForm" onSubmit={handleSubmit} noValidate>
                    <div className={styles.mainGrid}>

                        {/* Left Column */}
                        <div className={styles.leftCol}>
                            <div className={styles.formCard}>
                                <div className={styles.cardTitle}>
                                    <Package size={15} /><span>ข้อมูลสินค้า</span>
                                </div>
                                <div className={styles.field}>
                                    <label htmlFor="name">ชื่อสินค้า <span className={styles.required}>*</span></label>
                                    <input
                                        id="name" name="name"
                                        value={formData.name} onChange={handleChange}
                                        placeholder="ชื่อสินค้า"
                                        className={`${styles.input} ${fieldErrors.name ? styles.inputError : ''}`}
                                    />
                                    {fieldErrors.name && <span className={styles.fieldErr}><AlertTriangle size={12} />{fieldErrors.name}</span>}
                                </div>
                                <div className={styles.field}>
                                    <label htmlFor="des">รายละเอียด</label>
                                    <textarea
                                        id="des" name="des"
                                        value={formData.des} onChange={handleChange}
                                        placeholder="รายละเอียดสินค้า (ไม่บังคับ)"
                                        className={styles.textarea} rows={3}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>หมวดหมู่</label>
                                    <div className={styles.dropdown} ref={dropdownRef}>
                                        <button
                                            type="button"
                                            className={styles.dropdownTrigger}
                                            onClick={() => setIsDropdownOpen(v => !v)}
                                        >
                                            <Tag size={14} className={styles.dropdownIcon} />
                                            <span>{selectedCategory?.category_name || 'ไม่มีหมวดหมู่'}</span>
                                            <ChevronDown size={14} className={`${styles.chevron} ${isDropdownOpen ? styles.chevronOpen : ''}`} />
                                        </button>
                                        {isDropdownOpen && (
                                            <div className={styles.dropdownList}>
                                                <div className={styles.dropdownItem} onClick={() => { setFormData(p => ({ ...p, category_id: '' })); setIsDropdownOpen(false); }}>
                                                    ไม่มีหมวดหมู่
                                                </div>
                                                {categories.map(cat => (
                                                    <div
                                                        key={cat.category_id}
                                                        className={`${styles.dropdownItem} ${formData.category_id === cat.category_id ? styles.dropdownItemActive : ''}`}
                                                        onClick={() => { setFormData(p => ({ ...p, category_id: cat.category_id })); setIsDropdownOpen(false); }}
                                                    >
                                                        {cat.category_name}
                                                        {formData.category_id === cat.category_id && <CheckCircle size={13} />}
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    className={styles.addCatBtn}
                                                    onClick={() => { setShowCatModal(true); setIsDropdownOpen(false); }}
                                                >
                                                    <Plus size={13} /> เพิ่มหมวดหมู่
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.formCard}>
                                <div className={styles.cardTitle}>
                                    <DollarSign size={15} /><span>ราคา</span>
                                </div>
                                <div className={styles.dualGrid}>
                                    <div className={styles.field}>
                                        <label htmlFor="price">ราคาขาย <span className={styles.required}>*</span></label>
                                        <div className={styles.inputPrefix}>
                                            <span>฿</span>
                                            <input
                                                id="price" type="number" name="price"
                                                value={formData.price} onChange={handleChange}
                                                placeholder="0.00"
                                                className={`${styles.input} ${fieldErrors.price ? styles.inputError : ''}`}
                                            />
                                        </div>
                                        {fieldErrors.price && <span className={styles.fieldErr}><AlertTriangle size={12} />{fieldErrors.price}</span>}
                                    </div>
                                    <div className={styles.field}>
                                        <label htmlFor="cost">ต้นทุน</label>
                                        <div className={styles.inputPrefix}>
                                            <span>฿</span>
                                            <input
                                                id="cost" type="number" name="cost"
                                                value={formData.cost} onChange={handleChange}
                                                placeholder="0.00"
                                                className={`${styles.input} ${fieldErrors.cost ? styles.inputError : ''}`}
                                            />
                                        </div>
                                        {fieldErrors.cost && <span className={styles.fieldErr}><AlertTriangle size={12} />{fieldErrors.cost}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.formCard}>
                                <div className={styles.cardTitle}>
                                    <BarChart2 size={15} /><span>สต็อก</span>
                                </div>
                                <div className={styles.toggleRow}>
                                    <div className={styles.toggleInfo}>
                                        <span>ติดตามจำนวนสต็อก</span>
                                        <small>เปิดเพื่อตรวจจับสินค้าใกล้หมด</small>
                                    </div>
                                    <label className={styles.toggle}>
                                        <input type="checkbox" name="track_stock" checked={formData.track_stock} onChange={handleChange} />
                                        <span className={styles.toggleSlider} />
                                    </label>
                                </div>
                                {formData.track_stock && (
                                    <div className={styles.stockFields}>
                                        <div className={styles.dualGrid}>
                                            <div className={styles.field}>
                                                <label htmlFor="stock">จำนวนสต็อกปัจจุบัน</label>
                                                <input
                                                    id="stock" type="number" name="stock"
                                                    value={formData.stock} onChange={handleChange}
                                                    placeholder="0"
                                                    className={`${styles.input} ${fieldErrors.stock ? styles.inputError : ''}`}
                                                />
                                                {fieldErrors.stock && <span className={styles.fieldErr}><AlertTriangle size={12} />{fieldErrors.stock}</span>}
                                            </div>
                                            <div className={styles.field}>
                                                <label htmlFor="min_stock_lev">แจ้งเตือนสต็อกต่ำ</label>
                                                <input
                                                    id="min_stock_lev" type="number" name="min_stock_lev"
                                                    value={formData.min_stock_lev} onChange={handleChange}
                                                    placeholder="10"
                                                    className={`${styles.input} ${fieldErrors.min_stock_lev ? styles.inputError : ''}`}
                                                />
                                                {fieldErrors.min_stock_lev && <span className={styles.fieldErr}><AlertTriangle size={12} />{fieldErrors.min_stock_lev}</span>}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className={styles.toggleRow} style={{ marginTop: '16px' }}>
                                    <div className={styles.toggleInfo}>
                                        <span>พร้อมขาย</span>
                                        <small>สินค้านี้จะแสดงและสามารถขายได้</small>
                                    </div>
                                    <label className={styles.toggle}>
                                        <input type="checkbox" name="available" checked={formData.available} onChange={handleChange} />
                                        <span className={`${styles.toggleSlider} ${styles.toggleGreen}`} />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Image */}
                        <div className={styles.rightCol}>
                            <div className={styles.formCard}>
                                <div className={styles.cardTitle}>
                                    <ImageIcon size={15} /><span>รูปสินค้า</span>
                                </div>
                                <input
                                    type="file" id="imageInput"
                                    style={{ display: 'none' }}
                                    onChange={handleImageChange}
                                    accept={ALLOWED_TYPES.join(',')}
                                />
                                <label
                                    htmlFor="imageInput"
                                    className={`${styles.imageZone} ${dragOver ? styles.imageZoneDrag : ''} ${preview ? styles.imageZoneHasImage : ''}`}
                                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                >
                                    {preview ? (
                                        <>
                                            <img src={preview} alt="Preview" className={styles.imagePreview} />
                                            <div className={styles.imageOverlay}>
                                                <ImageIcon size={20} /><span>เปลี่ยนรูป</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className={styles.imagePlaceholder}>
                                            <div className={styles.uploadIcon}><ImageIcon size={32} /></div>
                                            <p>คลิกหรือลากไฟล์มาวางที่นี่</p>
                                            <small>JPG, PNG, WEBP · ไม่เกิน {MAX_FILE_MB} MB</small>
                                        </div>
                                    )}
                                </label>
                                {preview && (
                                    <button
                                        type="button"
                                        className={styles.removeImageBtn}
                                        onClick={() => { setPreview(null); setFormData(p => ({ ...p, image: null })); }}
                                    >
                                        <X size={13} /> ลบรูปภาพ
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Category Modal */}
            {showCatModal && (
                <div className={styles.modalOverlay} onClick={() => setShowCatModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>เพิ่มหมวดหมู่ใหม่</h3>
                            <button className={styles.modalClose} onClick={() => setShowCatModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.field}>
                                <label>ชื่อหมวดหมู่</label>
                                <input
                                    type="text" value={newCatName}
                                    onChange={e => setNewCatName(e.target.value)}
                                    autoFocus
                                    placeholder="เช่น เครื่องดื่ม, ขนมหวาน"
                                    className={styles.input}
                                    onKeyDown={e => e.key === 'Enter' && handleAddCategory(e)}
                                />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button type="button" className={styles.modalCancelBtn} onClick={() => setShowCatModal(false)}>
                                ยกเลิก
                            </button>
                            <button
                                type="button" className={styles.modalSaveBtn}
                                onClick={handleAddCategory}
                                disabled={catLoading || !newCatName.trim()}
                            >
                                {catLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductForm;