import React, { useState, useEffect } from "react";
import { FaBoxOpen } from 'react-icons/fa';
import styles from './ProductImage.module.css';

// ✅ Use env variable instead of hardcoded URL
const SERVER_BASE = import.meta.env.VITE_SERVER_URL || 'http://localhost:8080';

const ProductImage = ({ imageUrl, productName, size = 'medium' }) => {
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        setImageError(false);
    }, [imageUrl]);

    const hasImage = imageUrl && imageUrl !== "null" && imageUrl !== "" && imageUrl !== undefined;
    const shouldShowPlaceholder = imageError || !hasImage;

    // ✅ Use SERVER_BASE env variable
    const imageSrc = `${SERVER_BASE}${imageUrl}`;

    const sizeClass = styles[size] || styles.imageMedium;

    return (
        <div className={`${styles.imageContainer} ${sizeClass}`}>
            {shouldShowPlaceholder ? (
                <div className={styles.iconPlaceholder}>
                    <FaBoxOpen className={styles.defaultIcon} />
                </div>
            ) : (
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