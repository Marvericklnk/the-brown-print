const signupForm = document.querySelector("#signup-form");
const fullName = document.querySelector("#full-name");
const email = document.querySelector("#email");
const message = document.querySelector("#message");

if (signupForm) {
  signupForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    fullName.removeAttribute("aria-invalid");
    email.removeAttribute("aria-invalid");
    const nameValue = fullName.value.trim();
    const emailValue = email.value.trim();
    if (!nameValue) {
      message.textContent = "Please enter your full name.";
      fullName.setAttribute("aria-invalid", "true");
      fullName.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue) || !email.validity.valid) {
      message.textContent = "Please enter a valid email address.";
      email.setAttribute("aria-invalid", "true");
      email.focus();
      return;
    }
    const joinButton = signupForm.querySelector("button");
    joinButton.disabled = true;
    joinButton.textContent = "Joining…";
    message.textContent = "";
    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: nameValue, email: emailValue })
      });
      const result = await response.json();
      if (!response.ok) {
        message.textContent = result.message || "Could not sign up. Please try again.";
        return;
      }
      window.location.href = "thanks.html";
    } catch (error) {
      message.textContent = "Could not connect. Please try again shortly.";
    } finally {
      joinButton.disabled = false;
      joinButton.innerHTML = 'Join The Brown Print <span aria-hidden="true">↗</span>';
    }
  });
}
