import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const errorParam = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  const sendResponse = (isSuccess: boolean, errorMessage?: string) => {
    const escapedErrorMessage = (errorMessage || 'An error occurred during authentication. You can close this window and try again.')
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\n/g, ' ');

    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ClixProCRM Authentication</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: #0b0f19;
        color: #f8fafc;
        padding: 20px;
      }
      .card {
        text-align: center;
        background: #111827;
        padding: 32px 28px;
        border-radius: 16px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
        max-width: 360px;
        width: 100%;
      }
      .icon-container {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
        background: ${!isSuccess ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'};
      }
      .spinner {
        width: 28px;
        height: 28px;
        border: 3px solid rgba(255, 255, 255, 0.1);
        border-top: 3px solid #10b981;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      .error-icon {
        color: #ef4444;
        font-size: 22px;
        font-weight: bold;
      }
      .success-icon {
        color: #10b981;
        font-size: 22px;
        font-weight: bold;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      h2 {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 6px;
        color: #f8fafc;
      }
      p {
        font-size: 13px;
        color: #94a3b8;
        line-height: 1.5;
      }
      .close-btn {
        display: inline-block;
        margin-top: 18px;
        padding: 8px 16px;
        background: #1f2937;
        color: #f8fafc;
        border: 1px solid #374151;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        text-decoration: none;
      }
      .close-btn:hover {
        background: #374151;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="icon-container">
        ${
          !isSuccess
            ? '<span class="error-icon">✕</span>'
            : '<div id="icon-spinner" class="spinner"></div><span id="icon-check" class="success-icon" style="display: none;">✓</span>'
        }
      </div>
      <h2>${!isSuccess ? 'Authentication Failed' : 'Authentication Successful'}</h2>
      <p id="status-text">${
        !isSuccess
          ? (errorMessage || 'An error occurred during authentication. You can close this window and try again.')
          : 'Completing sign in...'
      }</p>
      <button id="close-btn" class="close-btn" style="display: ${!isSuccess ? 'inline-block' : 'none'};" onclick="window.close()">Close Window</button>
    </div>
    <script>
      (function() {
        var isSuccess = ${isSuccess ? 'true' : 'false'};
        var messageType = isSuccess ? 'CLIXPROCRM_GOOGLE_AUTH_SUCCESS' : 'CLIXPROCRM_GOOGLE_AUTH_ERROR';
        var errorMsg = '${escapedErrorMessage}';
        var targetOrigin = window.location.origin;

        // 1. PostMessage to opener if available
        try {
          if (window.opener && window.opener !== window) {
            window.opener.postMessage({
              type: messageType,
              error: isSuccess ? undefined : errorMsg,
              target: '/dashboard'
            }, targetOrigin);
          }
        } catch (e) {}

        // 2. BroadcastChannel across same-origin tabs/windows
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            var channel = new BroadcastChannel('clixprocrm_google_auth_channel');
            channel.postMessage({
              type: messageType,
              error: isSuccess ? undefined : errorMsg,
              target: '/dashboard'
            });
            channel.close();
          }
        } catch (e) {}

        // 3. LocalStorage event fallback
        try {
          localStorage.setItem('clixprocrm_google_auth_event', JSON.stringify({
            type: messageType,
            error: isSuccess ? undefined : errorMsg,
            target: '/dashboard',
            timestamp: Date.now()
          }));
        } catch (e) {}

        // In OAuth popup mode, immediately attempt to close this popup window.
        // Never navigate the callback route to /dashboard. Application routing belongs to the parent window.
        try {
          window.close();
        } catch (e) {}

        // If window.close() is blocked or not executed immediately, update UI and provide manual close button
        setTimeout(function() {
          try {
            window.close();
          } catch (e) {}

          var statusEl = document.getElementById('status-text');
          var btnEl = document.getElementById('close-btn');
          var spinnerEl = document.getElementById('icon-spinner');
          var checkEl = document.getElementById('icon-check');

          if (spinnerEl) spinnerEl.style.display = 'none';
          if (checkEl) checkEl.style.display = 'inline';

          if (statusEl) {
            statusEl.innerText = isSuccess
              ? 'Authentication complete. You can close this window and return to ClixProCRM.'
              : errorMsg;
          }
          if (btnEl) {
            btnEl.style.display = 'inline-block';
          }
        }, 350);
      })();
    </script>
  </body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // Required for OAuth popup: ensures window.opener is not severed when the popup
        // lands on this callback URL after navigating through Google and Supabase (cross-origin).
        // This explicitly overrides any COOP policy that Vercel or Next.js may apply,
        // preserving the opener reference needed for postMessage and BroadcastChannel fallbacks.
        'Cross-Origin-Opener-Policy': 'unsafe-none',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    })
  }

  if (errorParam || errorDescription) {
    return sendResponse(false, errorDescription || errorParam || 'OAuth error')
  }
  
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Exchange code error:', error.message)
      return sendResponse(false, error.message)
    }

    return sendResponse(true)
  }

  return sendResponse(false, 'No authentication code received')
}

