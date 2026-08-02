/* SimpleShop - Shared API & Auth utilities */
const API_BASE = '/api';

const Auth = {
    getToken() { return localStorage.getItem('token'); },
    getUser() {
        const data = localStorage.getItem('user');
        return data ? JSON.parse(data) : null;
    },
    isLoggedIn() { return !!this.getToken(); },
    isAdmin() { return this.getUser()?.role === 'Admin'; },
    isCustomer() { return this.getUser()?.role === 'Customer'; },
    save(token, user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    },
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    },
    headers() {
        const h = { 'Content-Type': 'application/json' };
        const token = this.getToken();
        if (token) h['Authorization'] = `Bearer ${token}`;
        return h;
    }
};

async function api(url, options = {}) {
    const res = await fetch(API_BASE + url, {
        ...options,
        headers: { ...Auth.headers(), ...options.headers }
    });
    if (res.status === 401) {
        Auth.logout();
        return null;
    }
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(data?.message || `خطا: ${res.status}`);
    return data;
}

function formatPrice(price) {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('fa-IR');
}

function showAlert(message, type = 'info') {
    const el = document.getElementById('alert-box');
    if (!el) { alert(message); return; }
    el.className = `alert alert-${type}`;
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function updateNav() {
    const user = Auth.getUser();
    const loginLink = document.getElementById('nav-login');
    const registerLink = document.getElementById('nav-register');
    const userInfo = document.getElementById('nav-user');
    const cartLink = document.getElementById('nav-cart');
    const adminLink = document.getElementById('nav-admin');
    const ordersLink = document.getElementById('nav-orders');

    if (user) {
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (userInfo) {
            userInfo.style.display = 'inline';
            userInfo.textContent = user.fullName;
        }
        if (cartLink && user.role === 'Customer') cartLink.style.display = 'inline';
        if (ordersLink && user.role === 'Customer') ordersLink.style.display = 'inline';
        if (adminLink && user.role === 'Admin') adminLink.style.display = 'inline';
    }
}

document.addEventListener('DOMContentLoaded', updateNav);
