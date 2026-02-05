import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import styles from "./Update.module.css";

export default function PatchProduct() {
    const { id } = useParams();
    const navigate = useNavigate();

    // 🔥 เพิ่ม state เก็บข้อมูลเดิม
    const [originalData, setOriginalData] = useState({
        name: '',
        price: ''
    });

    const [product, setProduct] = useState('');
    const [price, setPrice] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axios.get(
                    `http://localhost:8080/api/products/${id}`
                );
                
                // 🔥 เก็บข้อมูลเดิมไว้เปรียบเทียบ
                const name = response.data.products_name || '';
                const priceValue = response.data.products_price || '';
                
                setOriginalData({
                    name: name,
                    price: priceValue
                });
                
                setProduct(name);
                setPrice(priceValue);

            } catch (error) {
                console.error("Failed to fetch:", error);
                alert("Failed to load product data");
            } finally {
                setFetching(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id]);

    const handleSubmit = async(e) => {
        e.preventDefault();
        setLoading(true);

        // 🔥 สร้าง object เฉพาะฟิลด์ที่เปลี่ยน
        const updates = {};
        
        if (product !== originalData.name) {
            updates.name = product;
        }
        
        if (Number(price) !== Number(originalData.price)) {
            updates.price = Number(price);
        }

        // 🔥 ตรวจสอบว่ามีการเปลี่ยนแปลงหรือไม่
        if (Object.keys(updates).length === 0) {
            alert("No changes detected");
            setLoading(false);
            return;
        }

        console.log('Sending updates:', updates);

        try {
            // 🔥 เปลี่ยนจาก PUT เป็น PATCH
            const response = await axios.patch(
                `http://localhost:8080/api/products/${id}`,
                updates  // ส่งเฉพาะที่เปลี่ยน
            );

            alert("Product updated successfully");
            navigate('/inventory');

        } catch (error) {
            console.error("Failed:", error);
            alert("Failed to update product");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.formWrapper}>
                <div className={styles.header}>
                    <h2>Update Product</h2>
                    <Link to="/inventory" className={styles.backBtn}>
                        ← Back to List
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="product">Product Name</label>
                        <input
                            id="product"
                            type="text"
                            value={product}
                            onChange={(e) => setProduct(e.target.value)}
                            placeholder="Enter product name"
                            required
                            disabled={loading}
                            className={styles.input}
                        />
                        {/* 🔥 แสดง indicator ว่าฟิลด์นี้เปลี่ยน */}
                        {product !== originalData.name && (
                            <small className={styles.changed}>✏️ Modified</small>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="price">Price</label>
                        <input
                            id="price"
                            type="number"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0.00"
                            required
                            disabled={loading}
                            className={styles.input}
                        />
                        {/* 🔥 แสดง indicator ว่าฟิลด์นี้เปลี่ยน */}
                        {Number(price) !== Number(originalData.price) && (
                            <small className={styles.changed}>✏️ Modified</small>
                        )}
                    </div>

                    <div className={styles.buttonGroup}>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className={styles.submitBtn}
                        >
                            {loading ? 'Updating...' : 'Update Product'}
                        </button>
                        <Link 
                            to="/inventory" 
                            className={styles.cancelBtn}
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}