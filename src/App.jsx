import { useState, useEffect } from 'react'
import './index.css'
import CustomerForm from './components/CustomerForm';
import OrderForm from './components/OrderForm';
import { getProducts } from './api/client';
import packageJson from '../package.json'

function App() {
    const [activeTab, setActiveTab] = useState('order');
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('exo_api_key') || '');

    // Product List Cache
    const [productsList, setProductsList] = useState(() => {
        const cached = localStorage.getItem('exo_products_cache');
        return cached ? JSON.parse(cached) : [];
    });
    const [loadingProducts, setLoadingProducts] = useState(false);

    const loadProducts = async () => {
        setLoadingProducts(true);
        try {
            const data = await getProducts();
            if (Array.isArray(data)) {
                setProductsList(data);
                localStorage.setItem('exo_products_cache', JSON.stringify(data));
            }
        } catch (error) {
            console.error("Failed to load products:", error);
        } finally {
            setLoadingProducts(false);
        }
    };

    useEffect(() => {
        localStorage.setItem('exo_api_key', apiKey);
    }, [apiKey]);

    // Fetch products once on mount if cache is empty
    useEffect(() => {
        if (productsList.length === 0) {
            loadProducts();
        }
    }, []);

    return (
        <div className="app-container">
            <header className="app-header">
                <h1>ExoOrder System</h1>

                <div className="api-key-container glass-card" style={{ padding: '0.5rem 1rem', width: '100%', maxWidth: '400px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ whiteSpace: 'nowrap', fontSize: '0.9rem', color: '#94a3b8' }}>API Key:</span>
                    <input
                        //type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="請輸入 API 金鑰以存取系統"
                        style={{ border: 'none', background: 'transparent', padding: '0.25rem', height: 'auto' }}
                    />
                </div>

                <nav className="tabs">
                    <button
                        className={`tab-btn ${activeTab === 'order' ? 'active' : ''}`}
                        onClick={() => setActiveTab('order')}
                    >
                        建立訂單
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'customer' ? 'active' : ''}`}
                        onClick={() => setActiveTab('customer')}
                    >
                        建立客戶
                    </button>
                </nav>
            </header>
            <main className="app-content">
                {activeTab === 'order' ?
                    <OrderForm
                        apiKey={apiKey}
                        productsList={productsList}
                        loadingProducts={loadingProducts}
                        refreshProducts={loadProducts}
                    /> :
                    <CustomerForm apiKey={apiKey} />
                }
            </main>
            <div className="app-version">
                v{packageJson.version}
            </div>
        </div>
    )
}

export default App
