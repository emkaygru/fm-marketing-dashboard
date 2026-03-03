'use client';

import { useState, useEffect } from 'react';

export default function MetaTokenPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shortToken, setShortToken] = useState('');
  const [exchangeResult, setExchangeResult] = useState<any>(null);
  const [exchanging, setExchanging] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/admin/meta-token')
      .then(r => r.json())
      .then(d => { setStatus(d); setLoading(false); });
  }, []);

  const exchange = async () => {
    setExchanging(true);
    setExchangeResult(null);
    const res = await fetch('/api/admin/meta-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shortLivedToken: shortToken.trim() }),
    });
    const data = await res.json();
    setExchangeResult(data);
    setExchanging(false);
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pageCheckOk = status?.pageCheck && !status.pageCheck.error && !status.pageCheck.fetchError;
  const pageCheckError = status?.pageCheck?.error;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meta Token Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Diagnose and refresh your Meta API access token</p>
        </div>

        {/* Current token status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Current Token Status</h2>

          {loading ? (
            <p className="text-gray-500 text-sm">Checking token...</p>
          ) : (
            <div className="space-y-4">
              {/* Env var checklist */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'META_ACCESS_TOKEN', val: status?.env?.hasToken },
                  { label: 'FACEBOOK_PAGE_ID', val: status?.env?.hasPageId },
                  { label: 'META_APP_ID', val: status?.env?.hasAppId },
                  { label: 'META_APP_SECRET', val: status?.env?.hasAppSecret },
                ].map(({ label, val }) => (
                  <div key={label} className="flex items-center gap-2 text-sm">
                    <span className={`font-bold ${val ? 'text-green-600' : 'text-red-500'}`}>{val ? '✓' : '✗'}</span>
                    <code className="text-xs bg-gray-100 px-1 rounded">{label}</code>
                    <span className="text-gray-500">{val ? 'set' : 'missing'}</span>
                  </div>
                ))}
              </div>

              {status?.env?.tokenPrefix && (
                <p className="text-xs text-gray-500">Token starts with: <code className="bg-gray-100 px-1 rounded">{status.env.tokenPrefix}</code> ({status.env.tokenLength} chars)</p>
              )}

              {/* Live token test result */}
              {status?.pageCheck && (
                <div className={`rounded-lg p-4 text-sm border ${pageCheckOk ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  {pageCheckOk ? (
                    <>
                      <p className="font-semibold text-green-700 text-base">✓ Token is working</p>
                      <p className="text-green-700 mt-1">Page: <strong>{status.pageCheck.pageName}</strong></p>
                      {status.pageCheck.instagramAccountId
                        ? <p className="text-green-700">Instagram account linked: {status.pageCheck.instagramAccountId}</p>
                        : <p className="text-amber-700 mt-1">⚠ No Instagram account linked to this page</p>
                      }
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-red-700 text-base">✗ Token rejected by Meta</p>
                      <p className="text-red-600 mt-1">{pageCheckError?.message || status.pageCheck.fetchError}</p>
                      {pageCheckError?.code && (
                        <p className="text-red-500 text-xs mt-1">
                          Error code: {pageCheckError.code} · Type: {pageCheckError.type}
                          {pageCheckError.code === 190 && ' → Token is expired or invalid'}
                          {pageCheckError.code === 200 && ' → Missing permissions'}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Debug token details (requires app credentials) */}
              {status?.debugToken && (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-sm space-y-1">
                  <p className="font-semibold text-gray-700 mb-2">Token details (from debug_token API)</p>
                  {status.debugToken.error ? (
                    <p className="text-red-600">{status.debugToken.error.message || JSON.stringify(status.debugToken.error)}</p>
                  ) : (
                    <>
                      <p><span className="text-gray-500 w-28 inline-block">Valid:</span> <span className={status.debugToken.isValid ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{status.debugToken.isValid ? 'Yes' : 'No'}</span></p>
                      <p><span className="text-gray-500 w-28 inline-block">Type:</span> {status.debugToken.type || '—'}</p>
                      <p><span className="text-gray-500 w-28 inline-block">Expires:</span> <span className={status.debugToken.expiresAtRaw === 0 ? 'text-green-600 font-medium' : 'text-amber-600'}>{status.debugToken.expiresAt || '—'}</span></p>
                      <p><span className="text-gray-500 w-28 inline-block">Scopes:</span> {status.debugToken.scopes?.join(', ') || 'none'}</p>
                    </>
                  )}
                </div>
              )}

              {!status?.env?.hasAppId && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                  Add <code className="bg-amber-100 px-1 rounded">META_APP_ID</code> + <code className="bg-amber-100 px-1 rounded">META_APP_SECRET</code> to Vercel env vars to see full token expiry and type info.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Token Exchange */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Generate a Never-Expiring Page Token</h2>
          <p className="text-sm text-gray-500 mb-4">Page tokens derived from long-lived user tokens do not expire.</p>

          <ol className="text-sm text-gray-700 space-y-2 mb-5 list-decimal list-inside bg-gray-50 rounded-lg p-4">
            <li>Open <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Meta Graph API Explorer</a></li>
            <li>Select your <strong>app</strong> from the dropdown (top right)</li>
            <li>Click <strong>"Generate Access Token"</strong> — select your Page and grant permissions:<br />
              <code className="text-xs bg-gray-100 px-1 rounded mt-1 block">pages_show_list, pages_read_engagement, instagram_basic, instagram_manage_insights, read_insights</code>
            </li>
            <li>Copy the short-lived token that appears and paste it below</li>
            <li>We'll exchange it automatically for a never-expiring Page token</li>
          </ol>

          {!status?.env?.hasAppId && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 mb-4">
              <strong>Required:</strong> Add <code className="bg-amber-100 px-0.5 rounded">META_APP_ID</code> and <code className="bg-amber-100 px-0.5 rounded">META_APP_SECRET</code> to Vercel env vars first, then redeploy — these are needed to do the token exchange securely on the server.
            </div>
          )}

          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows={3}
            placeholder="Paste short-lived user access token from Graph API Explorer..."
            value={shortToken}
            onChange={e => setShortToken(e.target.value)}
          />
          <button
            onClick={exchange}
            disabled={!shortToken.trim() || exchanging || !status?.env?.hasAppId || !status?.env?.hasPageId}
            className="mt-3 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {exchanging ? 'Exchanging...' : 'Exchange → Get Page Token'}
          </button>

          {exchangeResult && (
            <div className={`mt-4 rounded-lg p-4 text-sm border ${exchangeResult.error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              {exchangeResult.error ? (
                <>
                  <p className="font-semibold text-red-700">{exchangeResult.error}</p>
                  {exchangeResult.detail && (
                    <p className="text-red-600 mt-1 text-xs">{JSON.stringify(exchangeResult.detail)}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-semibold text-green-700 text-base mb-2">✓ Success! Page: {exchangeResult.pageName}</p>
                  <p className="text-green-700 text-xs mb-2">This token never expires. Copy it below:</p>
                  <div className="bg-white border border-green-300 rounded p-3 font-mono text-xs break-all select-all mb-3">
                    {exchangeResult.pageToken}
                  </div>
                  <button
                    onClick={() => copyToken(exchangeResult.pageToken)}
                    className="px-4 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                  >
                    {copied ? 'Copied!' : 'Copy Token'}
                  </button>
                  <div className="mt-3 bg-green-100 rounded p-3 text-green-800 text-xs">
                    <strong>Next steps:</strong>
                    <ol className="list-decimal list-inside mt-1 space-y-0.5">
                      <li>Go to Vercel → your project → Settings → Environment Variables</li>
                      <li>Update <code className="bg-green-200 px-0.5 rounded">META_ACCESS_TOKEN</code> with the token above</li>
                      <li>Click Save, then trigger a Redeploy</li>
                    </ol>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
