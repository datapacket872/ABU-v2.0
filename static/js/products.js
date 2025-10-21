// products.js - Fetch and render products on the home page
(function(){
  function formatPrice(value){
    try {
      const n = Number(value || 0);
      return `$${n.toFixed(2)}`;
    } catch {
      return `$${value}`;
    }
  }

  async function fetchProducts(){
    try {
      const res = await fetch('/api/products', { credentials: 'same-origin' });
      if(!res.ok) throw new Error('failed');
      const json = await res.json();
      return Array.isArray(json.products) ? json.products : [];
    } catch {
      return [];
    }
  }

  async function fetchCsrf(){
    try {
      const res = await fetch('/api/csrf', { credentials: 'same-origin' });
      if(!res.ok) return '';
      const json = await res.json();
      return json.csrf_token || '';
    } catch { return ''; }
  }

  function showToast(message){
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 2200);
  }

  function updateCartCount(delta){
    const countEl = document.querySelector('.cart .cart-count');
    if(!countEl) return;
    const current = Number(countEl.textContent || 0) || 0;
    countEl.textContent = String(Math.max(0, current + (delta || 0)));
  }

  function render(products){
    const grid = document.querySelector('.product-grid');
    if(!grid) return;

    if(!products || products.length === 0){
      grid.innerHTML = '<div class="placeholder-card">No products available.</div>';
      return;
    }

    const cards = products.map(p => {
      const price = formatPrice(p.price);
      const href = `/details.html?id=${encodeURIComponent(p.id)}`;
      return `
        <a class="product-card" href="${href}" aria-label="View details for ${p.name}">
          <div class="product-badge">${p.stock > 0 ? 'In stock' : 'Out of stock'}</div>
          <div class="product-image" aria-hidden="true">
            <i class="fas fa-box-open fa-3x"></i>
          </div>
          <div class="product-info">
            <div class="product-title">${p.name}</div>
            <div class="product-rating" aria-hidden="true">
              <i class="fas fa-star pink-star"></i>
              <i class="fas fa-star pink-star"></i>
              <i class="fas fa-star pink-star"></i>
              <i class="fas fa-star pink-star"></i>
              <i class="far fa-star pink-star"></i>
              <span class="rating-count">(42)</span>
            </div>
            <div class="product-price">${price}</div>
            <div class="card-actions">
              <button class="btn-primary" data-action="add-to-cart" data-id="${p.id}" ${p.stock <= 0 ? 'disabled' : ''}>Add to Cart</button>
              <button class="btn-wishlist" aria-label="Add ${p.name} to wishlist"><i class="fas fa-heart"></i></button>
            </div>
          </div>
        </a>
      `;
    }).join('');

    grid.innerHTML = cards;
  }

  async function wireCart(){
    const grid = document.querySelector('.product-grid');
    if(!grid) return;
    const csrf = await fetchCsrf();

    grid.addEventListener('click', async (ev) => {
      const target = ev.target.closest('[data-action="add-to-cart"]');
      if(!target) return;
      ev.preventDefault();
      ev.stopPropagation();
      const id = Number(target.getAttribute('data-id'));
      if(!id) return;
      try {
        target.disabled = true;
        const res = await fetch('/api/cart', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf || '' },
          body: JSON.stringify({ items: [{ id, qty: 1 }] })
        });
        const data = await res.json().catch(() => ({}));
        if(res.ok && data.ok){
          updateCartCount(1);
          showToast('Added to cart');
        } else {
          showToast('Could not add to cart');
        }
      } catch {
        showToast('Network error');
      } finally {
        target.disabled = false;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', async function(){
    const products = await fetchProducts();
    render(products);
    wireCart();
  });
})();