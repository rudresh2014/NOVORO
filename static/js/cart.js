
const cartItemsContainer = document.getElementById('cart-items');
const cartSummary = document.getElementById('cart-summary');
const cartItemCount = document.getElementById('cart-item-count');
const cartTotal = document.getElementById('cart-total');
const checkoutButton = document.getElementById('checkout-button');

function getCSRFToken() {
    const input = document.querySelector('[name=csrfmiddlewaretoken]');
    if (input) return input.value;

    const cookie = document.cookie
        .split(';')
        .find(item => item.trim().startsWith('csrftoken='));

    return cookie ? decodeURIComponent(cookie.split('=')[1]) : '';
}

async function loadCart() {
    cartItemsContainer.innerHTML =
        '<p class="shop-message">Loading your cart...</p>';

    try {
        const response = await fetch('/api/store/cart/', {
            credentials: 'same-origin'
        });

        if (response.status === 401 || response.status === 403) {
            window.location.href = '/login/';
            return;
        }

        if (!response.ok) {
            throw new Error('Unable to load your cart.');
        }

        const cart = await response.json();
        renderCart(cart);

    } catch (error) {
        cartItemsContainer.textContent = error.message;
    }
}

function renderCart(cart) {
    cartItemsContainer.innerHTML = '';

    cartItemCount.textContent = cart.total_items;
    cartTotal.textContent = `₹${Number(cart.total_price).toFixed(2)}`;

    if (!cart.items || cart.items.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <h2>Your cart is empty</h2>
                <p>Discover something new at Novora.</p>
                <a href="/shop/" class="checkout-button">Explore Products</a>
            </div>
        `;

        cartSummary.style.display = 'none';
        return;
    }

    cartSummary.style.display = '';

    cart.items.forEach(item => {
        const itemElement = document.createElement('article');
        itemElement.className = 'cart-item';

        const details = document.createElement('div');
        details.className = 'cart-item-details';

        const name = document.createElement('h3');
        name.textContent = item.product_name;

        const price = document.createElement('p');
        price.className = 'cart-item-price';
        price.textContent =
            `₹${Number(item.product_price).toFixed(2)} each`;

        const subtotal = document.createElement('p');
        subtotal.className = 'cart-item-subtotal';
        subtotal.textContent =
            `Subtotal: ₹${Number(item.subtotal).toFixed(2)}`;

        const controls = document.createElement('div');
        controls.className = 'quantity-controls';

        const decrease = document.createElement('button');
        decrease.textContent = '−';
        decrease.setAttribute('aria-label', 'Decrease quantity');
        decrease.disabled = Number(item.quantity) <= 1;
        decrease.addEventListener('click', () => {
            updateCartItem(item.id, Number(item.quantity) - 1);
        });

        const quantity = document.createElement('span');
        quantity.textContent = item.quantity;

        const increase = document.createElement('button');
        increase.textContent = '+';
        increase.setAttribute('aria-label', 'Increase quantity');
        increase.addEventListener('click', () => {
            updateCartItem(item.id, Number(item.quantity) + 1);
        });

        controls.append(decrease, quantity, increase);

        const remove = document.createElement('button');
        remove.className = 'remove-cart-item';
        remove.textContent = 'Remove';
        remove.addEventListener('click', () => {
            removeCartItem(item.id);
        });

        details.append(name, price, subtotal, controls, remove);
        itemElement.appendChild(details);
        cartItemsContainer.appendChild(itemElement);
    });
}

async function updateCartItem(itemId, quantity) {
    await changeCartItem(itemId, 'PATCH', { quantity });
}

async function removeCartItem(itemId) {
    if (!confirm('Remove this product from your cart?')) return;
    await changeCartItem(itemId, 'DELETE');
}

async function changeCartItem(itemId, method, body = null) {
    try {
        const options = {
            method,
            credentials: 'same-origin',
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        };

        if (body) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }

        const response = await fetch(
            `/api/store/cart/items/${itemId}/`,
            options
        );

        const data = response.status === 204
            ? {}
            : await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail ||
                data.message ||
                JSON.stringify(data) ||
                'Could not update your cart.'
            );
        }

        await loadCart();

    } catch (error) {
        alert(error.message);
    }
}

checkoutButton.addEventListener('click', () => {
    window.location.href = '/checkout/';
});

loadCart();
