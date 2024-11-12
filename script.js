document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('create-account-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
});

function handleFormSubmit(event) {
    event.preventDefault();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match. Please try again.');
        return;
    }

    alert('Account created successfully! Redirecting to the login page.');
    window.location.href = '/';
}
