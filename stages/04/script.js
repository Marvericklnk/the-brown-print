const form = document.querySelector('#signup-form');
const notice = document.createElement('p');
notice.textContent = 'Portfolio demo — use sample details only. Nothing is saved or sent.';
notice.style.cssText = 'font-size:12px;padding:12px;background:#eee7dc;color:#35251e';
form.prepend(notice);
form.addEventListener('submit', function(event) {
 event.preventDefault();
 const name = document.querySelector('#full-name');
 const email = document.querySelector('#email');
 const message = document.querySelector('#message');
 name.removeAttribute('aria-invalid'); email.removeAttribute('aria-invalid');
 if (!name.value.trim()) { message.textContent = 'Please enter your full name.'; name.setAttribute('aria-invalid','true'); name.focus(); return; }
 if (!email.value.trim() || !email.validity.valid || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { message.textContent = 'Please enter a valid email address.'; email.setAttribute('aria-invalid','true'); email.focus(); return; }
 window.location.href = 'thanks.html';
});
