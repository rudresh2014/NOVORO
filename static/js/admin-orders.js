
const ordersContainer = document.getElementById('admin-orders-list');
const ordersMessage = document.getElementById('orders-message');
const searchInput = document.getElementById('order-search');
const statusFilter = document.getElementById('order-status-filter');

let allOrders = [];

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

function money(value) {
    return '₹' + Number(value || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2
    });
}

function getNextStatus(status) {
    const next = {
        PLACED: 'PACKED',
        PACKED: 'SHIPPED',
        SHIPPED: 'DELIVERED'
    };
    return next[status] || null;
}

function renderOrders() {
    const search = searchInput.value.toLowerCase();
    const filter = statusFilter.value;

    const filtered = allOrders.filter(order => {
        const matchesSearch =
            String(order.id).includes(search) ||
            (order.username || '').toLowerCase().includes(search);

        const matchesStatus = !filter || order.status === filter;
        return matchesSearch && matchesStatus;
    });

    if (!filtered.length) {
        ordersContainer.innerHTML = '<div class="orders-empty">No orders found.</div>';
        return;
    }

    ordersContainer.innerHTML = filtered.map(order => {
        const nextStatus = getNextStatus(order.status);
        const items = (order.items || []).map(item => `
            <div class="admin-order-item">
                <span>${escapeHTML(item.product_name)} × ${item.quantity}</span>
                <span>${money(item.subtotal)}</span>
            </div>
        `).join('');

        return `
            <article class="admin-order-card">
                <div class="admin-order-top">
                    <div>
                        <span class="order-number">ORDER #${order.id}</span>
                        <h3>${escapeHTML(order.username)}</h3>
                        <small>${new Date(order.created_at).toLocaleString('en-IN')}</small>
                    </div>
                    <span class="order-status status-${order.status.toLowerCase()}">
                        ${escapeHTML(order.status)}
                    </span>
                </div>

                <div class="admin-order-items">
                    ${items}
                </div>

                <div class="admin-order-bottom">
                    <div>
                        <small>Order total</small>
                        <strong>${money(order.total_amount)}</strong>
                    </div>
                    <div class="admin-order-action">
                        ${nextStatus ? `
                            <button class="update-order-button"
                                data-id="${order.id}"
                                data-status="${nextStatus}">
                                Mark as ${nextStatus}
                            </button>
                        ` : '<span class="order-complete">No further action</span>'}
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

async function loadOrders() {
    ordersContainer.innerHTML = '<p>Loading orders...</p>';
    ordersMessage.textContent = '';

    try {
        const response = await fetch('/api/admin/orders/');

        if (response.status === 403 || response.status === 401) {
            throw new Error('Admin access required. Please log in again.');
        }

        if (!response.ok) {
            throw new Error('Unable to load orders.');
        }

        allOrders = await response.json();
        renderOrders();
    } catch (error) {
        ordersContainer.innerHTML = '';
        ordersMessage.textContent = error.message;
    }
}

ordersContainer.addEventListener('click', async event => {
    const button = event.target.closest('.update-order-button');
    if (!button) return;

    const orderId = button.dataset.id;
    const newStatus = button.dataset.status;

    if (!confirm(`Update order #${orderId} to ${newStatus}?`)) return;

    button.disabled = true;
    button.textContent = 'Updating...';

    try {
        const response = await fetch(`/api/admin/orders/${orderId}/status/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Could not update order.');
        }

        ordersMessage.textContent = `Order #${orderId} updated to ${newStatus}.`;
        await loadOrders();
    } catch (error) {
        ordersMessage.textContent = error.message;
        button.disabled = false;
        button.textContent = `Mark as ${newStatus}`;
    }
});

function getCookie(name) {
    const cookie = document.cookie
        .split('; ')
        .find(row => row.startsWith(name + '='));
    return cookie ? decodeURIComponent(cookie.split('=')[1]) : '';
}

searchInput.addEventListener('input', renderOrders);
statusFilter.addEventListener('change', renderOrders);
document.getElementById('refresh-orders').addEventListener('click', loadOrders);

loadOrders();
