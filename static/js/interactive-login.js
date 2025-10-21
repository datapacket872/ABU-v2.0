// interactive-login.js
(function(){
  async function getCsrf(){
    const res = await fetch('/api/csrf', {credentials:'same-origin'});
    if(!res.ok) return null;
    const j = await res.json();
    return j.csrf_token;
  }

  document.addEventListener('DOMContentLoaded', async function(){
    const form = document.getElementById('loginForm');
    const submit = document.getElementById('submitBtn') || form.querySelector('[type=submit]');
    const pwdToggle = document.querySelector('.pwd-toggle');
    const pwdInput = document.getElementById('password');

    // Fetch CSRF token and store locally for header usage
    const csrf = await getCsrf();

    if(pwdToggle && pwdInput){
      pwdToggle.addEventListener('click', () => {
        const isPwd = pwdInput.type === 'password';
        pwdInput.type = isPwd ? 'text' : 'password';
        pwdToggle.textContent = isPwd ? '🙈' : '👁';
      });
    }

    if(form){
      form.addEventListener('submit', async function(e){
        e.preventDefault();
        if(submit) submit.disabled = true;
        const fd = new FormData(form);
        const payload = {
          email: (fd.get('email')||'').toLowerCase().trim(),
          password: fd.get('password')||''
        };
        try{
          const res = await fetch('/api/login', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
              'Content-Type':'application/json',
              'X-CSRF-Token': csrf || ''
            },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if(res.ok && data.ok){
            // Login success: redirect to user-dashboard or show message
            window.location.href = '/user-dashboard.html';
            return;
          } else {
            // show an accessible error message
            const errEl = document.getElementById('loginError') || document.createElement('div');
            errEl.id = 'loginError';
            errEl.setAttribute('role','alert');
            errEl.textContent = data.error || 'Login failed';
            if(!document.getElementById('loginError')) form.prepend(errEl);
          }
        } catch(err){
          console.error(err);
          alert('Network error. Try again.');
        } finally {
          if(submit) submit.disabled = false;
        }
      });
    }
  });
})();
