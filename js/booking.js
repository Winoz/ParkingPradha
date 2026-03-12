/* ==========================================
   BOOKING WIZARD MODULE
   ========================================== */

const Booking = {
  state: {
    step: 1,
    selectedType: null,
    selectedSpots: [],
    duration: null,
    spots: [],
    settings: [],
    totalPrice: 0,
    discount: 0,
    finalPrice: 0
  },

  reset() {
    this.state = {
      step: 1, selectedType: null, selectedSpots: [],
      duration: null, spots: [], settings: [], totalPrice: 0, discount: 0, finalPrice: 0
    };
  },

  async start(preselectedType) {
    const user = Utils.getSession();
    if (!user) {
      Auth.showLoginModal();
      return;
    }

    this.reset();
    if (preselectedType) this.state.selectedType = preselectedType;

    App.openModal('<div class="loading-spinner"><div class="spinner"></div><p>Memuat data...</p></div>');

    try {
      const [spots, settings] = await Promise.all([
        API.get('getParkingSpots', false),
        API.get('getAppSettings')
      ]);
      this.state.spots = spots;
      this.state.settings = settings;
      this.renderStep();
    } catch (error) {
      App.toast('Gagal memuat data: ' + error.message, 'error');
      App.closeModal();
    }
  },

  renderStep() {
    const s = this.state;
    let html = this.renderStepper();

    switch (s.step) {
      case 1: html += this.renderStep1(); break;
      case 2: html += this.renderStep2(); break;
      case 3: html += this.renderStep3(); break;
      case 4: html += this.renderStep4(); break;
      case 5: html += this.renderStep5(); break;
    }

    document.getElementById('modalBody').innerHTML = html;
  },

  renderStepper() {
    const steps = ['Tipe', 'Slot', 'Durasi', 'Bayar', 'Upload'];
    const current = this.state.step;
    let html = '<div class="stepper">';
    steps.forEach((label, i) => {
      const num = i + 1;
      const cls = num < current ? 'done' : (num === current ? 'active' : '');
      html += `<div class="step ${cls}">
        <div class="step-circle">${num < current ? '✓' : num}</div>
        <div class="step-label">${label}</div>
      </div>`;
      if (i < steps.length - 1) {
        html += `<div class="step-line ${num < current ? 'done' : ''}"></div>`;
      }
    });
    html += '</div>';
    return html;
  },

  // Step 1: Choose Type
  renderStep1() {
    const s = this.state;
    return `
      <h3>Pilih Tipe Area</h3>
      <p class="modal-subtitle">Pilih area parkir yang sesuai kebutuhan Anda.</p>
      <div class="duration-grid">
        <div class="duration-option ${s.selectedType === 'Premium' ? 'selected' : ''}" onclick="Booking.selectType('Premium')">
          <div class="dur-month">⭐ Premium</div>
          <div class="dur-label">Kanopi, LED, CCTV, Paving, Security</div>
          <div class="dur-price">Rp 150.000/bulan</div>
        </div>
        <div class="duration-option ${s.selectedType === 'Regular' ? 'selected' : ''}" onclick="Booking.selectType('Regular')">
          <div class="dur-month">🅿️ Regular</div>
          <div class="dur-label">CCTV, Paving, Security</div>
          <div class="dur-price">Rp 50.000/bulan</div>
        </div>
      </div>
      <div class="mt-24" style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-primary" onclick="Booking.nextStep()" ${!s.selectedType ? 'disabled' : ''} id="btnNext1">Lanjutkan</button>
      </div>
    `;
  },

  selectType(type) {
    this.state.selectedType = type;
    this.state.selectedSpots = [];
    this.renderStep();
  },

  // Step 2: Select Spots
  renderStep2() {
    const s = this.state;
    const available = s.spots.filter(sp => sp.type === s.selectedType && sp.status === 'Available');
    const booked = s.spots.filter(sp => sp.type === s.selectedType && sp.status === 'Booked');

    let slotsHtml = '<div class="slot-selection-grid">';
    s.spots.filter(sp => sp.type === s.selectedType).forEach(sp => {
      const isAvail = sp.status === 'Available';
      const isSelected = s.selectedSpots.includes(sp.spot_id);
      const cls = !isAvail ? 'disabled' : (isSelected ? 'selected' : '');
      slotsHtml += `<div class="slot-option ${cls}" onclick="${isAvail ? `Booking.toggleSpot('${sp.spot_id}')` : ''}">
        <div style="font-weight:800;">${sp.spot_id}</div>
        <div style="font-size:.7rem;color:var(--gray-400);">${isAvail ? 'Tersedia' : 'Terisi'}</div>
      </div>`;
    });
    slotsHtml += '</div>';

    return `
      <h3>Pilih Slot Parkir</h3>
      <p class="modal-subtitle">Pilih maksimal 4 slot ${s.selectedType}. Tersedia: <strong>${available.length}</strong></p>
      ${slotsHtml}
      <div style="font-size:.8rem;color:var(--gray-400);margin-top:8px;">Dipilih: ${s.selectedSpots.length}/4</div>
      <div class="mt-24" style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-outline-dark" onclick="Booking.prevStep()">Kembali</button>
        <button class="btn btn-primary" onclick="Booking.nextStep()" ${s.selectedSpots.length === 0 ? 'disabled' : ''}>Lanjutkan</button>
      </div>
    `;
  },

  toggleSpot(spotId) {
    const idx = this.state.selectedSpots.indexOf(spotId);
    if (idx > -1) {
      this.state.selectedSpots.splice(idx, 1);
    } else {
      if (this.state.selectedSpots.length >= 4) {
        App.toast('Maksimal 4 slot dalam 1 transaksi.', 'warning');
        return;
      }
      this.state.selectedSpots.push(spotId);
    }
    this.renderStep();
  },

  // Step 3: Duration
  renderStep3() {
    const s = this.state;
    const durations = [
      { months: 1, label: '1 Bulan' },
      { months: 3, label: '3 Bulan' },
      { months: 6, label: '6 Bulan' },
      { months: 12, label: '12 Bulan' }
    ];

    // Look for discounts in settings
    const getDiscount = (m) => {
      const setting = s.settings.find(st => st.key === `discount_${m}`);
      return setting ? Number(setting.value) : 0;
    };

    const basePrice = s.selectedType === 'Premium' ? 150000 : 50000;
    const spotsCount = s.selectedSpots.length;

    let html = `
      <h3>Pilih Durasi Sewa</h3>
      <p class="modal-subtitle">Semakin lama, semakin hemat!</p>
      <div class="duration-grid">
    `;

    durations.forEach(d => {
      const disc = getDiscount(d.months);
      const subtotal = basePrice * spotsCount * d.months;
      const discAmount = disc > 0 ? (disc < 100 ? subtotal * disc / 100 : disc * spotsCount) : 0;
      const final = subtotal - discAmount;

      html += `
        <div class="duration-option ${s.duration === d.months ? 'selected' : ''}" onclick="Booking.selectDuration(${d.months})">
          ${disc > 0 ? `<div class="discount-badge">-${disc < 100 ? disc + '%' : Utils.formatCurrency(disc)}</div>` : ''}
          <div class="dur-month">${d.label}</div>
          <div class="dur-label">${spotsCount} slot × ${d.months} bulan</div>
          <div class="dur-price">${Utils.formatCurrency(final)}</div>
          ${disc > 0 ? `<div style="font-size:.7rem;color:var(--danger);text-decoration:line-through;">${Utils.formatCurrency(subtotal)}</div>` : ''}
        </div>
      `;
    });

    html += '</div>';
    html += `
      <div class="mt-24" style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-outline-dark" onclick="Booking.prevStep()">Kembali</button>
        <button class="btn btn-primary" onclick="Booking.nextStep()" ${!s.duration ? 'disabled' : ''}>Lanjutkan</button>
      </div>
    `;
    return html;
  },

  selectDuration(months) {
    this.state.duration = months;
    this.calculatePrice();
    this.renderStep();
  },

  calculatePrice() {
    const s = this.state;
    const basePrice = s.selectedType === 'Premium' ? 150000 : 50000;
    const spotsCount = s.selectedSpots.length;
    s.totalPrice = basePrice * spotsCount * s.duration;

    const discSetting = s.settings.find(st => st.key === `discount_${s.duration}`);
    const disc = discSetting ? Number(discSetting.value) : 0;
    s.discount = disc > 0 ? (disc < 100 ? s.totalPrice * disc / 100 : disc * spotsCount) : 0;
    s.finalPrice = s.totalPrice - s.discount;
  },

  // Step 4: Invoice
  renderStep4() {
    const s = this.state;
    this.calculatePrice();

    // Bank info from settings
    const bankSettings = s.settings.filter(st => st.key.startsWith('bank_'));
    let bankHtml = '';
    bankSettings.forEach(b => {
      bankHtml += `<div class="bank-item"><span class="bank-name">${b.description || b.key}</span><span class="bank-number">${b.value}</span></div>`;
    });

    if (!bankHtml) {
      bankHtml = `
        <div class="bank-item"><span class="bank-name">BCA</span><span class="bank-number">Hubungi Admin</span></div>
        <div class="bank-item"><span class="bank-name">DANA</span><span class="bank-number">Hubungi Admin</span></div>
      `;
    }

    const user = Utils.getSession();
    return `
      <h3>Ringkasan Tagihan</h3>
      <p class="modal-subtitle">Periksa detail dan lakukan pembayaran.</p>
      <div class="invoice-summary">
        <div class="invoice-row"><span>Penyewa</span><span>${user.nama}</span></div>
        <div class="invoice-row"><span>Tipe Area</span><span>${s.selectedType}</span></div>
        <div class="invoice-row"><span>Slot Dipilih</span><span>${s.selectedSpots.join(', ')}</span></div>
        <div class="invoice-row"><span>Durasi</span><span>${s.duration} Bulan</span></div>
        <div class="invoice-row"><span>Subtotal</span><span>${Utils.formatCurrency(s.totalPrice)}</span></div>
        ${s.discount > 0 ? `<div class="invoice-row"><span>Diskon</span><span class="discount">-${Utils.formatCurrency(s.discount)}</span></div>` : ''}
        <div class="invoice-row total"><span>Total Bayar</span><span>${Utils.formatCurrency(s.finalPrice)}</span></div>
      </div>
      <div class="bank-info">
        <h4>Transfer ke Rekening:</h4>
        ${bankHtml}
      </div>
      <div class="mt-24" style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-outline-dark" onclick="Booking.prevStep()">Kembali</button>
        <button class="btn btn-primary" onclick="Booking.nextStep()">Upload Bukti Transfer</button>
      </div>
    `;
  },

  // Step 5: Upload
  renderStep5() {
    return `
      <h3>Upload Bukti Transfer</h3>
      <p class="modal-subtitle">Unggah foto atau PDF bukti pembayaran Anda.</p>
      <div class="form-group">
        <label>Plat Nomor Kendaraan</label>
        <input type="text" id="bookingPlat" class="input" placeholder="Contoh: D 1234 AB" />
      </div>
      <div class="form-group">
        <label>Merk Kendaraan</label>
        <input type="text" id="bookingMerk" class="input" placeholder="Contoh: Toyota Avanza" />
      </div>
      <div class="form-group">
        <label>Bukti Transfer (JPG/PNG/PDF)</label>
        <input type="file" id="bookingFile" class="input" accept="image/*,.pdf" />
        <div class="hint">Ukuran maks 5MB. Gambar akan dikompresi otomatis.</div>
      </div>
      <div class="mt-24" style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-outline-dark" onclick="Booking.prevStep()">Kembali</button>
        <button class="btn btn-success" onclick="Booking.submit()" id="btnSubmitBooking">Kirim & Selesai</button>
      </div>
    `;
  },

  nextStep() {
    if (this.state.step < 5) {
      this.state.step++;
      this.renderStep();
    }
  },

  prevStep() {
    if (this.state.step > 1) {
      this.state.step--;
      this.renderStep();
    }
  },

  async submit() {
    const plat = document.getElementById('bookingPlat').value.trim();
    const merk = document.getElementById('bookingMerk').value.trim();
    const fileInput = document.getElementById('bookingFile');
    const btn = document.getElementById('btnSubmitBooking');

    if (!plat || !merk) {
      App.toast('Harap isi plat nomor dan merk kendaraan.', 'warning');
      return;
    }
    if (!fileInput.files || fileInput.files.length === 0) {
      App.toast('Harap unggah bukti transfer.', 'warning');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Mengirim...';

    try {
      const file = fileInput.files[0];
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Ukuran file maks 5MB.');
      }

      const compressed = await Utils.compressImage(file);
      const user = Utils.getSession();
      const s = this.state;

      // Submit each spot as separate transaction
      for (const spotId of s.selectedSpots) {
        await API.post('createTransaction', {
          user_id: user.id,
          spot_id: spotId,
          plat_nomor: plat,
          merk_kendaraan: merk,
          bulan_sewa: s.duration,
          total_bayar: s.finalPrice / s.selectedSpots.length,
          file_base64: compressed.base64,
          file_mimeType: compressed.mimeType,
          file_name: `Bukti_${user.id}_${spotId}_${Date.now()}.${compressed.name.split('.').pop()}`
        });
      }

      // Show success
      document.getElementById('modalBody').innerHTML = `
        <div class="success-animation">
          <div class="success-icon">✅</div>
          <h3>Booking Berhasil!</h3>
          <p>Transaksi Anda sedang menunggu verifikasi admin.<br/>Anda akan dihubungi setelah pembayaran diverifikasi.</p>
          <button class="btn btn-primary mt-24" onclick="App.closeModal(); App.navigate('dashboard');">Lihat Dashboard</button>
        </div>
      `;
      API.clearCache();
    } catch (error) {
      App.toast('Gagal: ' + error.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Kirim & Selesai';
    }
  }
};