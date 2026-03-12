/* ==========================================
   ADMIN MODULE
   ========================================== */

const Admin = {
  currentTab: 'pending',

  async load() {
    this.switchTab('pending');
  },

  switchTab(tab) {
    this.currentTab = tab;

    document.querySelectorAll('.admin-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });

    const container = document.getElementById('adminTabContent');
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Memuat...</p></div>';

    switch (tab) {
      case 'pending': this.loadPending(); break;
      case 'investor': this.loadInvestor(); break;
      case 'settings': this.loadSettings(); break;
    }
  },

  // --- Pending Transactions ---
  async loadPending() {
    const container = document.getElementById('adminTabContent');
    try {
      const pending = await API.post('getPendingTransactions', {});
      
      if (!pending || pending.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✅</div><h4>Tidak Ada Transaksi Pending</h4><p>Semua transaksi sudah diverifikasi.</p></div>';
        return;
      }

      let html = '';
      pending.forEach(trx => {
        html += `
          <div class="pending-card">
            <div class="pending-card-header">
              <strong style="font-size:1.1rem;">${trx.trx_id}</strong>
              ${Utils.statusBadge(trx.status)}
            </div>
            <div class="pending-details">
              <div class="detail-item"><span class="detail-label">User ID</span><span class="detail-value">${trx.user_id}</span></div>
              <div class="detail-item"><span class="detail-label">Slot</span><span class="detail-value">${trx.spot_id}</span></div>
              <div class="detail-item"><span class="detail-label">Kendaraan</span><span class="detail-value">${trx.merk_kendaraan} (${trx.plat_nomor})</span></div>
              <div class="detail-item"><span class="detail-label">Durasi</span><span class="detail-value">${trx.bulan_sewa} Bulan</span></div>
              <div class="detail-item"><span class="detail-label">Total Bayar</span><span class="detail-value" style="font-weight:700;color:var(--primary);">${Utils.formatCurrency(trx.total_bayar)}</span></div>
              <div class="detail-item"><span class="detail-label">Bukti</span><span class="detail-value">${trx.bukti_transfer_url ? `<a href="${trx.bukti_transfer_url}" target="_blank">Lihat Bukti →</a>` : '-'}</span></div>
            </div>
            <div class="pending-actions">
              <button class="btn btn-success btn-sm" onclick="Admin.verify('${trx.trx_id}', this)">✓ Verifikasi</button>
              <button class="btn btn-danger btn-sm" onclick="Admin.reject('${trx.trx_id}', this)">✗ Tolak</button>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    } catch (error) {
      container.innerHTML = `<div class="empty-state"><p style="color:var(--danger);">Error: ${error.message}</p></div>`;
    }
  },

  async verify(trxId, btn) {
    if (!confirm('Verifikasi transaksi ' + trxId + '?')) return;
    btn.disabled = true;
    btn.textContent = 'Proses...';
    try {
      await API.post('verifyTransaction', { trx_id: trxId });
      App.toast('Transaksi berhasil diverifikasi!', 'success');
      this.loadPending();
    } catch (error) {
      App.toast('Error: ' + error.message, 'error');
      btn.disabled = false;
      btn.textContent = '✓ Verifikasi';
    }
  },

  async reject(trxId, btn) {
    if (!confirm('Tolak dan hapus transaksi ' + trxId + '? Lahan akan dibebaskan.')) return;
    btn.disabled = true;
    btn.textContent = 'Proses...';
    try {
      await API.post('rejectTransaction', { trx_id: trxId });
      App.toast('Transaksi ditolak.', 'info');
      this.loadPending();
    } catch (error) {
      App.toast('Error: ' + error.message, 'error');
      btn.disabled = false;
      btn.textContent = '✗ Tolak';
    }
  },

  // --- Investor Returns ---
  async loadInvestor() {
    const container = document.getElementById('adminTabContent');
    try {
      const report = await API.get('getFinancialReport', false);
      const returns = report.pengeluaran_investor || [];
      const totalPaid = returns.reduce((sum, r) => sum + Number(r.nominal_dibayar), 0);
      const target = 41300000;
      const remaining = target - totalPaid;
      const pct = Math.min(100, Math.round((totalPaid / target) * 100));

      let html = `
        <div class="investor-target-card mb-24">
          <h4>Progres Pengembalian Investasi</h4>
          <div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:4px;">
            <span>Terbayar: <strong style="color:var(--success);">${Utils.formatCurrency(totalPaid)}</strong></span>
            <span>Target: <strong>${Utils.formatCurrency(target)}</strong></span>
          </div>
          <div class="progress-bar" style="height:12px;">
            <div class="progress-fill" style="width:${pct}%;"></div>
          </div>
          <div style="font-size:.8rem;color:var(--gray-400);margin-top:6px;">Sisa: ${Utils.formatCurrency(remaining)} (${pct}%)</div>
        </div>
        <h4 class="mb-16">Catat Cicilan Baru</h4>
        <div class="form-group">
          <label>Nominal Dibayar (Rp)</label>
          <input type="number" id="invNominal" class="input" placeholder="Contoh: 1000000" />
        </div>
        <div class="form-group">
          <label>Bukti Transfer (JPG/PNG/PDF)</label>
          <input type="file" id="invFile" class="input" accept="image/*,.pdf" />
        </div>
        <button class="btn btn-success" onclick="Admin.submitInvestor()" id="btnInvestor">Simpan Cicilan</button>
      `;

      if (returns.length > 0) {
        html += `<h4 style="margin-top:32px;" class="mb-16">Riwayat Cicilan</h4><div class="table-wrapper"><table><thead><tr><th>ID</th><th>Tanggal</th><th>Nominal</th><th>Bukti</th></tr></thead><tbody>`;
        returns.forEach(r => {
          html += `<tr><td>${r.return_id}</td><td>${Utils.formatDate(r.tanggal_bayar)}</td><td>${Utils.formatCurrency(r.nominal_dibayar)}</td><td><a href="${r.bukti_transfer_url}" target="_blank">Lihat</a></td></tr>`;
        });
        html += '</tbody></table></div>';
      }

      container.innerHTML = html;
    } catch (error) {
      container.innerHTML = `<div class="empty-state"><p style="color:var(--danger);">Error: ${error.message}</p></div>`;
    }
  },

  async submitInvestor() {
    const nominal = document.getElementById('invNominal').value;
    const fileInput = document.getElementById('invFile');
    const btn = document.getElementById('btnInvestor');

    if (!nominal || Number(nominal) <= 0) {
      App.toast('Masukkan nominal yang valid.', 'warning');
      return;
    }
    if (!fileInput.files || fileInput.files.length === 0) {
      App.toast('Harap unggah bukti transfer.', 'warning');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Menyimpan...';

    try {
      const compressed = await Utils.compressImage(fileInput.files[0]);
      await API.post('addInvestorReturn', {
        nominal_dibayar: Number(nominal),
        file_base64: compressed.base64,
        file_mimeType: compressed.mimeType,
        file_name: `Investor_${Date.now()}.${compressed.name.split('.').pop()}`
      });
      App.toast('Cicilan investor berhasil dicatat!', 'success');
      this.loadInvestor();
    } catch (error) {
      App.toast('Error: ' + error.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Simpan Cicilan';
    }
  },

  // --- Settings ---
  async loadSettings() {
    const container = document.getElementById('adminTabContent');
    try {
      const settings = await API.get('getAppSettings', false);
      const contacts = await API.get('getAdminContacts', false);

      let html = '<h4 class="mb-16">Pengaturan Aplikasi</h4>';
      html += '<p style="font-size:.85rem;color:var(--gray-500);margin-bottom:16px;">Untuk mengubah pengaturan, edit langsung di Google Sheets tab <strong>APP_SETTINGS</strong> dan <strong>ADMIN_CONTACTS</strong>.</p>';

      html += '<div class="settings-grid">';
      settings.forEach(s => {
        html += `
          <div class="setting-item">
            <span class="setting-key">${s.key}</span>
            <span style="font-weight:500;color:var(--gray-700);">${s.value}</span>
            <span class="setting-desc">${s.description || ''}</span>
          </div>
        `;
      });
      html += '</div>';

      html += '<h4 style="margin-top:32px;" class="mb-16">Kontak Admin WhatsApp</h4>';
      html += '<div class="settings-grid">';
      contacts.forEach(c => {
        html += `
          <div class="setting-item">
            <span class="setting-key">${c.blok}</span>
            <span style="font-weight:500;">${c.nama_admin}</span>
            <span class="setting-desc">${c.no_whatsapp}</span>
          </div>
        `;
      });
      html += '</div>';

      container.innerHTML = html;
    } catch (error) {
      container.innerHTML = `<div class="empty-state"><p style="color:var(--danger);">Error: ${error.message}</p></div>`;
    }
  }
};