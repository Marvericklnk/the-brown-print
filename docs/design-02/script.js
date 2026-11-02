const signupForm = document.querySelector("#signup-form");
const fullName = document.querySelector("#full-name");
const email = document.querySelector("#email");
const message = document.querySelector("#message");

function showError(error) {
    message.textContent = error;

    const previous = document.querySelector('.toast-feedback');
    if (previous) previous.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-feedback';
    toast.textContent = error;
    document.body.append(toast);
    setTimeout(() => toast.remove(), 5000);
}

signupForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const nameValue = fullName.value.trim();
    const emailValue = email.value.trim();

    message.textContent = "";

    if (nameValue === "") {
        showError("Please enter your full name.");
        fullName.focus();
        return;
    }

    // if (nameValue.length < 4) {
    //     showError("Please enter full name.");
    //     return;
    // }

    // if (noSpace) {
    //     showError("Please eneter full name");
    //     return;
    // }

    if (nameValue.length > 100) {
        showError("Your name is too long.");
        return;
    }

    if (emailValue === "") {
        showError("Please enter your email address.");
        return;
    }

    if (
        emailValue.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)
    ) {
        showError("Please enter a valid email address.");
        email.focus();
        return;
    }

    const joinButton = signupForm.querySelector("button");

    joinButton.disabled = true;
    joinButton.textContent = "Joining...";

    try {
        window.location.href = "thanks.html";

    } catch (error) {
        console.error(error);

        showError(
            "Could not connect. Please check that the server is running."
        );

    } finally {
        joinButton.disabled = false;
        joinButton.textContent = "Join The Brown Print →";
    }
});