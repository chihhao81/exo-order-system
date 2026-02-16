import { useState, useEffect } from 'react';
import { createOrder } from '../api/client';
import { BANK_ACCOUNTS } from '../constants';

const SIZES = ['0.3cm以上', '0.5cm以上', '亞成成體', '無'];
const UNITS = ['隻', '克', '個'];

const OrderForm = ({ apiKey, productsList, loadingProducts, refreshProducts }) => {
    // productsList and loadingProducts are now passed from props

    // Helper to prevent number input scrolling or arrow key changes
    const disableNumberInputProps = {
        onWheel: (e) => e.target.blur(),
        onKeyDown: (e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
            }
        }
    };

    const [customerId, setCustomerId] = useState('');
    const [orderDate, setOrderDate] = useState(() => {
        const d = new Date();
        return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
    });

    const [items, setItems] = useState([
        { id: Date.now(), product: '', size: SIZES[0], price: '', quantity: '', unit: UNITS[0] }
    ]);

    const [selectedBankId, setSelectedBankId] = useState(BANK_ACCOUNTS[0].id);
    const [shippingFee, setShippingFee] = useState(0);
    const [remittanceAccount, setRemittanceAccount] = useState('');
    const [orderNumber, setOrderNumber] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [generatedText, setGeneratedText] = useState('');
    const [backupJson, setBackupJson] = useState(''); // New: store backup JSON
    const [timeItem, setTimeItem] = useState('');
    const [importText, setImportText] = useState('');
    const [showImport, setShowImport] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    const handleImport = () => {
        try {
            const data = JSON.parse(importText);
            if (data.customerId) setCustomerId(data.customerId);
            if (data.timeItem) setTimeItem(data.timeItem);
            if (data.shippingFee !== undefined) setShippingFee(data.shippingFee);
            if (data.items) setItems(data.items.map(i => ({ ...i, id: Date.now() + Math.random() })));
            alert('數據匯入成功！');
            setShowImport(false);
            setImportText('');
        } catch (e) {
            alert('匯入格式錯誤，請確定是正確的 JSON 格式');
        }
    };

    const generateBackupJson = () => {
        const data = {
            customerId,
            timeItem,
            shippingFee,
            items: items.map(i => ({
                product: i.product,
                size: i.size,
                price: i.price,
                quantity: i.quantity,
                unit: i.unit
            }))
        };
        return JSON.stringify(data);
    };

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
        const itemsTotal = items.reduce((sum, item) => sum + (parseInt(item.price) || 0), 0);
        return itemsTotal + (parseInt(shippingFee) || 0);
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
        const calcString = `${priceParts.join('+')}+${shippingFee}=${calculateTotal()}`;

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
        if (items.some(i => !i.product)) return alert('請填寫產品名稱');

        setGeneratedText(generateOrderText());
        setBackupJson(generateBackupJson());
        setShowPreviewModal(true);
    };

    const handleConfirm = async () => {
        if (!apiKey) return alert('請輸入 API Key');
        if (!customerId) return alert('請輸入客戶編號');
        if (items.some(i => !i.product || !i.price)) return alert('請完整填寫產品資訊');

        setSubmitting(true);
        try {
            const bank = BANK_ACCOUNTS.find(b => b.id === selectedBankId);

            const payload = {
                customer: customerId,
                orderDate: orderDate,
                items: items.map(item => ({
                    name: item.product,
                    quantity: item.quantity,
                    unit: item.unit,
                    size: item.size,
                    price: item.price
                })),
                receiveAccount: `${bank.accountNumber.slice(-5)}-${bank.label}`,
                shippingFee: shippingFee,
                userRemittanceAccount: remittanceAccount,
                orderNumber: orderNumber,
                timeItem: timeItem
            };

            await createOrder(payload, apiKey);
            alert('訂單已正式建立至系統！');

            // Reset form
            setShowPreviewModal(false);
            setItems([{ id: Date.now(), product: '', size: SIZES[0], price: '', quantity: '', unit: UNITS[0] }]);
            setCustomerId('');
            setShippingFee(0);
            setRemittanceAccount('');
            setTimeItem('');
        } catch (error) {
            console.error("Order creation flow error:", error);
            alert('建立失敗，請稍後再試: ' + (error.message || '未知錯誤'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="order-form glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>建立訂單</h2>
                <button
                    className="refresh-btn"
                    onClick={() => setShowImport(!showImport)}
                    style={{
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.8rem',
                        borderColor: showImport ? 'var(--accent-color)' : 'var(--glass-border)',
                        color: showImport ? 'var(--accent-color)' : '#94a3b8'
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    {showImport ? '取消匯入' : '匯入數據'}
                </button>
            </div>

            {showImport && (
                <div className="item-row glass-card" style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', borderStyle: 'dashed' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: '600' }}>
                            請貼上備份數據 (JSON)
                        </label>
                        <textarea
                            value={importText}
                            onChange={e => setImportText(e.target.value)}
                            placeholder='{"customerId": "C001", ...}'
                            style={{
                                width: '100%',
                                height: '100px',
                                background: 'rgba(0,0,0,0.3)',
                                fontSize: '0.85rem',
                                fontFamily: 'monospace',
                                resize: 'none'
                            }}
                        />
                        <button
                            className="primary-btn"
                            onClick={handleImport}
                            style={{
                                marginTop: 0,
                                padding: '0.6rem',
                                fontSize: '0.9rem',
                                background: 'linear-gradient(135deg, var(--accent-color), #be185d)'
                            }}
                        >
                            確認並載入數據
                        </button>
                    </div>
                </div>
            )}

            <div className="section-title" style={{ color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                第一階段：訂購與總結
            </div>

            <div className="form-group">
                <label>客戶編號</label>
                <input
                    value={customerId}
                    onChange={e => setCustomerId(e.target.value)}
                    placeholder="C00001"
                />
            </div>

            <div className="form-group">
                <label>時間/項目 (選填)</label>
                <input
                    value={timeItem}
                    onChange={e => setTimeItem(e.target.value)}
                    placeholder="例如：14:00 / 項目A"
                />
            </div>

            <div className="items-list">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>產品列表</h3>
                    <button
                        className="refresh-btn"
                        onClick={refreshProducts}
                        disabled={loadingProducts}
                    >
                        <svg
                            className={loadingProducts ? 'spinning' : ''}
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M23 4v6h-6"></path>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                        </svg>
                        刷新清單
                    </button>
                </div>

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
                                    {...disableNumberInputProps}
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
                                    {...disableNumberInputProps}
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

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label>運費</label>
                <input
                    type="number"
                    value={shippingFee}
                    onChange={e => setShippingFee(e.target.value)}
                    {...disableNumberInputProps}
                    placeholder="0"
                />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button className="primary-btn" onClick={handleReview} style={{ flex: 1, background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>
                    產生總結與預覽
                </button>
            </div>

            <div className="section-title" style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', margin: '2rem 0 1rem 0' }}>
                第二階段：匯款與正式入帳
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
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

            <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>使用者匯款帳號 (末五碼/選填)</label>
                <input
                    type="text"
                    value={remittanceAccount}
                    onChange={e => setRemittanceAccount(e.target.value)}
                    placeholder="例如：12345"
                />
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>匯款日期 (選填)</label>
                <input
                    type="text"
                    value={orderDate}
                    onChange={e => setOrderDate(e.target.value)}
                    placeholder="例如：2/14"
                />
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>訂單號碼 (選填)</label>
                <input
                    type="text"
                    value={orderNumber}
                    onChange={e => setOrderNumber(e.target.value)}
                    placeholder="請輸入訂單號碼"
                />
            </div>

            <button
                className="primary-btn"
                onClick={handleConfirm}
                disabled={submitting}
                style={{ marginTop: '2rem', width: '100%', background: submitting ? '#444' : '#10b981' }}
            >
                {submitting ? '建立中...' : '正式建立訂單'}
            </button>

            {showPreviewModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="glass-card" style={{ maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>預覽與數據備份</h3>
                            <button onClick={() => setShowPreviewModal(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
                        </div>

                        <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>總結文字 (傳給客戶)：</label>
                        <pre style={{
                            background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px',
                            whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.85rem', marginTop: '0.5rem'
                        }}>
                            {generatedText}
                        </pre>
                        <button
                            className="secondary-btn"
                            style={{ width: '100%', marginBottom: '1.5rem' }}
                            onClick={async () => {
                                await navigator.clipboard.writeText(generatedText);
                                alert('總結文字已複製');
                            }}
                        >
                            複製總結文字
                        </button>

                        <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>數據備份 (供日後匯入)：</label>
                        <textarea
                            readOnly
                            value={backupJson}
                            style={{ width: '100%', height: '60px', background: 'rgba(0,0,0,0.2)', border: '1px solid #444', color: '#888', borderRadius: '4px', padding: '0.5rem', fontSize: '0.7rem', marginTop: '0.5rem' }}
                        />
                        <button
                            className="secondary-btn"
                            style={{ width: '100%', marginTop: '0.5rem' }}
                            onClick={async () => {
                                await navigator.clipboard.writeText(backupJson);
                                alert('備份數據已複製，請妥善保存於筆記或交談紀錄中');
                            }}
                        >
                            複製備份數據 (JSON)
                        </button>

                        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <button
                                className="secondary-btn"
                                onClick={() => setShowPreviewModal(false)}
                                style={{ width: '100%' }}
                            >
                                關閉預覽
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderForm;
