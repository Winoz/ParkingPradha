/* ==========================================
   API COMMUNICATION LAYER
   ========================================== */

const API = {
  // ⚠️ GANTI URL INI dengan URL deployment Google Apps Script Anda
  BASE_URL: 'https://script.google.com/macros/s/AKfycbxOSTOm_RNjFMe2iymXTvQ-lB1iizUT1hB1nJXYq4346ai5AMOEh5dnxfKcn3Ayg0f3/exec,

  // Cache
  _cache: {},
  _cacheTimeout: 60000, // 1 minute

  async get(action, useCache = true) {
    const cacheKey = action;
    if (useCache && this._cache[cacheKey] && (Date.now() - this._cache[cacheKey].time < this._cacheTimeout)) {
      return this._cache[cacheKey].data;
    }

    try {
      const url = `${this.BASE_URL}?action=${encodeURIComponent(action)}`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.error) throw new Error(result.message);

      if (useCache) {
        this._cache[cacheKey] = { data: result.data, time: Date.now() };
      }
      return result.data;
    } catch (error) {
      console.error(`API GET Error [${action}]:`, error);
      throw error;
    }
  },

  async post(action, data) {
    try {
      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, data })
      });
      const result = await response.json();

      if (result.error) throw new Error(result.message);
      
      // Clear relevant caches
      this.clearCache();
      return result.data;
    } catch (error) {
      console.error(`API POST Error [${action}]:`, error);
      throw error;
    }
  },

  clearCache() {
    this._cache = {};
  }
};