/* ==========================================
   AUTHENTICATION MODULE
   ========================================== */

const Auth = {
  showLoginModal() {
    const html = `
      <h3>Masuk ke Akun</h3>
      <p class="modal-subtitle">Masukkan nomor HP dan password Anda.</p>
      <div id="loginForm">
        <div class="form-group">
          <label>Nomor HP</label>
          <input type="tel" id="loginPhone" class="input" placeholder="Contoh: 081234567890" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="loginPassword" class="input" placeholder="Masukkan password" />
        </div>
        <button class="btn btn-primary btn-block mt-16" onclick="Auth.doLogin()" id="btnLogin">Masuk</button>
        <div class="text-center mt-16" style="font-size:.85rem;">
          <span style="color:var(--gray-500);">Belum punya akun?</span>
          <a href="#" onclick="Auth.showRegisterModal(); return false;" style="font-weight:600;">Daftar di sini</a>
        </div>
        <div class="text-center mt-16" style="font-size:.8rem;">
          <a href="#" onclick="Auth.forgotPassword(); return false;" style="color:var(--gray-400);">Lupa Password?</a>
        </div>
      </div>
    `;
    App.openModal(html);
  },

  showRegisterModal() {
    const html = `
      <h3>Buat Akun Baru</h3>
      <p class="modal-subtitle">Lengkapi data diri Anda untuk mendaftar.</p>
      <div id="registerForm">
        <div class="form-group">
          <label>Nama Lengkap</label>
          <input type="text" id="regName" class="input" placeholder="Nama lengkap Anda" />
        </div>
        <div class="form-group">
          <label>Nomor HP</label>
          <input type="tel" id="regPhone" class="input" placeholder="Contoh: 081234567890" />
        </div>
        <div class="form-group">
          <label>Blok Rumah</label>
          <input type="text" id="regBlok" class="input" placeholder="Contoh: A-12" />
        </div>
        <div class="form-group">
          <label>Merk Kendaraan</label>
          <input type="text" id="regMerk" class="input" placeholder="Contoh: Toyota Avanza" />
        </div>
        <div class="form-group">
          <label>Plat Nomor</label>
          <input type="text" id="regPlat" class="input" placeholder="Contoh: D 1234 AB" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="regPassword" class="input" placeholder="Minimal 6 karakter" />
          <div class="hint">Password digunakan untuk login ke dashboard Anda.</div>
        </div>
        <button class="btn btn-primary btn-block mt-16" onclick="Auth.doRegister()" id="btnRegister">Daftar Sekarang</button>
        <div class="text-center mt-16" style="font-size:.85rem;">
          <span style="color:var(--gray-500);">Sudah punya akun?</span>
          <a href="#" onclick="Auth.showLoginModal(); return false;" style="font-weight:600;">Masuk di sini</a>
        </div>
      </div>
    `;
    App.openModal(html);
  },

  async doLogin() {
    const phone = document.getElementById('loginPhone').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('btnLogin');

    if (!phone || !password) {
      App.toast('Harap isi semua field.', 'warning');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Memproses...';

    try {
      const result = await API.post('loginUser', { no_hp: phone, password });
      Utils.setSession(result.user);
      App.closeModal();
      App.updateNavbar();
      App.toast('Login berhasil! Selamat datang, ' + result.user.nama, 'success');

      if (result.user.role === 'Admin') {
        App.navigate('admin');
      } else {
        App.navigate('dashboard');
      }
    } catch (error) {
      App.toast(error.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Masuk';
    }
  },

  async doRegister() {
    const nama = document.getElementById('regName').value.trim();
    const no_hp = document.getElementById('regPhone').value.trim();
    const blok_rumah = document.getElementById('regBlok').value.trim();
    const merk = document.getElementById('regMerk').value.trim();
    const plat = document.getElementById('regPlat').value.trim();
    const password = document.getElementById('regPassword').value;
    const btn = document.getElementById('btnRegister');

    if (!nama || !no_hp || !blok_rumah || !merk || !plat || !password) {
      App.toast('Harap isi semua field.', 'warning');
      return;
    }
    if (password.length < 6) {
      App.toast('Password minimal 6 karakter.', 'warning');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Mendaftar...';

    try {
      const result = await API.post('registerUser', {
        nama, no_hp, blok_rumah, password
      });

      App.toast(result.message, 'success');
      // Auto login after register
      const loginResult = await API.post('loginUser', { no_hp, password });
      Utils.setSession(loginResult.user);
      App.closeModal();
      App.updateNavbar();
      App.navigate('dashboard');
    } catch (error) {
      App.toast(error.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Daftar Sekarang';
    }
  },

  forgotPassword() {
    App.closeModal();
    // Default admin contact
    const msg = encodeURIComponent('Halo admin, saya lupa password akun parkir saya. Mohon bantuan untuk reset password.');
    window.open(`https://wa.me/6281320912117?text=${msg}`, '_blank');
  },

  logout() {
    Utils.clearSession();
    App.updateNavbar();
    App.navigate('home');
    App.toast('Anda telah keluar.', 'info');
  }
};