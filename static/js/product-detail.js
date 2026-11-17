
const detailContainer = document.getElementById('product-detail');
const productId = detailContainer.dataset.productId;

async function loadProductDetails() {
    try {
        const response = await fetch(`/api/store/products/${productId}/`);

        if (!response.ok) {
            throw new Error('Product not found.');
        }

        const product = await response.json();
        renderProduct(product);

    } catch (error) {
        detailContainer.innerHTML = `
            <div class="shop-message error">
                ${error.message}
            </div>
        `;
    }
}

function renderProduct(product) {
    detailContainer.innerHTML = '';

    const layout = document.createElement('div');
    layout.className = 'product-detail-layout';

    const imageSection = document.createElement('div');
    imageSection.className = 'product-detail-image';

    // Uploaded image takes priority over image URL
    const imageSource = product.image || product.image_url;

    if (imageSource) {
        const image = document.createElement('img');
        image.src = imageSource;
        image.alt = product.name;
        image.loading = 'lazy';

        image.onerror = () => {
            image.remove();
            imageSection.innerHTML =
                '<div class="product-placeholder">Image unavailable</div>';
        };

        imageSection.appendChild(image);

    } else {
        imageSection.innerHTML =
            '<div class="product-placeholder">No image available</div>';
    }

    const info = document.createElement('div');
    info.className = 'product-detail-info';

    const category = document.createElement('p');
    category.className = 'detail-category';
    category.textContent = product.category_name || 'NOVORA COLLECTION';

    const name = document.createElement('h1');
    name.className = 'detail-name';
    name.textContent = product.name;

    const price = document.createElement('p');
    price.className = 'detail-price';
    price.textContent = `₹${Number(product.price).toFixed(2)}`;

    const descriptionHeading = document.createElement('h3');
    descriptionHeading.textContent = 'Product Description';

    const description = document.createElement('p');
    description.className = 'detail-description';
    description.textContent = product.description;

    const stock = document.createElement('p');
    stock.className = 'product-stock';

    const addButton = document.createElement('button');
    addButton.className = 'detail-add-button';

    if (Number(product.stock_quantity) > 0) {
        stock.textContent = `${product.stock_quantity} available in stock`;
        addButton.textContent = 'Add to Cart';

        addButton.addEventListener('click', () => {
            addProductToCart(product.id, addButton);
        });

    } else {
        stock.textContent = 'Out of Stock';
        stock.classList.add('stock-out');
        addButton.textContent = 'Out of Stock';
        addButton.disabled = true;
    }

    const backLink = document.createElement('a');
    backLink.href = '/shop/';
    backLink.className = 'detail-back-link';
    backLink.textContent = '← Back to Shop';

    info.append(
        category,
        name,
        price,
        descriptionHeading,
        description,
        stock,
        addButton,
        backLink
    );

    layout.append(imageSection, info);
    detailContainer.appendChild(layout);
}

async function addProductToCart(id, button) {
    button.disabled = true;
    button.textContent = 'Adding...';

    try {
        const response = await fetch('/api/store/cart/add/', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                product_id: id,
                quantity: 1
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail ||
                data.message ||
                'Unable to add product.'
            );
        }

        button.textContent = 'Added to Cart';

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

loadProductDetails();
