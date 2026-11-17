
function getCSRFToken() {
    const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
    if (csrfInput) {
        return csrfInput.value;
    }

    const cookie = document.cookie
        .split(';')
        .find(item => item.trim().startsWith('csrftoken='));

    return cookie ? decodeURIComponent(cookie.split('=')[1]) : '';
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
}

function formatErrors(data) {
    if (typeof data === 'string') return data;

    if (data.message) return data.message;

    return Object.entries(data)
        .map(([field, messages]) => {
            const text = Array.isArray(messages)
                ? messages.join(' ')
                : String(messages);

            return `${field}: ${text}`;
        })
        .join('\n');
}

// LOGIN
const loginForm = document.getElementById('login-form');

if (loginForm) {
    loginForm.addEventListener('submit', async event => {
        event.preventDefault();

        const button = loginForm.querySelector('button[type="submit"]');
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        button.disabled = true;
        button.textContent = 'Logging in...';
        showError('login-error', '');

        try {
            const response = await fetch('/api/accounts/login/', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(formatErrors(data));
            }

            window.location.href = '/shop/';

        } catch (error) {
            showError('login-error', error.message);
            button.disabled = false;
            button.textContent = 'Login';
        }
    });
}

// REGISTRATION
const registerForm = document.getElementById('register-form');

if (registerForm) {
    registerForm.addEventListener('submit', async event => {
        event.preventDefault();

        const button = registerForm.querySelector('button[type="submit"]');

        const username = document.getElementById('reg-username').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const password2 = document.getElementById('reg-password2').value;

        showError('register-error', '');

        if (password !== password2) {
            showError('register-error', 'Passwords do not match.');
            return;
        }

        button.disabled = true;
        button.textContent = 'Creating account...';

        try {
            const response = await fetch('/api/accounts/register/', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    password2
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(formatErrors(data));
            }

            alert('Your Novora account has been created successfully!');
            window.location.href = '/login/';

        } catch (error) {
            showError('register-error', error.message);
            button.disabled = false;
            button.textContent = 'Create Account';
        }
    });
}
