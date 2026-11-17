
function getCookie(name) {
    const cookies = document.cookie ? document.cookie.split(';') : [];

    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(name + '=')) {
            return decodeURIComponent(cookie.substring(name.length + 1));
        }
    }
    return null;
}

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');

    if (!logoutButton) return;

    logoutButton.addEventListener('click', async () => {
        logoutButton.disabled = true;
        logoutButton.textContent = 'Logging out...';

        try {
            const response = await fetch('/api/accounts/logout/', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                }
            });

            if (!response.ok) {
                throw new Error('Logout failed');
            }

            window.location.href = '/shop/';
        } catch (error) {
            alert('Could not log out. Please try again.');
            logoutButton.disabled = false;
            logoutButton.textContent = 'Logout';
        }
    });
});
