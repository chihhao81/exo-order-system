import { useState, useEffect } from 'react';
import { createOrder } from '../api/client';
import { BANK_ACCOUNTS } from '../constants';

const SIZES = ['0.3cm以上', '0.5cm以上', '亞成成體', '無'];
const UNITS = ['隻', '克'];

const OrderForm = ({ apiKey, productsList, loadingProducts }) => {
    // productsList and loadingProducts are now passed from props

    const [customerId, setCustomerId] = useState('');
    const [orderDate, setOrderDate] = useState(() => {
        const d = new Date();
        return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
    });

    const [items, setItems] = useState([
        { id: Date.now(), product: '', size: SIZES[0], price: '', quantity: '', unit: UNITS[0] }
    ]);

    const [selectedBankId, setSelectedBankId] = useState(BANK_ACCOUNTS[0].id);

    const [modalOpen, setModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [generatedText, setGeneratedText] = useState('');

    const handleItemChange = (id, field, value) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const addItem = () => {
        setItems([...items, { id: Date.now(), product: '', size: SIZES[0], price: '', quantity: '', unit: UNITS[0] }]);
    };

    const removeItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (parseInt(item.price) || 0), 0);
    };

    const formatProductName = (item) => {
        let name = item.product;
        if (item.quantity && item.unit) {
            name += `${item.quantity}${item.unit}`;
        }
        return name;
    };

    const generateOrderText = () => {
        const bank = BANK_ACCOUNTS.find(b => b.id === selectedBankId);

        // Build calculation string: "100+200=?" logic
        const priceParts = items.map(item => item.price || '0');
        const calcString = `${priceParts.join('+')}+運費=?`;

        const itemLines = items.map(item => {
            const displayName = formatProductName(item);
            return `#${item.product} * ${item.quantity}${item.unit} = $${item.price}`;
        }).join('\n');

        return `
${itemLines}

711寄送60（不包寄送風險）
黑貓寄送200（全程開箱錄影，包寄送風險）

${calcString}

${bank.bankName}
銀行代碼(${bank.bankCode})
${bank.accountNumber}

匯款後請留下匯款截圖
與
相對應的寄送資料
感謝你😊
`.trim();
    };

    const handleReview = () => {
        if (!customerId) return alert('請輸入客戶編號');
        if (items.some(i => !i.product || !i.price)) return alert('請完整填寫產品資訊');

        setGeneratedText(generateOrderText());
        setModalOpen(true);
    };

    const handleConfirm = async () => {
        setSubmitting(true);
        try {
            const bank = BANK_ACCOUNTS.find(b => b.id === selectedBankId);

            const payload = {
                customer: customerId,
                orderDate: orderDate,
                items: items.map(item => ({
                    product: formatProductName(item), // Use formatted name
                    size: item.size,
                    price: item.price
                })),
                receiveAccount: `${bank.accountNumber.slice(-5)}-${bank.label}`,
                shippingFee: "0" // Removed by user request
            };

            await createOrder(payload, apiKey);

            // Copy text safely
            try {
                await navigator.clipboard.writeText(generatedText);
                alert('訂單建立成功！文字已複製到剪貼簿');
            } catch (clipboardError) {
                console.warn('Clipboard write failed:', clipboardError);
                alert('訂單建立成功！但自動複製失敗，請手動複製。');
            }

            // Reset form
            setModalOpen(false);
            setItems([{ id: Date.now(), product: '', size: SIZES[0], price: '', quantity: '', unit: UNITS[0] }]);
            setCustomerId('');
        } catch (error) {
            console.error("Order creation flow error:", error);
            alert('建立失敗，請稍後再試: ' + (error.message || '未知錯誤'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="order-form glass-card">
            <h2>建立訂單</h2>

            <div className="form-group">
                <label>客戶編號</label>
                <input
                    value={customerId}
                    onChange={e => setCustomerId(e.target.value)}
                    placeholder="C00001"
                />
            </div>

            <div className="items-list">
                <h3>產品列表</h3>

                {loadingProducts && (
                    <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>
                        <div className="loading-spinner"></div>
                        載入產品清單中...
                    </div>
                )}

                {items.map((item, index) => (
                    <div key={item.id} className="item-row glass-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group">
                            <label>產品 ({index + 1})</label>
                            <input
                                list="products-datalist"
                                value={item.product}
                                onChange={e => handleItemChange(item.id, 'product', e.target.value)}
                                placeholder="搜尋產品..."
                            />
                        </div>

                        {/* Quantity and Unit Row */}
                        <div className="row-group" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.8rem' }}>數量 (選填)</label>
                                <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={e => handleItemChange(item.id, 'quantity', e.target.value)}
                                    placeholder="10"
                                    style={{ padding: '0.5rem' }}
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.8rem' }}>單位</label>
                                <select
                                    value={item.unit}
                                    onChange={e => handleItemChange(item.id, 'unit', e.target.value)}
                                    style={{ padding: '0.5rem' }}
                                >
                                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="row-group" style={{ display: 'flex', gap: '1rem' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>尺寸</label>
                                <select
                                    value={item.size}
                                    onChange={e => handleItemChange(item.id, 'size', e.target.value)}
                                >
                                    {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div className="form-group" style={{ flex: 1 }}>
                                <label>金額</label>
                                <input
                                    type="number"
                                    value={item.price}
                                    onChange={e => handleItemChange(item.id, 'price', e.target.value)}
                                    placeholder="$"
                                />
                            </div>
                        </div>

                        {items.length > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                <button
                                    className="delete-btn"
                                    onClick={() => removeItem(item.id)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                    </svg>
                                    刪除
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                <button className="secondary-btn" onClick={addItem} style={{
                    width: '100%', padding: '0.75rem',
                    background: 'rgba(255,255,255,0.1)', border: '1px solid var(--primary-color)',
                    color: 'var(--primary-color)', borderRadius: '8px', cursor: 'pointer'
                }}>
                    + 新增產品
                </button>
            </div>

            <datalist id="products-datalist">
                {productsList.map((p, i) => <option key={i} value={p} />)}
            </datalist>

            <div className="form-group" style={{ marginTop: '2rem' }}>
                <label>匯款帳號</label>
                <select
                    value={selectedBankId}
                    onChange={e => setSelectedBankId(e.target.value)}
                >
                    {BANK_ACCOUNTS.map(acc => (
                        <option key={acc.id} value={acc.id}>
                            {acc.id}. {acc.label} - {acc.bankName}
                        </option>
                    ))}
                </select>
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>
                    帳號：{BANK_ACCOUNTS.find(b => b.id === selectedBankId)?.accountNumber}
                </div>
            </div>

            <button className="primary-btn" onClick={handleReview}>
                預覽並產生訂單
            </button>

            {modalOpen && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="glass-card" style={{ maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3>確認訂單內容</h3>
                        <pre style={{
                            background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px',
                            whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.9rem'
                        }}>
                            {generatedText}
                        </pre>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button
                                className="secondary-btn"
                                onClick={() => setModalOpen(false)}
                                style={{ flex: 1, padding: '1rem', background: 'transparent', border: '1px solid #ccc', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}
                            >
                                返回修改
                            </button>
                            <button
                                className="primary-btn"
                                onClick={handleConfirm}
                                disabled={submitting}
                                style={{ flex: 1, marginTop: 0 }}
                            >
                                {submitting ? '處理中...' : '確認並複製'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderForm;
