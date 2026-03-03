import React, { useState, useEffect } from "react";
import { FaBoxOpen } from 'react-icons/fa'; // นำเข้า Icon กล่อง
import styles from './ProductImage.module.css';

const ProductImage = ({ imageUrl, productName, size = 'medium' }) => {
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        setImageError(false);
    }, [imageUrl]);

    const baseUrl = 'http://localhost:8080'; 
    
    // ตรวจสอบความถูกต้องของ URL
    const hasImage = imageUrl && imageUrl !== "null" && imageUrl !== "" && imageUrl !== undefined;
    
    // ตัดสินใจว่าจะแสดง Image หรือ Icon
    const shouldShowPlaceholder = imageError || !hasImage;
    const imageSrc = `${baseUrl}${imageUrl}`;

    const sizeClass = styles[size] || styles.imageMedium;

    return (
        <div className={`${styles.imageContainer} ${sizeClass}`}>
            {shouldShowPlaceholder ? (
                /* ส่วนแสดงผลสัญลักษณ์ Icon แทนรูปภาพ */
                <div className={styles.iconPlaceholder}>
                    <FaBoxOpen className={styles.defaultIcon} />
                </div>
            ) : (
                /* ส่วนแสดงผลรูปภาพสินค้าจริง */
                <img
                    src={imageSrc}
                    alt={productName || 'Product Image'}
                    onError={() => setImageError(true)}
                    className={styles.productImage}
                    loading="lazy"
                />
            )}
        </div>
    );
};

export default ProductImage;
