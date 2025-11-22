const API_BASE_URL = 'http://localhost:4000/api';

class ApiClient {
    private getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('token');
    }

    private async request(endpoint: string, options: RequestInit = {}) {
        const token = this.getToken();
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers,
            });

            if (response.status === 401) {
                // Unauthorized - clear token and redirect to login
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
                throw new Error('Unauthorized');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Request failed');
            }

            return data;
        } catch (error: any) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // Auth
    async signup(name: string, email: string, password: string, role: string) {
        return this.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, role }),
        });
    }

    async login(email: string, password: string) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async getMe() {
        return this.request('/auth/me');
    }

    // Products
    async getProducts() {
        return this.request('/products');
    }

    async createProduct(data: any) {
        return this.request('/products', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateProduct(id: string, data: any) {
        return this.request(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteProduct(id: string) {
        return this.request(`/products/${id}`, {
            method: 'DELETE',
        });
    }

    // Locations
    async getLocations() {
        return this.request('/locations');
    }

    async createLocation(data: any) {
        return this.request('/locations', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Vendors
    async getVendors() {
        return this.request('/vendors');
    }

    async createVendor(data: any) {
        return this.request('/vendors', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Receipts
    async getReceipts() {
        return this.request('/receipts');
    }

    async createReceipt(data: any) {
        return this.request('/receipts', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async validateReceipt(id: string) {
        return this.request(`/receipts/${id}/validate`, {
            method: 'POST',
            body: JSON.stringify({ action: 'validate' }),
        });
    }

    // Deliveries
    async getDeliveries() {
        return this.request('/deliveries');
    }

    async createDelivery(data: any) {
        return this.request('/deliveries', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Dashboard
    async getDashboard() {
        return this.request('/dashboard');
    }

    // Move History
    async getMoveHistory() {
        return this.request('/move-history');
    }

    // Users (Admin only)
    async getUsers() {
        return this.request('/users');
    }
}

export const api = new ApiClient();
