import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductList from './ProductList';

// Mock the API service
vi.mock('../services/api', () => ({
    productApi: {
        getAll: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
}));

import { productApi } from '../services/api';

const mockProducts = [
    { id: 1, name: 'Widget', description: 'A useful widget', price: 9.99, createdAt: '2026-01-01' },
    { id: 2, name: 'Gadget', description: null, price: 24.5, createdAt: '2026-01-02' },
];

describe('ProductList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- Rendering Tests ---

    it('shows loading state initially', () => {
        productApi.getAll.mockReturnValue(new Promise(() => {})); // never resolves
        render(<ProductList />);
        expect(screen.getByText(/Loading products/i)).toBeInTheDocument();
    });

    it('renders product cards after successful fetch', async () => {
        productApi.getAll.mockResolvedValue(mockProducts);
        render(<ProductList />);

        await waitFor(() => {
            expect(screen.getByText('Widget')).toBeInTheDocument();
        });

        expect(screen.getByText('Gadget')).toBeInTheDocument();
        expect(screen.getByText('$9.99')).toBeInTheDocument();
        expect(screen.getByText('$24.50')).toBeInTheDocument();
        expect(screen.getByText('A useful widget')).toBeInTheDocument();
        expect(screen.getByText('Products (2)')).toBeInTheDocument();
    });

    it('renders empty state when no products exist', async () => {
        productApi.getAll.mockResolvedValue([]);
        render(<ProductList />);

        await waitFor(() => {
            expect(screen.getByText(/No products yet/i)).toBeInTheDocument();
        });

        expect(screen.getByText('Products (0)')).toBeInTheDocument();
    });

    it('shows error message when fetch fails', async () => {
        productApi.getAll.mockRejectedValue(new Error('Network error'));
        render(<ProductList />);

        await waitFor(() => {
            expect(screen.getByText(/Failed to load products/i)).toBeInTheDocument();
        });
    });

    // --- Form Tests ---

    it('displays "Add New Product" heading by default', async () => {
        productApi.getAll.mockResolvedValue([]);
        render(<ProductList />);

        await waitFor(() => {
            expect(screen.getByText('Add New Product')).toBeInTheDocument();
        });
    });

    it('submits the form to create a new product', async () => {
        productApi.getAll.mockResolvedValue([]);
        productApi.create.mockResolvedValue({ id: 3, name: 'New Item', price: 5.0 });
        render(<ProductList />);

        await waitFor(() => {
            expect(screen.getByText('Add New Product')).toBeInTheDocument();
        });

        // Fill in the form
        fireEvent.change(screen.getByPlaceholderText('Product Name'), {
            target: { value: 'New Item' },
        });
        fireEvent.change(screen.getByPlaceholderText('Description (optional)'), {
            target: { value: 'A brand new item' },
        });
        fireEvent.change(screen.getByPlaceholderText('Price'), {
            target: { value: '5.00' },
        });

        // Submit
        fireEvent.click(screen.getByText('Add Product'));

        await waitFor(() => {
            expect(productApi.create).toHaveBeenCalledWith({
                name: 'New Item',
                description: 'A brand new item',
                price: '5.00',
            });
        });
    });

    it('shows error when create fails', async () => {
        productApi.getAll.mockResolvedValue([]);
        productApi.create.mockRejectedValue(new Error('Server error'));
        render(<ProductList />);

        await waitFor(() => {
            expect(screen.getByText('Add New Product')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByPlaceholderText('Product Name'), {
            target: { value: 'Fail Item' },
        });
        fireEvent.change(screen.getByPlaceholderText('Price'), {
            target: { value: '1.00' },
        });
        fireEvent.click(screen.getByText('Add Product'));

        await waitFor(() => {
            expect(screen.getByText(/Failed to save product/i)).toBeInTheDocument();
        });
    });

    // --- Edit Tests ---

    it('populates the form when Edit is clicked', async () => {
        productApi.getAll.mockResolvedValue(mockProducts);
        render(<ProductList />);

        await waitFor(() => {
            expect(screen.getByText('Widget')).toBeInTheDocument();
        });

        const editButtons = screen.getAllByText('Edit');
        fireEvent.click(editButtons[0]);

        expect(screen.getByText('Edit Product')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Widget')).toBeInTheDocument();
        expect(screen.getByDisplayValue('A useful widget')).toBeInTheDocument();
        expect(screen.getByDisplayValue('9.99')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('submits the form to update a product', async () => {
        productApi.getAll.mockResolvedValue(mockProducts);
        productApi.update.mockResolvedValue({ ...mockProducts[0], name: 'Updated Widget' });
        render(<ProductList />);

        await waitFor(() => {
            expect(screen.getByText('Widget')).toBeInTheDocument();
        });

        // Click edit on first product
        const editButtons = screen.getAllByText('Edit');
        fireEvent.click(editButtons[0]);

        // Change the name
        fireEvent.change(screen.getByDisplayValue('Widget'), {
            target: { value: 'Updated Widget' },
        });

        // Submit
        fireEvent.click(screen.getByText('Update'));

        await waitFor(() => {
            expect(productApi.update).toHaveBeenCalledWith(1, {
                name: 'Updated Widget',
                description: 'A useful widget',
                price: '9.99',
            });
        });
    });

    it('cancels editing and resets the form', async () => {
        productApi.getAll.mockResolvedValue(mockProducts);
        render(<ProductList />);

        await waitFor(() => {
            expect(screen.getByText('Widget')).toBeInTheDocument();
        });

        // Enter edit mode
        const editButtons = screen.getAllByText('Edit');
        fireEvent.click(editButtons[0]);
        expect(screen.getByText('Edit Product')).toBeInTheDocument();

        // Cancel
        fireEvent.click(screen.getByText('Cancel'));

        expect(screen.getByText('Add New Product')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Product Name').value).toBe('');
    });

    // --- Delete Tests ---

    it('calls delete API when confirmed', async () => {
        productApi.getAll.mockResolvedValue(mockProducts);
        productApi.delete.mockResolvedValue({ message: 'deleted' });
        window.confirm = vi.fn(() => true);

        render(<ProductList />);

        await waitFor(() => {
            expect(screen.getByText('Widget')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);

        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this product?');
        await waitFor(() => {
            expect(productApi.delete).toHaveBeenCalledWith(1);
        });
    });

    it('does not call delete API when cancelled', async () => {
        productApi.getAll.mockResolvedValue(mockProducts);
        window.confirm = vi.fn(() => false);

        render(<ProductList />);

        await waitFor(() => {
            expect(screen.getByText('Widget')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);

        expect(window.confirm).toHaveBeenCalled();
        expect(productApi.delete).not.toHaveBeenCalled();
    });

    it('shows error when delete fails', async () => {
        productApi.getAll.mockResolvedValue(mockProducts);
        productApi.delete.mockRejectedValue(new Error('Delete failed'));
        window.confirm = vi.fn(() => true);

        render(<ProductList />);

        await waitFor(() => {
            expect(screen.getByText('Widget')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(screen.getByText(/Failed to delete product/i)).toBeInTheDocument();
        });
    });
});
