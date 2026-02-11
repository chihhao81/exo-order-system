import { useState } from 'react';
import { createCustomer } from '../api/client';

const CustomerForm = ({ apiKey }) => {
    const [formData, setFormData] = useState({
        name: '',
        nickName: '',
        phone: '',
        address: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!apiKey) {
            alert('請先在最上方輸入 API Key');
            return;
        }
        if (Object.values(formData).some(val => !val)) {
            alert('請填寫所有欄位');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                nickName: formData.nickName.startsWith('@') ? formData.nickName : `@${formData.nickName}`
            };
            await createCustomer(payload, apiKey);
            alert('客戶建立成功！');
            setFormData({ name: '', nickName: '', phone: '', address: '' });
        } catch (error) {
            alert('建立失敗，請稍後再試');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="glass-card" onSubmit={handleSubmit}>
            <h2>建立客戶資料</h2>

            <div className="form-group">
                <label>姓名</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="請輸入完整姓名"
                />
            </div>

            <div className="form-group">
                <label>群組名稱</label>
                <input
                    type="text"
                    name="nickName"
                    value={formData.nickName}
                    onChange={handleChange}
                    placeholder="請輸入群組顯示名稱"
                />
            </div>

            <div className="form-group">
                <label>電話</label>
                <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="09xxxxxxxx"
                />
            </div>

            <div className="form-group">
                <label>地址</label>
                <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="請輸入完整地址"
                />
            </div>

            <button type="submit" className="primary-btn" disabled={loading}>
                {loading ? '送出中...' : '建立客戶'}
            </button>
        </form>
    );
};

export default CustomerForm;
