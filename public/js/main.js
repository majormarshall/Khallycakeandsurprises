const API = '';
const WA_NUMBER = '2348173985467';

// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

// ===== HAMBURGER =====
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

// ===== HERO PARTICLES =====
function createParticles() {
  const container = document.getElementById('particles');
  const emojis = ['🎂','✨','🌸','🍰','💫','🎀','🌺','⭐'];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 20 + 10;
    p.style.cssText = `
      left:${Math.random()*100}%;
      width:${size}px; height:${size}px;
      animation-duration:${Math.random()*12+8}s;
      animation-delay:${Math.random()*8}s;
      font-size:${size}px; background:none;
    `;
    p.textContent = emojis[Math.floor(Math.random()*emojis.length)];
    container.appendChild(p);
  }
}
createParticles();

// ===== PRODUCTS =====
let allProducts = [];
let activeFilter = 'all';

async function loadProducts() {
  const grid = document.getElementById('productsGrid');
  try {
    const res = await fetch(`${API}/api/products`);
    allProducts = await res.json();
    if (!Array.isArray(allProducts) || allProducts.length === 0) {
      grid.innerHTML = `<div class="products-loading"><p>No products yet. Check back soon! 🎂</p></div>`;
      return;
    }
    renderProducts(allProducts);
  } catch (e) {
    grid.innerHTML = `<div class="products-loading"><p>Could not load products. Please try again later.</p></div>`;
  }
}

function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  const filtered = activeFilter === 'all' ? products : products.filter(p => (p.category||'').toLowerCase() === activeFilter);
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="products-loading"><p>No products in this category yet.</p></div>`;
    return;
  }
  grid.innerHTML = filtered.map(p => `
    <div class="product-card" data-category="${p.category||''}">
      <div class="product-img-wrap">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
        ${p.image_url
          ? `<img src="${p.image_url}" alt="${p.name}" loading="lazy" />`
          : `<div class="product-placeholder">🎂</div>`}
      </div>
      <div class="product-body">
        <div class="product-category">${p.category || 'Cake'}</div>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.description || ''}</p>
        <div class="product-footer">
          <span class="product-price">${p.price ? '₦' + Number(p.price).toLocaleString() : 'Ask for price'}</span>
          <button class="product-order-btn" onclick="openOrderModal('${p.name.replace(/'/g,"\\'")}')">Order Now</button>
        </div>
      </div>
    </div>
  `).join('');
}

document.getElementById('filterTabs').addEventListener('click', e => {
  if (!e.target.classList.contains('filter-tab')) return;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  e.target.classList.add('active');
  activeFilter = e.target.dataset.filter;
  renderProducts(allProducts);
});

// ===== GALLERY =====
let allGallery = [];
let galleryFilter = 'all';

async function loadGallery() {
  const grid = document.getElementById('galleryGrid');
  try {
    const res = await fetch(`${API}/api/gallery`);
    allGallery = await res.json();
    renderGallery(allGallery);
  } catch (e) {
    grid.innerHTML = `<div class="gallery-empty"><p>Gallery coming soon!</p></div>`;
  }
}

function renderGallery(items) {
  const grid = document.getElementById('galleryGrid');
  const filtered = galleryFilter === 'all' ? items : items.filter(i => i.type === galleryFilter);
  if (!filtered.length) {
    grid.innerHTML = `<div class="gallery-empty"><span style="font-size:3rem">📷</span><p>No items here yet.</p></div>`;
    return;
  }
  grid.innerHTML = filtered.map(item => `
    <div class="gallery-item" onclick="${item.type === 'image' ? `openLightbox('${item.url}')` : ''}">
      ${item.type === 'video'
        ? `<video src="${item.url}" muted loop playsinline></video><span class="gallery-video-badge">▶ Video</span>`
        : `<img src="${item.url}" alt="${item.caption||'Gallery'}" loading="lazy" />`}
      <div class="gallery-overlay"><span class="gallery-overlay-icon">${item.type==='video'?'▶':'🔍'}</span></div>
    </div>
  `).join('');
  // autoplay videos on hover
  grid.querySelectorAll('video').forEach(v => {
    v.parentElement.addEventListener('mouseenter', () => v.play());
    v.parentElement.addEventListener('mouseleave', () => { v.pause(); v.currentTime = 0; });
  });
}

document.querySelectorAll('.gallery-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.gallery-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    galleryFilter = tab.dataset.type;
    renderGallery(allGallery);
  });
});

// ===== LIGHTBOX =====
function openLightbox(url) {
  document.getElementById('lightboxImg').src = url;
  document.getElementById('lightbox').classList.add('active');
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
  document.getElementById('lightboxImg').src = '';
}

// ===== ORDER MODAL =====
function openOrderModal(productName = '') {
  const modal = document.getElementById('orderModal');
  if (productName) document.getElementById('oProduct').value = productName;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeOrderModal() {
  document.getElementById('orderModal').classList.remove('active');
  document.body.style.overflow = '';
}
document.getElementById('orderModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeOrderModal();
});

// ===== ORDER FORM SUBMIT =====
document.getElementById('orderForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('orderSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Saving order...';

  const data = {
    customer_name: document.getElementById('oName').value,
    phone: document.getElementById('oPhone').value,
    email: document.getElementById('oEmail').value,
    product_name: document.getElementById('oProduct').value,
    quantity: document.getElementById('oQty').value,
    delivery_date: document.getElementById('oDate').value,
    address: document.getElementById('oAddress').value,
    notes: document.getElementById('oNotes').value,
  };

  try {
    await fetch(`${API}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (_) {}

  // Build WhatsApp message
  const msg = encodeURIComponent(
    `🎂 *New Order – Khally Cakes & Surprises*\n\n` +
    `👤 Name: ${data.customer_name}\n` +
    `📱 Phone: ${data.phone}\n` +
    `🛍️ Product: ${data.product_name}\n` +
    `🔢 Quantity: ${data.quantity}\n` +
    `📅 Needed By: ${data.delivery_date || 'Not specified'}\n` +
    `📍 Address: ${data.address || 'Not specified'}\n` +
    `📝 Notes: ${data.notes || 'None'}`
  );
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
  closeOrderModal();
  e.target.reset();
  btn.disabled = false;
  btn.textContent = 'Confirm Order & Open WhatsApp 💬';
});

// ===== QUICK ORDER FORM (contact section) =====
document.getElementById('quickOrderForm').addEventListener('submit', e => {
  e.preventDefault();
  const msg = encodeURIComponent(
    `🎂 *Order Enquiry – Khally Cakes & Surprises*\n\n` +
    `👤 Name: ${document.getElementById('qName').value}\n` +
    `📱 Phone: ${document.getElementById('qPhone').value}\n` +
    `🛍️ Request: ${document.getElementById('qProduct').value}\n` +
    `🔢 Qty: ${document.getElementById('qQty').value}\n` +
    `📅 Needed By: ${document.getElementById('qDate').value || 'Not specified'}\n` +
    `📝 Notes: ${document.getElementById('qNotes').value || 'None'}`
  );
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
  e.target.reset();
});

// ===== INTERSECTION OBSERVER (fade-in) =====
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.service-card, .product-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// ===== INIT =====
loadProducts();
loadGallery();
