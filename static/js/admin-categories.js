
const categoryForm = document.getElementById('category-form');
const categoryId = document.getElementById('category-id');
const categoryName = document.getElementById('category-name');
const categoryDescription = document.getElementById('category-description');
const categoryList = document.getElementById('admin-category-list');
const categoryMessage = document.getElementById('category-message');
const saveButton = document.getElementById('category-save-button');

let categories = [];

function escapeCategory(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

function getCookie(name) {
    const cookie = document.cookie.split('; ')
        .find(row => row.startsWith(name + '='));
    return cookie ? decodeURIComponent(cookie.split('=')[1]) : '';
}

async function loadCategories() {
    categoryList.innerHTML = '<p>Loading categories...</p>';

    try {
        const response = await fetch('/api/store/categories/');

        if (!response.ok) throw new Error('Unable to load categories.');

        const data = await response.json();
        categories = Array.isArray(data) ? data : data.results || [];

        document.getElementById('category-count').textContent =
            `${categories.length} categories`;

        if (!categories.length) {
            categoryList.innerHTML = '<p>No categories added yet.</p>';
            return;
        }

        categoryList.innerHTML = categories.map(category => `
            <div class="admin-category-item">
                <div>
                    <h3>${escapeCategory(category.name)}</h3>
                    <p>${escapeCategory(category.description || 'No description')}</p>
                </div>
                <div class="category-actions">
                    <button class="category-edit-button" data-id="${category.id}">
                        Edit
                    </button>
                    <button class="category-delete-button" data-id="${category.id}">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        categoryList.innerHTML = `<p>${escapeCategory(error.message)}</p>`;
    }
}

function resetCategoryForm() {
    categoryForm.reset();
    categoryId.value = '';
    document.getElementById('category-form-heading').textContent = 'Add New Category';
    saveButton.textContent = 'Add Category';
    categoryMessage.textContent = '';
}

categoryForm.addEventListener('submit', async event => {
    event.preventDefault();

    const id = categoryId.value;
    const payload = {
        name: categoryName.value.trim(),
        description: categoryDescription.value.trim()
    };

    if (!payload.name) {
        categoryMessage.textContent = 'Enter a category name.';
        return;
    }

    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    try {
        const response = await fetch(
            id ? `/api/store/categories/${id}/` : '/api/store/categories/',
            {
                method: id ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(payload)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.name?.[0] || data.detail || 'Unable to save category.');
        }

        categoryMessage.textContent = id
            ? 'Category updated successfully.'
            : 'Category added successfully.';

        resetCategoryForm();
        await loadCategories();

    } catch (error) {
        categoryMessage.textContent = error.message;
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = categoryId.value ? 'Update Category' : 'Add Category';
    }
});

categoryList.addEventListener('click', async event => {
    const editButton = event.target.closest('.category-edit-button');
    const deleteButton = event.target.closest('.category-delete-button');

    if (editButton) {
        const category = categories.find(
            item => String(item.id) === editButton.dataset.id
        );

        if (!category) return;

        categoryId.value = category.id;
        categoryName.value = category.name;
        categoryDescription.value = category.description || '';

        document.getElementById('category-form-heading').textContent = 'Edit Category';
        saveButton.textContent = 'Update Category';
        categoryMessage.textContent = '';

        categoryForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (deleteButton) {
        const id = deleteButton.dataset.id;

        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            const response = await fetch(`/api/store/categories/${id}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || data.message || 'Cannot delete this category.');
            }

            categoryMessage.textContent = 'Category deleted successfully.';
            await loadCategories();

        } catch (error) {
            categoryMessage.textContent = error.message;
        }
    }
});

document.getElementById('category-reset-button')
    .addEventListener('click', resetCategoryForm);

document.getElementById('refresh-categories')
    .addEventListener('click', loadCategories);

loadCategories();
