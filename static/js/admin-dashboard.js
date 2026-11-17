
async function loadAdminDashboard() {
    const errorBox = document.getElementById('dashboard-error');

    try {
        const response = await fetch('/api/store/admin/dashboard/', {
            credentials: 'same-origin'
        });

        if (response.status === 401) {
            window.location.href = '/login/';
            return;
        }

        if (response.status === 403) {
            errorBox.textContent = 'Access denied. Only store administrators can view this dashboard.';
            return;
        }

        if (!response.ok) {
            throw new Error('Unable to load dashboard information.');
        }

        const data = await response.json();

        document.getElementById('total-orders').textContent =
            data.total_orders;

        document.getElementById('total-revenue').textContent =
            `₹${Number(data.total_revenue).toLocaleString('en-IN', {
                minimumFractionDigits: 2
            })}`;

        document.getElementById('low-stock').textContent =
            data.low_stock_products;

        document.getElementById('total-customers').textContent =
            data.total_customers;

        renderRecentOrders(data.recent_orders || []);

    } catch (error) {
        errorBox.textContent = error.message;
    }
}

function renderRecentOrders(orders) {
    const tbody = document.getElementById('recent-orders');
    tbody.innerHTML = '';

    if (!orders.length) {
        tbody.innerHTML =
            '<tr><td colspan="5">No orders available.</td></tr>';
        return;
    }

    orders.forEach(order => {
        const row = document.createElement('tr');

        const values = [
            `#${order.id}`,
            order.username,
            new Date(order.created_at).toLocaleDateString('en-IN'),
            `₹${Number(order.total_amount).toFixed(2)}`,
            order.status
        ];

        values.forEach((value, index) => {
            const cell = document.createElement('td');
            cell.textContent = value;

            if (index === 4) {
                cell.className = `table-status status-${String(value).toLowerCase()}`;
            }

            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });
}

loadAdminDashboard();
