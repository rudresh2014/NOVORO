
const API_BASE = '/api/store/';

const productGrid = document.getElementById('product-grid');
const categoryList = document.getElementById('category-list');
const searchInput = document.getElementById('product-search');
const sortSelect = document.getElementById('product-sort');
const productCount = document.getElementById('product-count');

let allProducts = [];
let selectedCategory = '';

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}categories/`);

        if (!response.ok) {
            throw new Error('Could not load categories');
        }

        const data = await response.json();
        const categories = Array.isArray(data) ? data : data.results || [];

        categoryList.innerHTML = '';

        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'category-option';
            button.textContent = category.name;
            button.dataset.category = category.id;

            button.addEventListener('click', () => {
                selectedCategory = String(category.id);
                updateActiveCategory(button);
                loadProducts();
            });

            categoryList.appendChild(button);
        });

    } catch (error) {
        categoryList.innerHTML =
            '<p class="category-loading">Unable to load categories.</p>';
        console.error(error);
    }
}

function updateActiveCategory(activeButton) {
    document.querySelectorAll('.category-option').forEach(button => {
        button.classList.remove('active');
    });

    activeButton.classList.add('active');
}

async function loadProducts() {
    productGrid.innerHTML =
        '<div class="shop-message">Loading products...</div>';

    const params = new URLSearchParams();
    const search = searchInput.value.trim();

    if (search) {
        params.set('search', search);
    }

    if (selectedCategory) {
        params.set('category', selectedCategory);
    }

    try {
        const response = await fetch(
            `${API_BASE}products/?${params.toString()}`
        );

        if (!response.ok) {
            throw new Error('Could not load products');
        }

        const data = await response.json();

        allProducts = Array.isArray(data)
            ? data
            : data.results || [];

        sortProducts();

    } catch (error) {
        productGrid.innerHTML =
            '<div class="shop-message error">Unable to load products. Please try again.</div>';

        productCount.textContent = 'Products unavailable';
        console.error(error);
    }
}

function sortProducts() {
    const sorted = [...allProducts];
    const sortValue = sortSelect.value;

    if (sortValue === 'price_asc') {
        sorted.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortValue === 'price_desc') {
        sorted.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortValue === 'name') {
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else {
        sorted.sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        );
    }

    renderProducts(sorted);
}

function renderProducts(products) {
    productGrid.innerHTML = '';

    productCount.textContent =
        `${products.length} product${products.length === 1 ? '' : 's'}`;

    if (products.length === 0) {
        productGrid.innerHTML =
            '<div class="shop-message">No products found.</div>';
        return;
    }

    products.forEach(product => {
        const card = document.createElement('article');
        card.className = 'product-card';

        const imageWrap = document.createElement('div');
        imageWrap.className = 'product-image-wrap';

        // Uploaded image takes priority over image URL
        const imageSource = product.image || product.image_url;

        if (imageSource) {
            const image = document.createElement('img');
            image.className = 'product-image';
            image.src = imageSource;
            image.alt = product.name;
            image.loading = 'lazy';

            image.onerror = () => {
                image.remove();

                const placeholder = document.createElement('div');
                placeholder.className = 'product-placeholder';
                placeholder.textContent = 'Image unavailable';
                imageWrap.appendChild(placeholder);
            };

            imageWrap.appendChild(image);

        } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'product-placeholder';
            placeholder.textContent = 'No image';
            imageWrap.appendChild(placeholder);
        }

        const info = document.createElement('div');
        info.className = 'product-info';

        const name = document.createElement('h3');
        name.className = 'product-name';
        name.textContent = product.name;

        const price = document.createElement('p');
        price.className = 'product-price';
        price.textContent = `₹${Number(product.price).toFixed(2)}`;

        const stock = document.createElement('p');
        stock.className = 'product-stock';

        const addButton = document.createElement('button');
        addButton.className = 'add-cart-button';

        if (Number(product.stock_quantity) > 0) {
            stock.textContent = 'In Stock';
            addButton.textContent = 'Add to Cart';

            addButton.addEventListener('click', () => {
                addToCart(product.id, addButton);
            });

        } else {
            stock.textContent = 'Out of Stock';
            stock.classList.add('stock-out');

            addButton.textContent = 'Out of Stock';
            addButton.disabled = true;
        }

        info.append(name, price, stock, addButton);
        card.append(imageWrap, info);
        productGrid.appendChild(card);
    });
}

async function addToCart(productId, button) {
    button.disabled = true;
    button.textContent = 'Adding...';

    try {
        const response = await fetch(`${API_BASE}cart/add/`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                product_id: productId,
                quantity: 1
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail ||
                data.message ||
                JSON.stringify(data)
            );
        }

        button.textContent = 'Added';

        setTimeout(() => {
            button.textContent = 'Add to Cart';
            button.disabled = false;
        }, 1200);

    } catch (error) {
        alert(error.message || 'Please log in before adding products.');
        button.textContent = 'Add to Cart';
        button.disabled = false;
    }
}

function getCookie(name) {
    const cookies = document.cookie.split(';');

    for (const cookie of cookies) {
        const trimmed = cookie.trim();

        if (trimmed.startsWith(name + '=')) {
            return decodeURIComponent(
                trimmed.substring(name.length + 1)
            );
        }
    }

    return '';
}

document.querySelector('.category-option[data-category=""]')
    .addEventListener('click', event => {
        selectedCategory = '';
        updateActiveCategory(event.currentTarget);
        loadProducts();
    });

searchInput.addEventListener('input', debounce(loadProducts, 350));

sortSelect.addEventListener('change', sortProducts);

function debounce(callback, delay) {
    let timeout;

    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => callback(...args), delay);
    };
}

loadCategories();
loadProducts();
