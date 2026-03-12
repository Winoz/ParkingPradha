/* ==========================================
   UTILITY FUNCTIONS
   ========================================== */

const Utils = {
  // Format currency
  formatCurrency(num) {
    if (!num && num !== 0) return 'Rp 0';
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  },

  // Format date
  formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  // Format date for month filter
  formatMonth(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toISOString().substring(0, 7); // YYYY-MM
  },

  // Generate star display
  renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += i <= rating ? '⭐' : '☆';
    }
    return stars;
  },

  // Mask phone number for privacy
  maskPhone(phone) {
    if (!phone) return '***';
    const str = String(phone);
    if (str.length < 6) return '***';
    return str.substring(0, 4) + '****' + str.substring(str.length - 3);
  },

  // Simple session storage
  getSession() {
    try {
      const data = sessionStorage.getItem('pradha_user');
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },

  setSession(user) {
    sessionStorage.setItem('pradha_user', JSON.stringify(user));
  },

  clearSession() {
    sessionStorage.removeItem('pradha_user');
  },

  // Calculate remaining days
  calculateRemainingDays(startDate, months) {
    if (!startDate || !months) return { remaining: 0, total: 0, percentage: 0 };
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + Number(months));
    const now = new Date();
    const total = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const remaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    const percentage = total > 0 ? Math.round((remaining / total) * 100) : 0;
    return { remaining, total, percentage, endDate: end };
  },

  // Compress image to Base64
  async compressImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = () => resolve({ base64: reader.result, mimeType: file.type, name: file.name });
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const base64 = canvas.toDataURL('image/jpeg', quality);
          resolve({ base64, mimeType: 'image/jpeg', name: file.name.replace(/\.[^.]+$/, '.jpg') });
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // Status badge HTML
  statusBadge(status) {
    const s = String(status).toLowerCase();
    let cls = 'pending';
    if (s === 'active' || s === 'terverifikasi') cls = 'active';
    else if (s === 'expired') cls = 'expired';
    else if (s === 'rejected') cls = 'rejected';
    return `<span class="status-badge ${cls}">${status}</span>`;
  },

  // Debounce
  debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }
};