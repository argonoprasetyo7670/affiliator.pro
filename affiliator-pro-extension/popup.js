// Popup Script - Affiliator Pro
// Displays captured token and allows copy

const statusEl = document.getElementById('status');
const tokenContainer = document.getElementById('token-container');
const tokenBox = document.getElementById('token-box');
const copyBtn = document.getElementById('copy-btn');
const refreshBtn = document.getElementById('refresh-btn');
const timeEl = document.getElementById('time');

let currentToken = null;

// Load token on popup open
document.addEventListener('DOMContentLoaded', loadToken);

// Refresh button
refreshBtn.addEventListener('click', loadToken);

// Copy button
copyBtn.addEventListener('click', async () => {
    if (currentToken) {
        try {
            await navigator.clipboard.writeText(currentToken);
            copyBtn.textContent = '✅ Copied!';
            setTimeout(() => {
                copyBtn.textContent = '📋 Copy Token';
            }, 2000);
        } catch (e) {
            // Fallback for clipboard API failure
            const ta = document.createElement('textarea');
            ta.value = currentToken;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            copyBtn.textContent = '✅ Copied!';
            setTimeout(() => {
                copyBtn.textContent = '📋 Copy Token';
            }, 2000);
        }
    }
});

// Load token from labs.google tab
async function loadToken() {
    try {
        const tabs = await chrome.tabs.query({ url: 'https://labs.google/*' });

        if (tabs.length === 0) {
            showWaiting('Buka labs.google dulu...');
            return;
        }

        // Execute script to get token from localStorage
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            world: 'MAIN',
            func: () => {
                return {
                    token: localStorage.getItem('affiliator_pro_captured_token'),
                    capturedAt: localStorage.getItem('affiliator_pro_captured_at')
                };
            }
        });

        if (results && results[0] && results[0].result) {
            const { token, capturedAt } = results[0].result;

            if (token) {
                showCaptured(token, capturedAt);
            } else {
                showWaiting('Generate video di labs.google...');
            }
        } else {
            showWaiting('Generate video di labs.google...');
        }

    } catch (e) {
        console.error('Error loading token:', e);
        showWaiting('Buka labs.google dulu...');
    }
}

function showCaptured(token, capturedAt) {
    currentToken = token;

    statusEl.className = 'status captured';
    statusEl.innerHTML = `
        <div class="status-icon">✅</div>
        <div class="status-text">Token Tersimpan!</div>
    `;

    tokenContainer.style.display = 'block';
    tokenBox.textContent = token;

    if (capturedAt) {
        const date = new Date(capturedAt);
        const now = new Date();
        const diffMin = Math.floor((now - date) / 60000);

        if (diffMin < 1) {
            timeEl.textContent = 'Baru saja';
        } else if (diffMin < 60) {
            timeEl.textContent = `${diffMin} menit lalu`;
        } else {
            timeEl.textContent = date.toLocaleTimeString('id-ID');
        }
    }
}

function showWaiting(message) {
    currentToken = null;

    statusEl.className = 'status waiting';
    statusEl.innerHTML = `
        <div class="status-icon">⏳</div>
        <div class="status-text">${message}</div>
    `;

    tokenContainer.style.display = 'none';
}
