
const checkoutItems = document.getElementById('checkout-items');
const checkoutTotal = document.getElementById('checkout-total');
const checkoutForm = document.getElementById('checkout-form');
const checkoutError = document.getElementById('checkout-error');
const placeOrderButton = document.getElementById('place-order-button');

function getCSRFToken() {
    const input = document.querySelector('[name=csrfmiddlewaretoken]');
    if (input) return input.value;

    const cookie = document.cookie
        .split(';')
        .find(item => item.trim().startsWith('csrftoken='));

    return cookie ? decodeURIComponent(cookie.split('=')[1]) : '';
}

function showCheckoutError(message) {
    checkoutError.textContent = message;
}

async function loadCheckoutCart() {
    try {
        const response = await fetch('/api/store/cart/', {
            credentials: 'same-origin'
        });

        if (response.status === 401 || response.status === 403) {
            window.location.href = '/login/';
            return;
        }

        if (!response.ok) {
            throw new Error('Could not load your cart.');
        }

        const cart = await response.json();

        checkoutItems.innerHTML = '';

        if (!cart.items || cart.items.length === 0) {
            checkoutItems.textContent = 'Your cart is empty.';
            checkoutTotal.textContent = '₹0.00';
            placeOrderButton.disabled = true;
            return;
        }

        cart.items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'summary-row';

            const name = document.createElement('span');
            name.textContent = `${item.product_name} × ${item.quantity}`;

            const subtotal = document.createElement('span');
            subtotal.textContent = `₹${Number(item.subtotal).toFixed(2)}`;

            row.append(name, subtotal);
            checkoutItems.appendChild(row);
        });

        checkoutTotal.textContent =
            `₹${Number(cart.total_price).toFixed(2)}`;

    } catch (error) {
        checkoutItems.textContent = 'Unable to load your cart.';
        showCheckoutError(error.message);
    }
}

checkoutForm.addEventListener('submit', async event => {
    event.preventDefault();

    const shippingAddress =
        document.getElementById('shipping-address').value.trim();

    if (!shippingAddress) {
        showCheckoutError('Please enter your delivery address.');
        return;
    }

    placeOrderButton.disabled = true;
    placeOrderButton.textContent = 'Placing Order...';
    showCheckoutError('');

    try {
        const response = await fetch('/api/orders/checkout/', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                shipping_address: shippingAddress
            })
        });

        const data = await response.json();

        if (!response.ok) {
            const message = data.detail ||
                data.message ||
                Object.values(data).flat().join(' ') ||
                'Unable to place your order.';

            throw new Error(message);
        }

        alert(`Order placed successfully! Order ID: #${data.id}`);
        window.location.href = '/shop/';

    } catch (error) {
        showCheckoutError(error.message);
        placeOrderButton.disabled = false;
        placeOrderButton.textContent = 'Place Order';
    }
});

loadCheckoutCart();
