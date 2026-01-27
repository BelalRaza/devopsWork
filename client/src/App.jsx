import { useState, useEffect } from 'react'
import ProductList from './components/ProductList'

function App() {
    const [healthData, setHealthData] = useState(null);

    useEffect(() => {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        fetch(`${apiUrl}/api/health`)
            .then(res => res.json())
            .then(data => setHealthData(data))
            .catch(err => console.error('Error fetching health check:', err));
    }, []);

    return (
        <div className="app">
            <header className="header">
                <h1>🛒 ShopSmart</h1>
                <div className="health-indicator">
                    {healthData ? (
                        <span className="status-ok">● Backend Online</span>
                    ) : (
                        <span className="status-loading">○ Connecting...</span>
                    )}
                </div>
            </header>

            <main className="main-content">
                <ProductList />
            </main>

            <footer className="footer">
                <p>Built with React + Express + Prisma + SQLite</p>
            </footer>
        </div>
    )
}

export default App

