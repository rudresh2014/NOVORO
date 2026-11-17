
const ordersList = document.getElementById('orders-list');

async function loadOrders() {
    try {
        const response = await fetch('/api/orders/', {
            credentials: 'same-origin'
        });

        if (response.status === 401 || response.status === 403) {
            window.location.href = '/login/';
            return;
        }

        if (!response.ok) throw new Error('Unable to load orders.');

        const data = await response.json();
        const orders = Array.isArray(data) ? data : data.results || [];

        renderOrders(orders);

    } catch (error) {
        ordersList.textContent = error.message;
    }
}

function renderOrders(orders) {
    ordersList.innerHTML = '';

    if (!orders.length) {
        ordersList.innerHTML = `
            <div class="empty-cart">
                <h2>No orders yet</h2>
                <p>Your purchases will appear here.</p>
                <a href="/shop/" class="checkout-button">Explore Products</a>
            </div>`;
        return;
    }

    orders.forEach(order => {
        const card = document.createElement('article');
        card.className = 'order-card';

        const heading = document.createElement('div');
        heading.className = 'order-card-heading';

        const orderNumber = document.createElement('h2');
        orderNumber.textContent = `Order #${order.id}`;

        const status = document.createElement('span');
        status.className = `order-status status-${order.status.toLowerCase()}`;
        status.textContent = order.status;

        heading.append(orderNumber, status);

        const date = document.createElement('p');
        date.className = 'order-date';
        date.textContent = new Date(order.created_at).toLocaleString('en-IN');

        const items = document.createElement('div');
        items.className = 'order-products';

        order.items.forEach(item => {
            const line = document.createElement('p');
            line.textContent =
                `${item.product_name} × ${item.quantity} — ₹${Number(item.subtotal).toFixed(2)}`;
            items.appendChild(line);
        });

        const total = document.createElement('p');
        total.className = 'order-total';
        total.textContent = `Total: ₹${Number(order.total_amount).toFixed(2)}`;

        card.append(heading, date, items, total);

        if (order.status === 'PLACED') {
            const cancelButton = document.createElement('button');
            cancelButton.className = 'cancel-order-button';
            cancelButton.textContent = 'Cancel Order';
            cancelButton.addEventListener('click', () => cancelOrder(order.id));
            card.appendChild(cancelButton);
        }

        ordersList.appendChild(card);
    });
}

async function cancelOrder(orderId) {
    if (!confirm(`Cancel order #${orderId}?`)) return;

    try {
        const response = await fetch(`/api/orders/${orderId}/cancel/`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });

        const data = response.status === 204 ? {} : await response.json();

        if (!response.ok) {
            throw new Error(data.detail || data.message || 'Cancellation failed.');
        }

        alert('Order cancelled successfully.');
        loadOrders();

    } catch (error) {
        alert(error.message);
    }
}

function getCSRFToken() {
    const cookie = document.cookie.split(';')
        .find(item => item.trim().startsWith('csrftoken='));

    return cookie ? decodeURIComponent(cookie.split('=')[1]) : '';
}

loadOrders();
