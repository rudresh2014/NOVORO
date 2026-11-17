const customerList = document.getElementById('admin-customer-list');
const customerSearch = document.getElementById('customer-search');
const customerStatusFilter = document.getElementById('customer-status-filter');
const customerMessage = document.getElementById('customer-message');

let allCustomers = [];

function getCustomerCookie(name) {
    let cookieValue = null;

    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');

        for (let cookie of cookies) {
            cookie = cookie.trim();

            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(
                    cookie.substring(name.length + 1)
                );
                break;
            }
        }
    }

    return cookieValue;
}

function escapeCustomerHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[character]);
}

function showCustomerMessage(message, isError = false) {
    customerMessage.textContent = message;
    customerMessage.className = isError
        ? 'customer-message error'
        : 'customer-message';
}

function updateCustomerStats(customers) {
    const active = customers.filter(customer => customer.is_active).length;
    const inactive = customers.length - active;

    document.getElementById('customer-count').textContent = customers.length;
    document.getElementById('active-customer-count').textContent = active;
    document.getElementById('inactive-customer-count').textContent = inactive;
}

function renderCustomers() {
    const searchTerm = customerSearch.value.trim().toLowerCase();
    const statusFilter = customerStatusFilter.value;

    const filteredCustomers = allCustomers.filter(customer => {
        const matchesSearch =
            (customer.username || '').toLowerCase().includes(searchTerm) ||
            (customer.email || '').toLowerCase().includes(searchTerm);

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && customer.is_active) ||
            (statusFilter === 'inactive' && !customer.is_active);

        return matchesSearch && matchesStatus;
    });

    if (!filteredCustomers.length) {
        customerList.innerHTML = `
            <tr>
                <td colspan="4" class="empty-customers">
                    No customers found.
                </td>
            </tr>
        `;
        return;
    }

    customerList.innerHTML = filteredCustomers.map(customer => {
        const joinedDate = customer.date_joined
            ? new Date(customer.date_joined).toLocaleDateString('en-IN')
            : '—';

        const statusClass = customer.is_active ? 'active' : 'inactive';
        const statusText = customer.is_active ? 'Active' : 'Inactive';

        return `
            <tr>
                <td>
                    <div class="customer-name-cell">
                        <div class="customer-avatar">
                            ${escapeCustomerHTML(
                                (customer.username || 'C').charAt(0).toUpperCase()
                            )}
                        </div>
                        <strong>${escapeCustomerHTML(customer.username)}</strong>
                    </div>
                </td>

                <td>${escapeCustomerHTML(customer.email || 'No email')}</td>

                <td>${joinedDate}</td>

                <td>
                    <span class="customer-status ${statusClass}">
                        ${statusText}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

async function loadCustomers() {
    customerList.innerHTML = `
        <tr><td colspan="4">Loading customers...</td></tr>
    `;

    showCustomerMessage('');

    try {
        const response = await fetch('/api/admin/customers/', {
            credentials: 'same-origin'
        });

        if (response.status === 403) {
            throw new Error('You do not have permission to view customers.');
        }

        if (response.status === 401) {
            throw new Error('Please log in as an admin.');
        }

        if (!response.ok) {
            throw new Error('Unable to load customers.');
        }

        const data = await response.json();

        allCustomers = Array.isArray(data)
            ? data
            : (data.results || []);

        updateCustomerStats(allCustomers);
        renderCustomers();

    } catch (error) {
        customerList.innerHTML = `
            <tr>
                <td colspan="4">${escapeCustomerHTML(error.message)}</td>
            </tr>
        `;

        showCustomerMessage(error.message, true);
    }
}

customerSearch.addEventListener('input', renderCustomers);
customerStatusFilter.addEventListener('change', renderCustomers);

document.getElementById('refresh-customers')
    .addEventListener('click', loadCustomers);

loadCustomers();