const API = '/api';
let token = localStorage.getItem('khally_admin_token');
let allOrders = [];
let allProducts = [];
let allGallery = [];
let currentOrderId = null;

// ===== AUTH =====
function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

async function checkToken() {
  if (!token) { showLogin(); return; }
  try {
    const res = await fetch(`${API}/orders`, { headers: authHeaders() });
    if (res.status === 401 || res.status === 403) { showLogin(); }
    else { showDashboard(); }
  } catch { showDashboard(); }
}

function showLogin() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('dashboard').style.display = 'none';
}
function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'flex';
  loadAll();
}

document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';
  btn.disabled = true; btn.textContent = 'Logging in...';
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: document.getElementById('adminPass').value })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Login failed.'; }
    else {
      token = data.token;
      localStorage.setItem('khally_admin_token', token);
      showDashboard();
    }
  } catch { errEl.textContent = 'Could not reach server.'; }
  btn.disabled = false; btn.textContent = 'Login →';
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('khally_admin_token');
  token = null;
  showLogin();
});

// ===== TABS =====
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`tab${capitalize(tabName)}`).classList.add('active');
  document.getElementById(`nav${capitalize(tabName)}`).classList.add('active');
  document.getElementById('topbarTitle').textContent = capitalize(tabName);
}
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});
document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ===== LOAD ALL =====
async function loadAll() {
  await Promise.all([loadOrders(), loadProducts(), loadGallery()]);
  updateOverview();
}

// ===== ORDERS =====
async function loadOrders() {
  const res = await fetch(`${API}/orders`, { headers: authHeaders() });
  allOrders = await res.json();
  renderOrders(allOrders);
  renderRecentOrders();
  const pending = allOrders.filter(o => o.status === 'pending').length;
  const badge = document.getElementById('pendingBadge');
  badge.textContent = pending > 0 ? pending : '';
}

function renderOrders(orders) {
  const tbody = document.getElementById('ordersBody');
  if (!orders.length) { tbody.innerHTML = '<tr><td colspan="7" class="table-loading">No orders yet.</td></tr>'; return; }
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><strong>${o.customer_name}</strong></td>
      <td><a href="tel:${o.phone}">${o.phone}</a></td>
      <td>${o.product_name}</td>
      <td>${o.quantity}</td>
      <td>${o.delivery_date ? new Date(o.delivery_date).toLocaleDateString('en-GB') : '—'}</td>
      <td><span class="status-badge status-${o.status}">${o.status.replace('_',' ')}</span></td>
      <td style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="action-btn btn-view" onclick="viewOrder('${o.id}')">View</button>
        <button class="action-btn btn-delete" onclick="deleteOrder('${o.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function filterOrders() {
  const val = document.getElementById('statusFilter').value;
  renderOrders(val === 'all' ? allOrders : allOrders.filter(o => o.status === val));
}

function renderRecentOrders() {
  const el = document.getElementById('recentOrdersList');
  const recent = [...allOrders].slice(0, 5);
  if (!recent.length) { el.innerHTML = '<p style="padding:20px;color:#aaa;text-align:center">No orders yet.</p>'; return; }
  el.innerHTML = `<table class="data-table"><thead><tr><th>Customer</th><th>Product</th><th>Status</th></tr></thead><tbody>
    ${recent.map(o => `<tr>
      <td>${o.customer_name}</td>
      <td>${o.product_name}</td>
      <td><span class="status-badge status-${o.status}">${o.status.replace('_',' ')}</span></td>
    </tr>`).join('')}
  </tbody></table>`;
}

