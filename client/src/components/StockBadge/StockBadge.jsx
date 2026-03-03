import React from "react";
import styles from '../StockBadge/StockBadge.module.css';

const StockBadge = ({ stock, minStock = 10 }) => {
    const getStockStatus = () => {
        if(stock === 0) return 'out_of_stock';
        if(stock <= minStock) return 'low';
        return 'normal';
    };

    const status = getStockStatus();

    const statusConfig = {
        out_of_stock: {
            label: 'หมด',
            className: styles.badgeOutOfStock
        },
        low: {
            label: 'ต่ำ',
            className: styles.badgeLow
        },
        normal: {
            label: 'ปกติ',
            className: styles.badgeNormal
        }
    };

    const config = statusConfig[status];

    return (
        <span className={`${styles.stockBadge} ${config.className}`}>
            {config.label}
        </span>
    );
};

export default StockBadge;