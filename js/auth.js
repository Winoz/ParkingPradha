/* ==========================================
   AUTHENTICATION MODULE (LENGKAP)
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

  // ✅ FUNGSI LOGIN - PERBAIKAN LENGKAP
  async doLogin() {
    const phone = document.getElementById('loginPhone')?.value?.trim() || '';
    const password = document.getElementById('loginPassword')?.value?.trim() || '';

    if (!phone || !password) {
      App.toast('Nomor HP dan Password tidak boleh kosong', 'error');
      return;
    }

    const btnLogin = document.getElementById('btnLogin');
    const originalText = btnLogin.textContent;
    btnLogin.disabled = true;
    btnLogin.textContent = 'Memproses...';

    try {
      const response = await API.post('loginUser', {
        no_hp: phone,
        password: password
      });

      // Simpan session
      Utils.setSession(response.user);

      // Tampilkan sukses
      App.toast('Login berhasil! Selamat datang ' + response.user.nama, 'success');

      // Close modal
      App.closeModal();

      // Update navbar
      App.updateNavbar();

      // Redirect ke home
      App.navigate('home');

    } catch (error) {
      App.toast('❌ ' + error.message, 'error');
    } finally {
      btnLogin.disabled = false;
      btnLogin.textContent = originalText;
    }
  },

  // ✅ FUNGSI REGISTER - PERBAIKAN LENGKAP
  async doRegister() {
    const name = document.getElementById('regName')?.value?.trim() || '';
    const phone = document.getElementById('regPhone')?.value?.trim() || '';
    const blok = document.getElementById('regBlok')?.value?.trim() || '';
    const password = document.getElementById('regPassword')?.value?.trim() || '';

    // Validasi
    if (!name || !phone || !blok || !password) {
      App.toast('Semua field harus diisi', 'error');
      return;
    }

    if (password.length < 6) {
      App.toast('Password minimal 6 karakter', 'error');
      return;
    }

    if (!/^08\d{8,}$/.test(phone)) {
      App.toast('Format nomor HP harus diawali 08 dan minimal 10 digit', 'error');
      return;
    }

    const btnRegister = document.getElementById('btnRegister');
    const originalText = btnRegister.textContent;
    btnRegister.disabled = true;
    btnRegister.textContent = 'Mendaftar...';

    try {
      const response = await API.post('registerUser', {
        nama: name,
        no_hp: phone,
        blok_rumah: blok,
        password: password
      });

      App.toast('✅ Registrasi berhasil! Silakan login', 'success');

      // Close modal dan buka login
      App.closeModal();
      setTimeout(() => {
        Auth.showLoginModal();
      }, 500);

    } catch (error) {
      App.toast('❌ ' + error.message, 'error');
    } finally {
      btnRegister.disabled = false;
      btnRegister.textContent = originalText;
    }
  },

  // ✅ FUNGSI LOGOUT
  logout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      Utils.clearSession();
      App.updateNavbar();
      App.navigate('home');
      App.toast('Anda telah keluar', 'info');
    }
  },

  // Optional: Forgot Password (dummy function)
  forgotPassword() {
    App.toast('Hubungi admin untuk reset password', 'info');
  }
};
