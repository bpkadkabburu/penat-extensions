document.addEventListener('DOMContentLoaded', async () => {
    const saved = await chrome.storage.sync.get(['localApiUrl', 'localToken']);

    if (saved.localApiUrl) document.getElementById('localApiUrl').value = saved.localApiUrl;
    if (saved.localToken) document.getElementById('localToken').value = saved.localToken;

    document.getElementById('save-btn').addEventListener('click', async () => {
        const data = {
            localApiUrl: document.getElementById('localApiUrl').value.trim().replace(/\/$/, ''),
            localToken: document.getElementById('localToken').value.trim(),
        };

        await chrome.storage.sync.set(data);

        const msg = document.getElementById('saved-msg');
        msg.textContent = '✓ Tersimpan';
        setTimeout(() => { msg.textContent = ''; }, 3000);
    });
});