function viewOrder(id) {
  const o = allOrders.find(x => x.id === id);
  if (!o) return;
  currentOrderId = id;
  document.getElementById('orderDetailContent').innerHTML = `
    <div class="detail-row"><span class="detail-label">Customer</span><span class="detail-value">${o.customer_name}</span></div>
    <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${o.phone}</span></div>
    <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${o.email || '—'}</span></div>
    <div class="detail-row"><span class="detail-label">Product</span><span class="detail-value">${o.product_name}</span></div>
    <div class="detail-row"><span class="detail-label">Quantity</span><span class="detail-value">${o.quantity}</span></div>
    <div class="detail-row"><span class="detail-label">Delivery Date</span><span class="detail-value">${o.delivery_date ? new Date(o.delivery_date).toLocaleDateString('en-GB') : '—'}</span></div>
    <div class="detail-row"><span class="detail-label">Address</span><span class="detail-value">${o.address || '—'}</span></div>
    <div class="detail-row"><span class="detail-label">Notes</span><span class="detail-value">${o.notes || '—'}</span></div>
    <div class="detail-row"><span class="detail-label">Order Date</span><span class="detail-value">${new Date(o.created_at).toLocaleString()}</span></div>
    <div style="margin-top:16px">
      <label style="font-size:.85rem;font-weight:600;color:#3D1C02">Update Status</label><br/>
      <select class="status-select" id="orderStatusSelect" onchange="updateOrderStatus('${o.id}', this.value)">
        <option value="pending" ${o.status==='pending'?'selected':''}>Pending</option>
        <option value="confirmed" ${o.status==='confirmed'?'selected':''}>Confirmed</option>
        <option value="in_progress" ${o.status==='in_progress'?'selected':''}>In Progress</option>
        <option value="completed" ${o.status==='completed'?'selected':''}>Completed</option>
        <option value="cancelled" ${o.status==='cancelled'?'selected':''}>Cancelled</option>
      </select>
    </div>
    <div style="margin-top:16px">
      <a href="https://wa.me/${o.phone.replace(/\D/g,'')}?text=${encodeURIComponent('Hello '+o.customer_name+'! This is Khally Cakes regarding your order for '+o.product_name+'.')}"
         target="_blank" class="btn-gold" style="display:inline-block;text-decoration:none;font-size:.85rem;padding:10px 20px">
        💬 WhatsApp Customer
      </a>
    </div>
  `;
  document.getElementById('orderDetailModal').classList.add('active');
}

async function updateOrderStatus(id, status) {
  const res = await fetch(`${API}/orders/${id}/status`, {
    method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status })
  });
  if (res.ok) { toast('Status updated!', 'success'); await loadOrders(); updateOverview(); }
  else toast('Failed to update.', 'error');
}

