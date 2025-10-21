/* small progressive enhancement: loading state & password toggle */
document.addEventListener('DOMContentLoaded', function(){
  const form = document.getElementById('loginForm');
  const submit = document.getElementById('submitBtn');
  const pwdToggle = document.querySelector('.pwd-toggle');
  const pwdInput = document.getElementById('password');

  if(pwdToggle && pwdInput){
    pwdToggle.addEventListener('click', () => {
      const isPwd = pwdInput.type === 'password';
      pwdInput.type = isPwd ? 'text' : 'password';
      pwdToggle.textContent = isPwd ? '🙈' : '👁';
    });
  }

  if(form && submit){
    form.addEventListener('submit', function(e){
      e.preventDefault(); // simulate
      submit.classList.add('loading');
      const text = submit.querySelector('.btn-text') || submit;
      if(text) text.textContent = 'Signing in...';
      // simulate network
      setTimeout(()=> {
        submit.classList.remove('loading');
        if(text) text.textContent = 'Log in';
        // TODO: actually submit the form or redirect
      }, 1400);
    });
  }
});
