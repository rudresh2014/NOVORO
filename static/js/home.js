
document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('home-products');

    try {
        const response = await fetch('/api/store/products/');

        if (!response.ok) {
            throw new Error('Could not load products');
        }

        const data = await response.json();
        const products = Array.isArray(data) ? data : (data.results || []);

        if (!products.length) {
            container.innerHTML = '<p>No products available yet.</p>';
            return;
        }

        container.innerHTML = products.slice(0, 4).map(product => {
            const image = product.image || product.image_url;

            return `
                <a href="/product/${product.id}/" class="home-product-card">
                    <div class="home-product-image">
                        ${image
                            ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(product.name)}">`
                            : '<span>NOVORA</span>'}
                    </div>
                    <div class="home-product-info">
                        <h3>${escapeHTML(product.name)}</h3>
                        <p>₹${Number(product.price).toFixed(2)}</p>
                    </div>
                </a>
            `;
        }).join('');

    } catch (error) {
        container.innerHTML = '<p>Unable to load products. Please visit our shop.</p>';
        console.error(error);
    }
});

function escapeHTML(value) {
    const element = document.createElement('div');
    element.textContent = value ?? '';
    return element.innerHTML;
}
