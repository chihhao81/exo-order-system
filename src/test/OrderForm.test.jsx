import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OrderForm from '../components/OrderForm';

describe('OrderForm', () => {
    const mockProps = {
        apiKey: 'test-key',
        productsList: ['產品A', '產品B'],
        loadingProducts: false,
        refreshProducts: () => { }
    };

    it('應該正確初始化當天日期', () => {
        render(<OrderForm {...mockProps} />);
        const d = new Date();
        const expectedDate = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
        const dateInput = screen.getByDisplayValue(expectedDate);
        expect(dateInput).toBeInTheDocument();
    });

    it('「匯入數據」按鈕應該顯示在第一階段', () => {
        render(<OrderForm {...mockProps} />);
        const stage1 = screen.getByText('第一階段：訂購與總結');
        const importBtn = screen.getByText('匯入數據');

        // 檢查匯入按鈕是否在第一階段標題旁邊 (由 UI 結構判斷)
        expect(stage1.parentElement).toContainElement(importBtn);
    });
});
