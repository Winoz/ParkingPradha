/* ==========================================
   USER DASHBOARD MODULE
   ========================================== */

const Dashboard = {
  async load() {
    const user = Utils.getSession();
    if (!user) return;

    document.getElementById('dashUserName').textContent = user.nama;

    try {
      const transactions = await API.post('getUserTransactions', { user_id: user.id });
      this.renderActiveRentals(transactions);
      this.renderPaymentHistory(transactions);
    } catch (error) {
      App.toast('Gagal memuat data: ' + error.message, 'error');
    }
  },

  renderActiveRentals(transactions) {
    const container = document.getElementById('dashActiveRentals');
    const active = transactions.filter(t => t.status === 'Active');

    if (active.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🚗</div>
          <h4>Belum Ada Sewa Aktif</h4>
          <p>Mulai sewa parkir pertama Anda sekarang!</p>
          <button class="btn btn-primary mt-16" onclick="Booking.start()">Sewa Sekarang</button>
        </div>
      `;
      return;
    }

    let html = '';
    active.forEach(trx => {
      // Estimate start date from transaction creation (approximate)
      const remaining = Utils.calculateRemainingDays(trx.tanggal_transaksi || new Date().toISOString(), trx.bulan_sewa);
      const isLow = remaining.percentage < 25;

      html += `
        <div class="rental-card">
          <div class="rental-card-header">
            <div>
              <div class="rental-spot-id">${trx.spot_id}</div>
              ${Utils.statusBadge(trx.status)}
            </div>
          </div>
          <div class="rental-vehicle">
            <strong>${trx.merk_kendaraan}</strong> — ${trx.plat_nomor}
          </div>
          <div style="font-size:.85rem;color:var(--gray-500);">
            Durasi: ${trx.bulan_sewa} Bulan • ${Utils.formatCurrency(trx.total_bayar)}
          </div>
          <div class="progress-wrapper">
            <div class="progress-label">
              <span>Sisa Masa Sewa</span>
              <span>${remaining.percentage}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill ${isLow ? 'low' : ''}" style="width:${remaining.percentage}%"></div>
            </div>
            <div class="progress-days">${remaining.remaining} hari tersisa</div>
          </div>
          <div class="rental-actions">
            <button class="btn btn-primary btn-sm" onclick="Dashboard.extend('${trx.spot_id}')">Perpanjang</button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  renderPaymentHistory(transactions) {
    const container = document.getElementById('dashPaymentHistory');

    if (transactions.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>Belum ada histori pembayaran.</p></div>';
      return;
    }

    let rows = '';
    transactions.forEach(trx => {
      rows += `<tr>
        <td style="font-weight:600;">${trx.trx_id}</td>
        <td>${trx.spot_id}</td>
        <td>${trx.bulan_sewa} Bln</td>
        <td>${Utils.formatCurrency(trx.total_bayar)}</td>
        <td>${Utils.statusBadge(trx.status)}</td>
        <td>${trx.bukti_transfer_url && trx.bukti_transfer_url !== 'File Deleted' ? `<a href="${trx.bukti_transfer_url}" target="_blank" style="font-size:.8rem;">Lihat</a>` : '-'}</td>
      </tr>`;
    });

    container.innerHTML = `
      <table>
        <thead>
          <tr><th>ID Transaksi</th><th>Slot</th><th>Durasi</th><th>Nominal</th><th>Status</th><th>Bukti</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  },

  extend(spotId) {
    Booking.reset();
    Booking.state.selectedSpots = [spotId];
    Booking.state.step = 1;
    Booking.start();
  }
};