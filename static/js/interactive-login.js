// interactive-login.js (progressive enhancement for login)
(function(){
  const STORAGE_KEY_EMAIL = 'abu.rememberEmail';

  async function fetchCsrfToken(){
    try {
      const response = await fetch('/api/csrf', { credentials: 'same-origin' });
      if (!response.ok) return null;
      const json = await response.json();
      return json.csrf_token;
    } catch {
      return null;
    }
  }

  function setLoading(button, isLoading){
    if(!button) return;
    button.classList.toggle('is-loading', !!isLoading);
    button.disabled = !!isLoading;
    const label = button.querySelector('.btn-text') || button;
    if(isLoading) {
      if(label) label.textContent = 'Signing in...';
    } else {
      if(label) label.textContent = 'Log in';
    }
  }

  function showGlobalError(message){
    let errorEl = document.getElementById('loginError');
    if(!errorEl){
      errorEl = document.createElement('div');
      errorEl.id = 'loginError';
      errorEl.setAttribute('role', 'alert');
      errorEl.setAttribute('aria-live', 'assertive');
      errorEl.className = 'alert';
      const form = document.getElementById('loginForm');
      if(form) form.prepend(errorEl);
    }
    errorEl.hidden = false;
    errorEl.textContent = message || 'Login failed';
  }

  function clearGlobalError(){
    const errorEl = document.getElementById('loginError');
    if(errorEl){
      errorEl.hidden = true;
      errorEl.textContent = '';
    }
  }

  function setFieldInvalid(input, message){
    if(!input) return;
    input.setAttribute('aria-invalid', 'true');
    let msg = input.nextElementSibling && input.nextElementSibling.classList && input.nextElementSibling.classList.contains('field-error')
      ? input.nextElementSibling
      : null;
    if(!msg){
      msg = document.createElement('div');
      msg.className = 'field-error';
      input.parentNode.insertBefore(msg, input.nextSibling);
    }
    msg.textContent = message;
  }

  function clearFieldInvalid(input){
    if(!input) return;
    input.removeAttribute('aria-invalid');
    const msg = input.nextElementSibling && input.nextElementSibling.classList && input.nextElementSibling.classList.contains('field-error')
      ? input.nextElementSibling
      : null;
    if(msg){
      msg.textContent = '';
    }
  }

  function isValidEmail(value){
    // Simple RFC5322-lite check
    return /.+@.+\..+/.test(value);
  }

  document.addEventListener('DOMContentLoaded', async function(){
    const form = document.getElementById('loginForm');
    const submitButton = document.getElementById('submitBtn') || (form && form.querySelector('[type=submit]'));
    const passwordToggle = document.querySelector('.pwd-toggle');
    const passwordInput = document.getElementById('password');
    const emailInput = document.getElementById('email');
    const rememberCheckbox = document.querySelector('input[name="remember"]');
    const capsHint = document.getElementById('capsHint');

    const csrfToken = await fetchCsrfToken();

    // Restore remembered email
    try {
      const savedEmail = localStorage.getItem(STORAGE_KEY_EMAIL);
      if(savedEmail && emailInput){
        emailInput.value = savedEmail;
        if(rememberCheckbox) rememberCheckbox.checked = true;
      }
    } catch {}

    // Password visibility toggle
    if(passwordToggle && passwordInput){
      passwordToggle.addEventListener('click', () => {
        const isPasswordType = passwordInput.type === 'password';
        passwordInput.type = isPasswordType ? 'text' : 'password';
        passwordToggle.textContent = isPasswordType ? '🙈' : '👁';
      });
    }

    // Caps Lock detection hint
    if(passwordInput && capsHint){
      const updateCaps = (ev) => {
        const on = ev.getModifierState && ev.getModifierState('CapsLock');
        capsHint.hidden = !on;
      };
      passwordInput.addEventListener('keydown', updateCaps);
      passwordInput.addEventListener('keyup', updateCaps);
      passwordInput.addEventListener('blur', () => { capsHint.hidden = true; });
    }

    // Real-time validation
    if(emailInput){
      emailInput.addEventListener('input', () => {
        const value = emailInput.value.trim().toLowerCase();
        if(value && !isValidEmail(value)){
          setFieldInvalid(emailInput, 'Enter a valid email');
        } else {
          clearFieldInvalid(emailInput);
        }
      });
    }
    if(passwordInput){
      passwordInput.addEventListener('input', () => {
        const value = passwordInput.value;
        if(value && value.length < 8){
          setFieldInvalid(passwordInput, 'Password must be at least 8 characters');
        } else {
          clearFieldInvalid(passwordInput);
        }
      });
    }

    if(form){
      form.addEventListener('submit', async function(e){
        e.preventDefault();
        clearGlobalError();

        const formData = new FormData(form);
        const email = (formData.get('email') || '').toString().toLowerCase().trim();
        const password = (formData.get('password') || '').toString();

        // Client-side validation
        let firstInvalid = null;
        if(!email || !isValidEmail(email)){
          setFieldInvalid(emailInput, !email ? 'Email is required' : 'Enter a valid email');
          firstInvalid = firstInvalid || emailInput;
        }
        if(!password || password.length < 8){
          setFieldInvalid(passwordInput, !password ? 'Password is required' : 'Password must be at least 8 characters');
          firstInvalid = firstInvalid || passwordInput;
        }
        if(firstInvalid){
          firstInvalid.focus();
          return;
        }

        setLoading(submitButton, true);

        try {
          const response = await fetch('/api/login', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken || ''
            },
            body: JSON.stringify({ email, password })
          });

          const data = await response.json().catch(() => ({}));

          if(response.ok && (data.ok || data.message === 'Login successful')){
            try {
              if(rememberCheckbox && rememberCheckbox.checked){
                localStorage.setItem(STORAGE_KEY_EMAIL, email);
              } else {
                localStorage.removeItem(STORAGE_KEY_EMAIL);
              }
            } catch {}
            window.location.href = '/user-dashboard.html';
            return;
          }

          const serverError = data && (data.error || data.message);
          let message = 'Login failed. Please try again.';
          if(serverError === 'invalid_credentials') message = 'Incorrect email or password.';
          else if(serverError === 'missing_fields') message = 'Please fill out all fields.';
          else if(serverError === 'invalid_csrf') message = 'Something went wrong. Refresh and try again.';
          showGlobalError(message);
        } catch (err){
          showGlobalError('Network error. Check your connection and try again.');
        } finally {
          setLoading(submitButton, false);
        }
      });
    }
  });
})();