async function deleteOrder(id) {
  if (!confirm('Delete this order?')) return;
  const res = await fetch(`${API}/orders/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (res.ok) { toast('Order deleted.', 'success'); await loadOrders(); updateOverview(); }
  else toast('Failed to delete.', 'error');
}

function closeOrderDetail() {
  document.getElementById('orderDetailModal').classList.remove('active');
}
document.getElementById('orderDetailModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeOrderDetail();
});

// ===== PRODUCTS =====
async function loadProducts() {
  const res = await fetch(`${API}/products`);
  allProducts = await res.json();
  renderAdminProducts();
}

function renderAdminProducts() {
  const grid = document.getElementById('adminProductsGrid');
  if (!allProducts.length) { grid.innerHTML = '<div class="table-loading">No products yet. Add your first one!</div>'; return; }
  grid.innerHTML = allProducts.map(p => `
    <div class="admin-product-card">
      <div class="admin-product-img">
        ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" />` : '🎂'}
      </div>
      <div class="admin-product-body">
        <div class="admin-product-name">${p.name}</div>
        <div class="admin-product-price">${p.price ? '₦'+Number(p.price).toLocaleString() : 'Price TBD'}</div>
        <div class="admin-product-actions">
          <button class="action-btn btn-view" onclick="editProduct('${p.id}')">Edit</button>
          <button class="action-btn btn-delete" onclick="deleteProduct('${p.id}')">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

function showProductForm(clear = true) {
  document.getElementById('productFormCard').style.display = 'block';
  document.getElementById('productFormTitle').textContent = 'Add New Product';
  if (clear) {
    document.getElementById('productId').value = '';
    document.getElementById('productForm').reset();
    clearProductImage();
  }
}
function hideProductForm() {
  document.getElementById('productFormCard').style.display = 'none';
  clearProductImage();
}

// ===== PRODUCT IMAGE UPLOAD =====
const productImgZone = document.getElementById('productImgZone');
const productImgFile = document.getElementById('pImageFile');

productImgZone.addEventListener('click', () => productImgFile.click());
productImgZone.addEventListener('dragover', e => { e.preventDefault(); productImgZone.classList.add('drag-over'); });
productImgZone.addEventListener('dragleave', () => productImgZone.classList.remove('drag-over'));
productImgZone.addEventListener('drop', e => {
  e.preventDefault();
  productImgZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleProductImageFile(file);
});
productImgFile.addEventListener('change', () => {
  if (productImgFile.files[0]) handleProductImageFile(productImgFile.files[0]);
});

async function handleProductImageFile(file) {
  // Show local preview immediately
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('productImgPreviewImg').src = e.target.result;
    document.getElementById('productImgPreview').style.display = 'block';
    document.getElementById('productImgZone').style.display = 'none';
  };
  reader.readAsDataURL(file);

  // Upload to server
  const indicator = document.createElement('p');
  indicator.className = 'uploading-indicator';
  indicator.textContent = '⏳ Uploading image...';
  document.getElementById('productImgPreview').appendChild(indicator);

  const formData = new FormData();
  formData.append('image', file);
  try {
    const res = await fetch(`${API}/products/upload-image`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (res.ok) {
      document.getElementById('pImageUrl').value = data.url;
      indicator.textContent = '✅ Image uploaded!';
      setTimeout(() => indicator.remove(), 2000);
    } else {
      indicator.textContent = '❌ Upload failed: ' + (data.error || 'Unknown error');
    }
  } catch {
    indicator.textContent = '❌ Upload failed. Check connection.';
  }
}

function clearProductImage() {
  document.getElementById('pImageUrl').value = '';
  document.getElementById('pImageFile').value = '';
  document.getElementById('productImgPreviewImg').src = '';
  document.getElementById('productImgPreview').style.display = 'none';
  document.getElementById('productImgZone').style.display = 'block';
  productImgZone.querySelector('p').innerHTML = 'Drop image here or <span class="upload-browse">click to browse</span>';
}

function editProduct(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  showProductForm(false);
  document.getElementById('productFormTitle').textContent = 'Edit Product';
  document.getElementById('productId').value = p.id;
  document.getElementById('pName').value = p.name || '';
  document.getElementById('pCategory').value = p.category || 'other';
  document.getElementById('pDesc').value = p.description || '';
  document.getElementById('pPrice').value = p.price || '';
  document.getElementById('pBadge').value = p.badge || '';
  document.getElementById('pImageUrl').value = p.image_url || '';
  // Show existing image preview
  if (p.image_url) {
    document.getElementById('productImgPreviewImg').src = p.image_url;
    document.getElementById('productImgPreview').style.display = 'block';
    document.getElementById('productImgZone').style.display = 'none';
  }
  document.getElementById('productFormCard').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('productForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  const btn = document.getElementById('saveProductBtn');
  btn.disabled = true; btn.textContent = 'Saving...';
  const body = {
    name: document.getElementById('pName').value,
    category: document.getElementById('pCategory').value,
    description: document.getElementById('pDesc').value,
    price: document.getElementById('pPrice').value,
    badge: document.getElementById('pBadge').value,
    image_url: document.getElementById('pImageUrl').value,
  };
  const url = id ? `${API}/products/${id}` : `${API}/products`;
  const method = id ? 'PUT' : 'POST';
  const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
  if (res.ok) {
    toast(id ? 'Product updated!' : 'Product added!', 'success');
    hideProductForm();
    await loadProducts();
    updateOverview();
  } else {
    const d = await res.json();
    toast(d.error || 'Save failed.', 'error');
  }
  btn.disabled = false; btn.textContent = 'Save Product';
});

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  const res = await fetch(`${API}/products/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (res.ok) { toast('Product deleted.', 'success'); await loadProducts(); updateOverview(); }
  else toast('Failed to delete.', 'error');
}

// ===== GALLERY =====
async function loadGallery() {
  const res = await fetch(`${API}/gallery`);
  allGallery = await res.json();
  renderAdminGallery();
}

function renderAdminGallery() {
  const grid = document.getElementById('adminGalleryGrid');
  if (!allGallery.length) { grid.innerHTML = '<div class="table-loading">No media yet. Upload your first image or video!</div>'; return; }
  grid.innerHTML = allGallery.map(item => `
    <div class="admin-gallery-item">
      ${item.type === 'video'
        ? `<video src="${item.url}" muted preload="metadata"></video>`
        : `<img src="${item.url}" alt="${item.caption||''}" />`}
      <div class="admin-gallery-info">
        <span class="admin-gallery-caption">${item.caption || 'No caption'}</span>
        <span class="admin-gallery-type">${item.type}</span>
        <button class="action-btn btn-delete" style="margin-left:8px" onclick="deleteGalleryItem('${item.id}')">✕</button>
      </div>
    </div>
  `).join('');
}

// Upload zone
const uploadZone = document.getElementById('uploadZone');
const galleryFile = document.getElementById('galleryFile');
uploadZone.addEventListener('click', () => galleryFile.click());
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  if (e.dataTransfer.files[0]) { galleryFile.files = e.dataTransfer.files; uploadZone.querySelector('p').textContent = e.dataTransfer.files[0].name; }
});
galleryFile.addEventListener('change', () => {
  if (galleryFile.files[0]) uploadZone.querySelector('p').textContent = galleryFile.files[0].name;
});

async function uploadGalleryItem() {
  if (!galleryFile.files[0]) { toast('Please select a file first.', 'error'); return; }
  const btn = document.getElementById('uploadBtn');
  const progress = document.getElementById('uploadProgress');
  const fill = document.getElementById('progressFill');
  const text = document.getElementById('progressText');
  btn.disabled = true;
  progress.style.display = 'block';

  const formData = new FormData();
  formData.append('file', galleryFile.files[0]);
  formData.append('caption', document.getElementById('galleryCaption').value);

  try {
    // Simulate progress
    let p = 0;
    const interval = setInterval(() => { p = Math.min(p + 10, 85); fill.style.width = p + '%'; }, 200);
    const res = await fetch(`${API}/gallery`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    clearInterval(interval);
    fill.style.width = '100%';
    text.textContent = 'Done!';
    if (res.ok) {
      toast('Media uploaded!', 'success');
      galleryFile.value = '';
      document.getElementById('galleryCaption').value = '';
      uploadZone.querySelector('p').textContent = 'Click to browse or drag & drop here';
      await loadGallery();
    } else {
      const d = await res.json();
      toast(d.error || 'Upload failed.', 'error');
    }
  } catch { toast('Upload failed.', 'error'); }

  setTimeout(() => { progress.style.display = 'none'; fill.style.width = '0%'; text.textContent = 'Uploading...'; }, 1500);
  btn.disabled = false;
}

async function deleteGalleryItem(id) {
  if (!confirm('Delete this media?')) return;
  const res = await fetch(`${API}/gallery/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (res.ok) { toast('Media deleted.', 'success'); await loadGallery(); }
  else toast('Failed to delete.', 'error');
}

// ===== OVERVIEW STATS =====
function updateOverview() {
  document.getElementById('statTotal').textContent = allOrders.length;
  document.getElementById('statPending').textContent = allOrders.filter(o => o.status === 'pending').length;
  document.getElementById('statCompleted').textContent = allOrders.filter(o => o.status === 'completed').length;
  document.getElementById('statProducts').textContent = allProducts.length;
}

// ===== TOAST =====
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = (type === 'success' ? '✅ ' : '❌ ') + msg;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3000);
}

// ===== INIT =====
checkToken();
