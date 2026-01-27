const express = require('express');
const prisma = require('../db');

const router = express.Router();

// GET all products
router.get('/', async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET single product by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) }
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// POST create new product
router.post('/', async (req, res) => {
    try {
        const { name, description, price } = req.body;

        if (!name || price === undefined) {
            return res.status(400).json({ error: 'Name and price are required' });
        }

        const product = await prisma.product.create({
            data: {
                name,
                description: description || null,
                price: parseFloat(price)
            }
        });

        res.status(201).json(product);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// PUT update product
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price } = req.body;

        const product = await prisma.product.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(price !== undefined && { price: parseFloat(price) })
            }
        });

        res.json(product);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Product not found' });
        }
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// DELETE product
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.product.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Product not found' });
        }
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

module.exports = router;
