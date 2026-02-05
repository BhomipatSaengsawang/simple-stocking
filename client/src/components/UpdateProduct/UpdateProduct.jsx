import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import styles from "./Update.module.css";

export default function UpdateProduct() {
    const { id } = useParams();
    const navigate = useNavigate();

    // const [product, setProduct] = useState('');
    // const [price, setPrice] = useState('');

    const [formData, setFormData] = useState({
        products_name: '',
        products_price: '',
        products_stock: ''
    });

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const fetchProduct = async () => {
            try {
                setError(null);
                 const response = await axios.get(`http://localhost:8080/api/products/${id}`);
                 
                 if(!response.data) {
                    throw new Error('ไม่พบข้อมูลสินค้า');
                 }

                 if(isMounted) {
                    setFormData({
                        products_name: response.data.products_name || '',
                        products_price: response.data.products_price || '',
                        products_stock: response.data.products_stock || '',
                    });
                 }

            } catch (error) {
                if (isMounted) {
                    console.error("Failed to fethc:", error);
                    setError(error.response?.data?.message || 'ไม่สามารถโหลดข้อมูลได้');
                }
            } finally {
                if (isMounted) {
                    setFetching(false);
                }
            }
        };

        if (id) {
            fetchProduct();
        }

        return () => {
            isMounted = false;
        };
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async(e) => {
        e.preventDefault();

        if(!formData.products_name.trim()) {
            alert('กรุณากรอกชื่อสินค้า');
            return;
        }

        if(Number(formData.products_price) <= 0) {
            alert('ราคาไม่สามารถน้อยกว่า 0 ได้');
            return;
        }

        if(Number(formData.products_stock) < 0) {
            alert('จำนวนสต็อกต้องไม่น้อยกว่า 0');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.put(
                `http://localhost:8080/api/products/${id}`,
                {
                    name:formData.products_name.trim(),
                    price: Number(formData.products_price),
                    stock: Number(formData.products_stock)
                }
            );

            if (response.status === 200) {
                alert('อัปเดตสินค้าสำเร็จ');
                navigate('/inventory');
            }

        } catch (error) {
            console.error("Failed to update:", error);
            const errorMsg = error.response?.data?.message || 'ไม่สามารถอัปเดตสินค้าได้';
            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className={styles.container}>
                <div className={styles.formWrapper}>
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <p>กำลังโหลดข้อมูล...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.formWrapper}>
                    <div className={styles.errorState}>
                        <h3>⚠️ เกิดข้อผิดพลาด</h3>
                        <p>{error}</p>
                        <Link to="/inventory" className={styles.backBtn}>
                            ← กลับไปหน้ารายการ
                        </Link>
                    </div>
                </div>
            </div>
        );
    }


        return (
        <div className={styles.container}>
            <div className={styles.formWrapper}>
                <div className={styles.header}>
                    <h2>แก้ไขข้อมูลสินค้า</h2>
                    <Link to="/inventory" className={styles.backBtn}>
                        ← กลับไปหน้ารายการ
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="products_name">
                            ชื่อสินค้า <span className={styles.required}>*</span>
                        </label>
                        <input
                            id="products_name"
                            name="products_name"
                            type="text"
                            value={formData.products_name}
                            onChange={handleChange}
                            placeholder="กรอกชื่อสินค้า"
                            required
                            disabled={loading}
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="products_price">
                            ราคา (บาท) <span className={styles.required}>*</span>
                        </label>
                        <input
                            id="products_price"
                            name="products_price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.products_price}
                            onChange={handleChange}
                            placeholder="0.00"
                            required
                            disabled={loading}
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="products_stock">
                            จำนวนสต็อก <span className={styles.required}>*</span>
                        </label>
                        <input
                            id="products_stock"
                            name="products_stock"
                            type="number"
                            min="0"
                            step="1"
                            value={formData.products_stock}
                            onChange={handleChange}
                            placeholder="0"
                            required
                            disabled={loading}
                            className={styles.input}
                        />
                        <small className={styles.helpText}>
                            จำนวนสินค้าที่มีในคลัง
                        </small>
                    </div>


                    <div className={styles.buttonGroup}>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className={styles.submitBtn}
                        >
                            {loading ? (
                                <>
                                    <span className={styles.spinner}></span>
                                    กำลังอัปเดต...
                                </>
                            ) : (
                                'บันทึกการแก้ไข'
                            )}
                        </button>
                        <Link 
                            to="/inventory" 
                            className={`${styles.cancelBtn} ${loading ? styles.disabled : ''}`}
                            onClick={(e) => loading && e.preventDefault()}
                        >
                            ยกเลิก
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
