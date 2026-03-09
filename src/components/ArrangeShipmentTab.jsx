import { useState } from 'react';
import { arrangeShipment } from '../api/client';

const ArrangeShipmentTab = ({ apiKey }) => {
    const [orderNumber, setOrderNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!orderNumber.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await arrangeShipment(orderNumber.trim(), apiKey);
            if (data && data.orderNumber) {
                setResult(data);
            } else {
                setError('找不到該訂單編號或回傳格式不正確');
            }
        } catch (err) {
            setError('查詢失敗，請檢查 API 金鑰或網路連線');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatResultText = (data) => {
        if (!data) return '';

        const itemLines = data.items.map(item => {
            const size = item.size ? item.size.replace(/以上/g, '') : '';
            const sizeDisplay = size && size !== '無' ? ` (${size})` : '';
            return `${item.product}${sizeDisplay}`;
        }).join('\n');

        const is711 = data.address.includes('7-11') && data.address.includes('門市');
        const shippingType = is711 ? '' : '\n黑貓';
        const addressLabel = is711 ? '' : '地址：';

        let text = `${itemLines}`;

        text += `\n${shippingType}\n姓名：${data.name}\n電話：${data.phone}\n${addressLabel}${data.address}`;

        if (data.items && data.items[0] && data.items[0].timeItem) {
            text += `\n時間：${data.items[0].timeItem}`;
        }
        if (data.note) {
            text += `\n\n備註：${data.note}`;
        }

        return text;
    };

    const handleCopy = () => {
        const text = formatResultText(result);
        navigator.clipboard.writeText(text);
        alert('已複製到剪貼簿');
    };

    return (
        <div className="arrange-shipment-container">
            <div className="glass-card shipment-form-card">
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value)}
                        placeholder="請輸入訂單編號"
                        className="shipment-input"
                        required
                    />
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? '查詢中...' : '送出'}
                    </button>
                </form>
            </div>

            {error && (
                <div className="error-message glass-card" style={{ marginTop: '1rem', color: '#ef4444' }}>
                    {error}
                </div>
            )}

            {result && (
                <div className="result-container glass-card" style={{ marginTop: '1rem', textAlign: 'left' }}>
                    <div className="result-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0 }}>查詢結果</h3>
                        <button onClick={handleCopy} className="copy-btn">
                            複製結果文字
                        </button>
                    </div>
                    <pre className="result-text" style={{
                        whiteSpace: 'pre-wrap',
                        background: 'rgba(0,0,0,0.2)',
                        padding: '1rem',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        lineHeight: '1.6'
                    }}>
                        {formatResultText(result)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default ArrangeShipmentTab;
