const request = require('supertest');
const app = require('../src/app');

// Mock the Prisma client
jest.mock('../src/db', () => {
    return {
        product: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };
});

const prisma = require('../src/db');

// ============================================================
// Health Check (existing, enhanced)
// ============================================================
describe('GET /api/health', () => {
    it('should return 200 and status ok', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'ok');
    });

    it('should include a timestamp', async () => {
        const res = await request(app).get('/api/health');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('message');
    });
});

// ============================================================
// Root Route
// ============================================================
describe('GET /', () => {
    it('should return the backend service text', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toContain('ShopSmart Backend Service');
    });
});

// ============================================================
// Product CRUD Integration Tests (with mocked Prisma)
// ============================================================
describe('Product API - Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --- GET /api/products ---
    describe('GET /api/products', () => {
        it('should return all products', async () => {
            const mockProducts = [
                { id: 1, name: 'Widget', description: 'Nice widget', price: 9.99, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
                { id: 2, name: 'Gadget', description: null, price: 24.5, createdAt: '2026-01-02', updatedAt: '2026-01-02' },
            ];
            prisma.product.findMany.mockResolvedValue(mockProducts);

            const res = await request(app).get('/api/products');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0]).toHaveProperty('name', 'Widget');
            expect(res.body[1]).toHaveProperty('name', 'Gadget');
            expect(prisma.product.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: 'desc' },
            });
        });

        it('should return empty array when no products exist', async () => {
            prisma.product.findMany.mockResolvedValue([]);

            const res = await request(app).get('/api/products');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual([]);
        });

        it('should return 500 when database fails', async () => {
            prisma.product.findMany.mockRejectedValue(new Error('DB connection lost'));

            const res = await request(app).get('/api/products');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error', 'Failed to fetch products');
        });
    });

    // --- GET /api/products/:id ---
    describe('GET /api/products/:id', () => {
        it('should return a single product by id', async () => {
            const mockProduct = { id: 1, name: 'Widget', description: 'Nice', price: 9.99 };
            prisma.product.findUnique.mockResolvedValue(mockProduct);

            const res = await request(app).get('/api/products/1');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('name', 'Widget');
            expect(prisma.product.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
        });

        it('should return 404 for non-existent product', async () => {
            prisma.product.findUnique.mockResolvedValue(null);

            const res = await request(app).get('/api/products/999');

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'Product not found');
        });

        it('should return 500 when database fails', async () => {
            prisma.product.findUnique.mockRejectedValue(new Error('DB error'));

            const res = await request(app).get('/api/products/1');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error', 'Failed to fetch product');
        });
    });

    // --- POST /api/products ---
    describe('POST /api/products', () => {
        it('should create a product with valid data', async () => {
            const newProduct = { id: 3, name: 'New Item', description: 'Desc', price: 15.0 };
            prisma.product.create.mockResolvedValue(newProduct);

            const res = await request(app)
                .post('/api/products')
                .send({ name: 'New Item', description: 'Desc', price: 15.0 });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('name', 'New Item');
            expect(res.body).toHaveProperty('price', 15.0);
            expect(prisma.product.create).toHaveBeenCalledWith({
                data: {
                    name: 'New Item',
                    description: 'Desc',
                    price: 15.0,
                },
            });
        });

        it('should create a product without optional description', async () => {
            const newProduct = { id: 4, name: 'No Desc', description: null, price: 5.0 };
            prisma.product.create.mockResolvedValue(newProduct);

            const res = await request(app)
                .post('/api/products')
                .send({ name: 'No Desc', price: 5.0 });

            expect(res.statusCode).toEqual(201);
            expect(prisma.product.create).toHaveBeenCalledWith({
                data: {
                    name: 'No Desc',
                    description: null,
                    price: 5.0,
                },
            });
        });

        it('should return 400 when name is missing', async () => {
            const res = await request(app)
                .post('/api/products')
                .send({ price: 10 });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'Name and price are required');
            expect(prisma.product.create).not.toHaveBeenCalled();
        });

        it('should return 400 when price is missing', async () => {
            const res = await request(app)
                .post('/api/products')
                .send({ name: 'No Price' });

            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('error', 'Name and price are required');
            expect(prisma.product.create).not.toHaveBeenCalled();
        });

        it('should return 500 when database fails on create', async () => {
            prisma.product.create.mockRejectedValue(new Error('DB write error'));

            const res = await request(app)
                .post('/api/products')
                .send({ name: 'Fail Item', price: 10 });

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error', 'Failed to create product');
        });
    });

    // --- PUT /api/products/:id ---
    describe('PUT /api/products/:id', () => {
        it('should update a product', async () => {
            const updatedProduct = { id: 1, name: 'Updated Widget', description: 'New desc', price: 19.99 };
            prisma.product.update.mockResolvedValue(updatedProduct);

            const res = await request(app)
                .put('/api/products/1')
                .send({ name: 'Updated Widget', description: 'New desc', price: 19.99 });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('name', 'Updated Widget');
        });

        it('should return 404 for non-existent product', async () => {
            const prismaError = new Error('Record not found');
            prismaError.code = 'P2025';
            prisma.product.update.mockRejectedValue(prismaError);

            const res = await request(app)
                .put('/api/products/999')
                .send({ name: 'Ghost' });

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'Product not found');
        });

        it('should return 500 when database fails on update', async () => {
            prisma.product.update.mockRejectedValue(new Error('DB error'));

            const res = await request(app)
                .put('/api/products/1')
                .send({ name: 'Fail' });

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error', 'Failed to update product');
        });
    });

    // --- DELETE /api/products/:id ---
    describe('DELETE /api/products/:id', () => {
        it('should delete a product', async () => {
            prisma.product.delete.mockResolvedValue({ id: 1 });

            const res = await request(app).delete('/api/products/1');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('message', 'Product deleted successfully');
            expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 1 } });
        });

        it('should return 404 for non-existent product', async () => {
            const prismaError = new Error('Record not found');
            prismaError.code = 'P2025';
            prisma.product.delete.mockRejectedValue(prismaError);

            const res = await request(app).delete('/api/products/999');

            expect(res.statusCode).toEqual(404);
            expect(res.body).toHaveProperty('error', 'Product not found');
        });

        it('should return 500 when database fails on delete', async () => {
            prisma.product.delete.mockRejectedValue(new Error('DB error'));

            const res = await request(app).delete('/api/products/1');

            expect(res.statusCode).toEqual(500);
            expect(res.body).toHaveProperty('error', 'Failed to delete product');
        });
    });
});
