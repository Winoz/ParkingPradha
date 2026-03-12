/* ==========================================
   FINANCIAL REPORT MODULE
   ========================================== */

const Financial = {
  reportData: null,

  async loadReport() {
    const container = document.getElementById('financialContent');
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Memuat laporan...</p></div>';

    try {
      const data = await API.get('getFinancialReport', false);
      this.reportData = data;
      this.render(data);
    } catch (error) {
      container.innerHTML = `<div class="empty-state"><p style="color:var(--danger);">Gagal memuat: ${error.message}</p></div>`;
    }
  },

  render(data) {
    const filterFrom = document.getElementById('filterFrom').value;
    const filterTo = document.getElementById('filterTo').value;

    let income = data.pemasukan || [];
    let expenses = data.pengeluaran_investor || [];

    // Apply filters
    if (filterFrom) {
      income = income.filter(t => Utils.formatMonth(t.tanggal_transaksi || '') >= filterFrom);
      expenses = expenses.filter(t => Utils.formatMonth(t.tanggal_bayar || '') >= filterFrom);
    }
    if (filterTo) {
      income = income.filter(t => Utils.formatMonth(t.tanggal_transaksi || '') <= filterTo);
      expenses = expenses.filter(t => Utils.formatMonth(t.tanggal_bayar || '') <= filterTo);
    }

    const totalIncome = income.reduce((s, t) => s + Number(t.total_bayar), 0);
    const totalExpense = expenses.reduce((s, t) => s + Number(t.nominal_dibayar), 0);
    const balance = totalIncome - totalExpense;

    // Summary cards
    document.getElementById('finSummary').innerHTML = `
      <div class="fin-card">
        <h4>Total Pemasukan</h4>
        <div class="fin-value income">${Utils.formatCurrency(totalIncome)}</div>
      </div>
      <div class="fin-card">
        <h4>Cicilan Investor</h4>
        <div class="fin-value expense">${Utils.formatCurrency(totalExpense)}</div>
      </div>
      <div class="fin-card">
        <h4>Saldo Bersih</h4>
        <div class="fin-value balance">${Utils.formatCurrency(balance)}</div>
      </div>
    `;

    // Investor progress
    const allExpenses = (data.pengeluaran_investor || []);
    const totalPaidAll = allExpenses.reduce((s, r) => s + Number(r.nominal_dibayar), 0);
    const target = 41300000;
    const pct = Math.min(100, Math.round((totalPaidAll / target) * 100));

    document.getElementById('finInvestorProgress').innerHTML = `
      <div class="investor-target-card">
        <h4>Progres Pengembalian Investasi</h4>
        <div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:6px;">
          <span>Terbayar: <strong style="color:var(--success);">${Utils.formatCurrency(totalPaidAll)}</strong></span>
          <span>Target: <strong>${Utils.formatCurrency(target)}</strong></span>
        </div>
        <div class="progress-bar" style="height:12px;">
          <div class="progress-fill" style="width:${pct}%;"></div>
        </div>
        <div style="font-size:.8rem;color:var(--gray-400);margin-top:6px;">${pct}% tercapai</div>
      </div>
    `;

    // Income table
    let incomeRows = '';
    income.forEach(t => {
      incomeRows += `<tr>
        <td>${t.trx_id}</td>
        <td>${t.spot_id}</td>
        <td>${t.bulan_sewa} Bln</td>
        <td>${Utils.formatCurrency(t.total_bayar)}</td>
      </tr>`;
    });
    document.getElementById('finIncomeTable').innerHTML = income.length > 0 ? `
      <h4 class="mb-16" style="margin-top:16px;">Detail Pemasukan Parkir</h4>
      <table>
        <thead><tr><th>ID Transaksi</th><th>Slot</th><th>Durasi</th><th>Nominal</th></tr></thead>
        <tbody>${incomeRows}</tbody>
      </table>
    ` : '';

    // Expense table
    let expenseRows = '';
    expenses.forEach(t => {
      expenseRows += `<tr>
        <td>${t.return_id}</td>
        <td>${Utils.formatDate(t.tanggal_bayar)}</td>
        <td>${Utils.formatCurrency(t.nominal_dibayar)}</td>
      </tr>`;
    });
    document.getElementById('finExpenseTable').innerHTML = expenses.length > 0 ? `
      <h4 class="mb-16" style="margin-top:24px;">Detail Cicilan Investor</h4>
      <table>
        <thead><tr><th>ID</th><th>Tanggal</th><th>Nominal</th></tr></thead>
        <tbody>${expenseRows}</tbody>
      </table>
    ` : '';
  },

  downloadPDF() {
    if (!this.reportData) {
      App.toast('Harap muat laporan terlebih dahulu.', 'warning');
      return;
    }

    // Use jsPDF via CDN
    if (typeof window.jspdf === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => {
        const autoTable = document.createElement('script');
        autoTable.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
        autoTable.onload = () => this._generatePDF();
        document.head.appendChild(autoTable);
      };
      document.head.appendChild(script);
    } else {
      this._generatePDF();
    }
  },

  _generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Laporan Keuangan - Pradha Ciganitri Parking', 14, 20);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);

    const data = this.reportData;
    const income = data.pemasukan || [];
    const expenses = data.pengeluaran_investor || [];

    const totalIncome = income.reduce((s, t) => s + Number(t.total_bayar), 0);
    const totalExpense = expenses.reduce((s, t) => s + Number(t.nominal_dibayar), 0);

    doc.setFontSize(11);
    doc.text(`Total Pemasukan: ${Utils.formatCurrency(totalIncome)}`, 14, 38);
    doc.text(`Total Cicilan Investor: ${Utils.formatCurrency(totalExpense)}`, 14, 45);
    doc.text(`Saldo Bersih: ${Utils.formatCurrency(totalIncome - totalExpense)}`, 14, 52);

    let y = 62;

    if (income.length > 0) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Pemasukan Parkir', 14, y);
      doc.autoTable({
        startY: y + 4,
        head: [['ID', 'Slot', 'Durasi', 'Nominal']],
        body: income.map(t => [t.trx_id, t.spot_id, t.bulan_sewa + ' Bln', Utils.formatCurrency(t.total_bayar)]),
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 8 }
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    if (expenses.length > 0) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Cicilan Investor', 14, y);
      doc.autoTable({
        startY: y + 4,
        head: [['ID', 'Tanggal', 'Nominal']],
        body: expenses.map(t => [t.return_id, Utils.formatDate(t.tanggal_bayar), Utils.formatCurrency(t.nominal_dibayar)]),
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] },
        styles: { fontSize: 8 }
      });
    }

    doc.save(`Laporan_Keuangan_PradhaParkir_${new Date().toISOString().slice(0, 10)}.pdf`);
    App.toast('PDF berhasil diunduh!', 'success');
  }
};