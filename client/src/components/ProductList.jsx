import { useState, useEffect } from 'react';
import { productApi } from '../services/api';

function ProductList() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', price: '' });

    // Fetch products on mount
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await productApi.getAll();
            setProducts(data);
            setError(null);
        } catch (err) {
            setError('Failed to load products');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await productApi.update(editingId, formData);
            } else {
                await productApi.create(formData);
            }
            setFormData({ name: '', description: '', price: '' });
            setEditingId(null);
            fetchProducts();
        } catch (err) {
            setError('Failed to save product');
            console.error(err);
        }
    };

    const handleEdit = (product) => {
        setEditingId(product.id);
        setFormData({
            name: product.name,
            description: product.description || '',
            price: product.price.toString()
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await productApi.delete(id);
            fetchProducts();
        } catch (err) {
            setError('Failed to delete product');
            console.error(err);
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({ name: '', description: '', price: '' });
    };

    if (loading) return <div className="loading">Loading products...</div>;

    return (
        <div className="product-manager">
            <h2>Product Management</h2>

            {error && <div className="error-message">{error}</div>}

            {/* Product Form */}
            <form onSubmit={handleSubmit} className="product-form">
                <h3>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
                <div className="form-group">
                    <input
                        type="text"
                        placeholder="Product Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group">
                    <textarea
                        placeholder="Description (optional)"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>
                <div className="form-group">
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Price"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                    />
                </div>
                <div className="form-actions">
                    <button type="submit" className="btn-primary">
                        {editingId ? 'Update' : 'Add Product'}
                    </button>
                    {editingId && (
                        <button type="button" onClick={handleCancel} className="btn-secondary">
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            {/* Products List */}
            <div className="products-list">
                <h3>Products ({products.length})</h3>
                {products.length === 0 ? (
                    <p className="no-products">No products yet. Add one above!</p>
                ) : (
                    <div className="products-grid">
                        {products.map((product) => (
                            <div key={product.id} className="product-card">
                                <div className="product-info">
                                    <h4>{product.name}</h4>
                                    {product.description && <p>{product.description}</p>}
                                    <span className="price">${product.price.toFixed(2)}</span>
                                </div>
                                <div className="product-actions">
                                    <button onClick={() => handleEdit(product)} className="btn-edit">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(product.id)} className="btn-delete">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProductList;
