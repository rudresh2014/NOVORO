
const productForm = document.getElementById('product-form');
const productList = document.getElementById('admin-product-list');
const messageBox = document.getElementById('product-admin-message');
const imageInput = document.getElementById('admin-product-image-file');
const imagePreview = document.getElementById('admin-image-preview');
const previewImage = document.getElementById('admin-preview-image');

function getCSRFToken() {
    const cookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='));

    return cookie ? decodeURIComponent(cookie.split('=')[1]) : '';
}

async function apiRequest(url, options = {}) {
    const headers = {
        ...(options.headers || {}),
        'X-CSRFToken': getCSRFToken()
    };

    // Let the browser set Content-Type automatically for FormData.
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers
    });

    if (response.status === 401) {
        window.location.href = '/login/';
        throw new Error('Please log in.');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const errorText = Object.values(data)
            .flat()
            .join(' ');

        throw new Error(errorText || 'Request failed.');
    }

    return data;
}

function showMessage(message, isError = false) {
    messageBox.textContent = message;
    messageBox.style.color = isError ? '#d9534f' : '#39852b';
}

async function loadCategories() {
    const data = await apiRequest('/api/store/categories/');
    const categories = Array.isArray(data) ? data : (data.results || []);
    const select = document.getElementById('admin-product-category');

    select.innerHTML = '<option value="">Select category</option>';

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
    });
}

async function loadProducts() {
    productList.innerHTML = '<p>Loading products...</p>';

    try {
        const data = await apiRequest('/api/store/products/');
        const products = Array.isArray(data) ? data : (data.results || []);

        if (!products.length) {
            productList.innerHTML = '<p>No products found.</p>';
            return;
        }

        productList.innerHTML = products.map(product => {
            const image = product.image || product.image_url;

            return `
                <article class="admin-product-item">
                    <div class="admin-product-item-image">
                        ${image
                            ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(product.name)}">`
                            : '<span>No image</span>'}
                    </div>
                    <div class="admin-product-item-info">
                        <h3>${escapeHTML(product.name)}</h3>
                        <p>₹${Number(product.price).toFixed(2)}</p>
                        <p>Stock: ${product.stock_quantity}</p>
                        <p>${product.is_active ? 'Active' : 'Inactive'}</p>
                        <div class="admin-product-item-actions">
                            <button type="button" data-action="edit" data-id="${product.id}">Edit</button>
                            <button type="button" data-action="toggle" data-id="${product.id}">
                                ${product.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button type="button" data-action="delete" data-id="${product.id}">Delete</button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

    } catch (error) {
        productList.textContent = error.message;
    }
}

function escapeHTML(value) {
    const element = document.createElement('div');
    element.textContent = value ?? '';
    return element.innerHTML;
}

function resetProductForm() {
    productForm.reset();
    document.getElementById('edit-product-id').value = '';
    document.getElementById('admin-product-active').checked = true;
    document.getElementById('product-form-heading').textContent = 'Add New Product';
    document.getElementById('save-product-button').textContent = 'Save Product';
    imageInput.value = '';
    imagePreview.hidden = true;
    previewImage.src = '';
    showMessage('');
}

imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];

    if (!file) {
        imagePreview.hidden = true;
        return;
    }

    if (!file.type.startsWith('image/')) {
        showMessage('Please select a valid image file.', true);
        imageInput.value = '';
        imagePreview.hidden = true;
        return;
    }

    previewImage.src = URL.createObjectURL(file);
    imagePreview.hidden = false;
});

productForm.addEventListener('submit', async event => {
    event.preventDefault();

    const productId = document.getElementById('edit-product-id').value;
    const button = document.getElementById('save-product-button');

    const formData = new FormData();

    formData.append('name', document.getElementById('admin-product-name').value.trim());
    formData.append('description', document.getElementById('admin-product-description').value.trim());
    formData.append('price', document.getElementById('admin-product-price').value);
    formData.append('stock_quantity', document.getElementById('admin-product-stock').value);
    formData.append('category', document.getElementById('admin-product-category').value);
    formData.append('image_url', document.getElementById('admin-product-image').value.trim());
    formData.append('is_active', document.getElementById('admin-product-active').checked);

    if (imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
    }

    button.disabled = true;
    button.textContent = 'Saving...';

    try {
        await apiRequest(
            productId
                ? `/api/store/products/${productId}/`
                : '/api/store/products/',
            {
                method: productId ? 'PATCH' : 'POST',
                body: formData
            }
        );

        showMessage(productId ? 'Product updated successfully.' : 'Product created successfully.');
        resetProductForm();
        await loadProducts();

    } catch (error) {
        showMessage(error.message, true);
    } finally {
        button.disabled = false;
        button.textContent = 'Save Product';
    }
});

async function editProduct(id) {
    try {
        const product = await apiRequest(`/api/store/products/${id}/`);

        document.getElementById('edit-product-id').value = product.id;
        document.getElementById('admin-product-name').value = product.name;
        document.getElementById('admin-product-description').value = product.description;
        document.getElementById('admin-product-price').value = product.price;
        document.getElementById('admin-product-stock').value = product.stock_quantity;
        document.getElementById('admin-product-category').value = product.category;
        document.getElementById('admin-product-image').value = product.image_url || '';
        document.getElementById('admin-product-active').checked = product.is_active;

        imageInput.value = '';

        const image = product.image || product.image_url;

        if (image) {
            previewImage.src = image;
            imagePreview.hidden = false;
        } else {
            imagePreview.hidden = true;
        }

        document.getElementById('product-form-heading').textContent = 'Edit Product';
        document.getElementById('save-product-button').textContent = 'Update Product';

        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        showMessage(error.message, true);
    }
}

async function toggleProduct(id) {
    try {
        const product = await apiRequest(`/api/store/products/${id}/`);

        const formData = new FormData();
        formData.append('is_active', !product.is_active);

        await apiRequest(`/api/store/products/${id}/`, {
            method: 'PATCH',
            body: formData
        });

        await loadProducts();

    } catch (error) {
        showMessage(error.message, true);
    }
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        await apiRequest(`/api/store/products/${id}/`, {
            method: 'DELETE'
        });

        showMessage('Product deleted successfully.');
        await loadProducts();

    } catch (error) {
        showMessage(error.message, true);
    }
}

productList.addEventListener('click', async event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const id = button.dataset.id;

    if (button.dataset.action === 'edit') await editProduct(id);
    if (button.dataset.action === 'toggle') await toggleProduct(id);
    if (button.dataset.action === 'delete') await deleteProduct(id);
});

document.getElementById('reset-product-button').addEventListener('click', resetProductForm);
document.getElementById('refresh-products').addEventListener('click', loadProducts);

async function initializeProductManagement() {
    try {
        await loadCategories();
        await loadProducts();
    } catch (error) {
        showMessage(error.message, true);
    }
}

initializeProductManagement();
