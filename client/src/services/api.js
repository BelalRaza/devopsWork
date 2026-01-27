const API_URL = import.meta.env.VITE_API_URL || '';

export const productApi = {
    // Get all products
    async getAll() {
        const response = await fetch(`${API_URL}/api/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        return response.json();
    },

    // Get single product
    async getById(id) {
        const response = await fetch(`${API_URL}/api/products/${id}`);
        if (!response.ok) throw new Error('Failed to fetch product');
        return response.json();
    },

    // Create product
    async create(product) {
        const response = await fetch(`${API_URL}/api/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
        if (!response.ok) throw new Error('Failed to create product');
        return response.json();
    },

    // Update product
    async update(id, product) {
        const response = await fetch(`${API_URL}/api/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
        if (!response.ok) throw new Error('Failed to update product');
        return response.json();
    },

    // Delete product
    async delete(id) {
        const response = await fetch(`${API_URL}/api/products/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete product');
        return response.json();
    }
};
