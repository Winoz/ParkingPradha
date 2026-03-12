/* ==========================================
   MAIN APP CONTROLLER
   ========================================== */

const App = {
  currentPage: 'home',

  init() {
    this.updateNavbar();
    this.bindNavToggle();
    this.bindScroll();
    this.loadInitialData();
    this.loadContacts();
  },

  // --- Navigation ---
  navigate(page) {
    // Authorization check
    const user = Utils.getSession();
    if (page === 'dashboard' && !user) {
      Auth.showLoginModal();
      return;
    }
    if (page === 'admin' && (!user || user.role !== 'Admin')) {
      App.toast('Akses ditolak.', 'error');
      return;
    }

    // Hide all pages, show target
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) {
      target.classList.add('active');
      this.currentPage = page;
    }

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(l => {
      l.classList.toggle('active', l.dataset.page === page);
    });

    // Close mobile menu
    document.getElementById('navMenu').classList.remove('open');
    document.getElementById('navToggle').classList.remove('active');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Load page-specific data
    switch (page) {
      case 'availability': this.loadParkingSpots(); break;
      case 'financial': Financial.loadReport(); break;
      case 'reviews': this.loadReviews(); break;
      case 'dashboard': Dashboard.load(); break;
      case 'admin': Admin.load(); break;
    }
  },

  // --- Navbar ---
  updateNavbar() {
    const user = Utils.getSession();
    const navLogin = document.getElementById('navLogin');
    const navUser = document.getElementById('navUser');
    const navDashboard = document.getElementById('navDashboard');
    const navAdmin = document.getElementById('navAdminMenu');

    if (user) {
      navLogin.style.display = 'none';
      navUser.style.display = 'block';
      document.getElementById('navUserName').textContent = user.nama;
      navDashboard.style.display = 'block';
      navAdmin.style.display = user.role === 'Admin' ? 'block' : 'none';
    } else {
      navLogin.style.display = 'block';
      navUser.style.display = 'none';
      navDashboard.style.display = 'none';
      navAdmin.style.display = 'none';
    }
  },

  bindNavToggle() {
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navMenu');
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      menu.classList.toggle('open');
    });
  },

  bindScroll() {
    window.addEventListener('scroll', () => {
      document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
    });
  },

  // --- Modal ---
  openModal(contentHtml) {
    document.getElementById('modalBody').innerHTML = contentHtml;
    document.getElementById('modalOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeModal(e) {
    if (e && e.target !== document.getElementById('modalOverlay')) return;
    document.getElementById('modalOverlay').classList.remove('open');
    document.body.style.overflow = '';
  },

  // --- Toast ---
  toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  // --- Data Loaders ---
  async loadInitialData() {
    try {
      const spots = await API.get('getParkingSpots');
      const premiumAvail = spots.filter(s => s.type === 'Premium' && s.status === 'Available').length;
      const regularAvail = spots.filter(s => s.type === 'Regular' && s.status === 'Available').length;
      document.getElementById('statPremium').textContent = premiumAvail;
      document.getElementById('statRegular').textContent = regularAvail;
    } catch (e) {
      console.warn('Failed to load initial data:', e);
    }
  },

  async loadParkingSpots() {
    const grid = document.getElementById('spotsGrid');
    grid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Memuat data...</p></div>';

    try {
      const spots = await API.get('getParkingSpots', false);
      const premiumAvail = spots.filter(s => s.type === 'Premium' && s.status === 'Available').length;
      const regularAvail = spots.filter(s => s.type === 'Regular' && s.status === 'Available').length;

      document.getElementById('availPremium').textContent = premiumAvail;
      document.getElementById('availRegular').textContent = regularAvail;

      let html = '';
      spots.forEach(s => {
        const isAvail = s.status === 'Available';
        html += `
          <div class="spot-card ${isAvail ? 'available' : 'booked'}">
            <div class="spot-id">${s.spot_id}</div>
            <span class="spot-type ${s.type.toLowerCase()}">${s.type}</span>
            <div class="spot-price">${Utils.formatCurrency(s.price)}/bln</div>
            <span class="spot-status ${isAvail ? 'available' : 'booked'}">${isAvail ? 'Tersedia' : 'Terisi'}</span>
          </div>
        `;
      });

      grid.innerHTML = html || '<div class="empty-state"><p>Tidak ada data slot.</p></div>';
    } catch (error) {
      grid.innerHTML = `<div class="empty-state"><p style="color:var(--danger);">Gagal memuat: ${error.message}</p></div>`;
    }
  },

  async loadReviews() {
    const grid = document.getElementById('reviewsGrid');
    grid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Memuat ulasan...</p></div>';

    try {
      const reviews = await API.get('getReviews', false);

      if (!reviews || reviews.length === 0) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💬</div><h4>Belum Ada Ulasan</h4><p>Jadilah yang pertama memberikan ulasan!</p></div>';
        return;
      }

      let html = '';
      reviews.reverse().forEach(r => {
        html += `
          <div class="review-card">
            <div class="review-header">
              <span class="review-user">${r.nama_user}</span>
              <span class="review-stars">${Utils.renderStars(r.rating)}</span>
            </div>
            <p class="review-comment">${r.komentar}</p>
            <div class="review-date">${Utils.formatDate(r.timestamp)}</div>
          </div>
        `;
      });

      grid.innerHTML = html;
    } catch (error) {
      grid.innerHTML = `<div class="empty-state"><p style="color:var(--danger);">Gagal memuat: ${error.message}</p></div>`;
    }
  },

  showReviewModal() {
    let ratingValue = 0;
    const html = `
      <h3>Tulis Ulasan</h3>
      <p class="modal-subtitle">Bagikan pengalaman Anda tentang parkir Pradha Ciganitri.</p>
      <div class="form-group">
        <label>Nama Anda</label>
        <input type="text" id="reviewName" class="input" placeholder="Nama Anda" />
      </div>
      <div class="form-group">
        <label>Rating</label>
        <div class="star-rating-input" id="starRating">
          <span onclick="App.setRating(1)" data-star="1">★</span>
          <span onclick="App.setRating(2)" data-star="2">★</span>
          <span onclick="App.setRating(3)" data-star="3">★</span>
          <span onclick="App.setRating(4)" data-star="4">★</span>
          <span onclick="App.setRating(5)" data-star="5">★</span>
        </div>
        <input type="hidden" id="reviewRating" value="0" />
      </div>
      <div class="form-group">
        <label>Komentar</label>
        <textarea id="reviewComment" class="input" placeholder="Tulis komentar Anda..." rows="3"></textarea>
      </div>
      <button class="btn btn-primary btn-block" onclick="App.submitReview()" id="btnReview">Kirim Ulasan</button>
    `;
    this.openModal(html);
  },

  _currentRating: 0,

  setRating(val) {
    this._currentRating = val;
    document.getElementById('reviewRating').value = val;
    document.querySelectorAll('#starRating span').forEach(s => {
      s.classList.toggle('active', Number(s.dataset.star) <= val);
    });
  },

  async submitReview() {
    const nama = document.getElementById('reviewName').value.trim();
    const rating = Number(document.getElementById('reviewRating').value);
    const komentar = document.getElementById('reviewComment').value.trim();
    const btn = document.getElementById('btnReview');

    if (!nama || !komentar || rating === 0) {
      App.toast('Harap isi semua field dan berikan rating.', 'warning');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Mengirim...';

    try {
      await API.post('addReview', { nama_user: nama, rating, komentar });
      App.toast('Ulasan berhasil dikirim!', 'success');
      App.closeModal();
      this.loadReviews();
    } catch (error) {
      App.toast('Error: ' + error.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Kirim Ulasan';
    }
  },

  // --- WhatsApp ---
  async loadContacts() {
    try {
      const contacts = await API.get('getAdminContacts');
      const waList = document.getElementById('waMenuList');
      const footerContact = document.getElementById('footerContact');
      const msg = encodeURIComponent('Halo admin, saya ingin menanyakan informasi mengenai sewa parkir di Pradha Ciganitri.');

      if (contacts && contacts.length > 0) {
        let waHtml = '';
        let footerHtml = '<h4>Kontak Admin</h4>';

        contacts.forEach(c => {
          const phone = String(c.no_whatsapp).replace(/[^0-9]/g, '');
          waHtml += `
            <a class="wa-contact" href="https://wa.me/${phone}?text=${msg}" target="_blank">
              <div class="wa-contact-icon">💬</div>
              <div>
                <div class="wa-contact-name">${c.nama_admin}</div>
                <div class="wa-contact-blok">${c.blok}</div>
              </div>
            </a>
          `;
          footerHtml += `<p>${c.blok}: ${c.nama_admin}<br/>${c.no_whatsapp}</p>`;
        });

        waList.innerHTML = waHtml;
        footerContact.innerHTML = footerHtml;
      } else {
        // Default contacts
        waList.innerHTML = `
          <a class="wa-contact" href="https://wa.me/6281320912117?text=${msg}" target="_blank">
            <div class="wa-contact-icon">💬</div>
            <div><div class="wa-contact-name">Bpk Dadi</div><div class="wa-contact-blok">Blok A</div></div>
          </a>
          <a class="wa-contact" href="https://wa.me/628568999001?text=${msg}" target="_blank">
            <div class="wa-contact-icon">💬</div>
            <div><div class="wa-contact-name">Agung</div><div class="wa-contact-blok">Blok B</div></div>
          </a>
        `;
      }
    } catch (e) {
      console.warn('Failed to load contacts:', e);
    }
  },

  toggleWAMenu() {
    document.getElementById('waMenu').classList.toggle('open');
  }
};

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// Close WA menu on outside click
document.addEventListener('click', (e) => {
  const waMenu = document.getElementById('waMenu');
  const fabWA = document.getElementById('fabWA');
  if (!waMenu.contains(e.target) && !fabWA.contains(e.target)) {
    waMenu.classList.remove('open');
  }
});