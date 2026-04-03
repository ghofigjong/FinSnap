import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Delete Account — FinSnap',
  description: 'How to delete your FinSnap account and all associated data.',
};

export default function DeleteAccount() {
  const contactEmail = '1clickadventure@gmail.com';
  const appName = 'FinSnap';

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: '#f9fafb', color: '#111827' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>

          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <p style={{ color: '#6C63FF', fontWeight: 600, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              {appName}
            </p>
            <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 12px' }}>Delete Your Account</h1>
            <p style={{ color: '#6b7280', fontSize: 16, margin: 0, lineHeight: 1.6 }}>
              You can permanently delete your {appName} account and all associated data at any time.
              This page explains how to do it and what gets removed.
            </p>
          </div>

          {/* In-App Method (preferred) */}
          <div style={{ backgroundColor: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: 28, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ backgroundColor: '#6C63FF', color: '#fff', borderRadius: 999, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>✓</span>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Delete from the app (recommended)</h2>
            </div>
            <p style={{ color: '#6b7280', marginBottom: 20, marginTop: 0 }}>
              The fastest way to delete your account is directly inside the {appName} app:
            </p>
            <ol style={{ paddingLeft: 20, margin: 0, lineHeight: 2 }}>
              <li>Open the <strong>{appName}</strong> app on your device</li>
              <li>Tap the <strong>Profile</strong> tab (bottom right)</li>
              <li>Tap <strong>Privacy &amp; Security</strong></li>
              <li>Scroll down and tap <strong>&quot;Delete Account&quot;</strong></li>
              <li>Confirm the deletion when prompted</li>
            </ol>
            <div style={{ backgroundColor: '#fef3c7', borderRadius: 8, padding: '12px 16px', marginTop: 20, fontSize: 14, color: '#92400e' }}>
              ⚠️ This action is <strong>immediate and irreversible</strong>. You will be signed out and all your data will be permanently removed.
            </div>
          </div>

          {/* Email Method */}
          <div style={{ backgroundColor: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 12, padding: 28, marginBottom: 32 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700 }}>Request deletion by email</h2>
            <p style={{ color: '#6b7280', marginTop: 0, marginBottom: 16 }}>
              If you no longer have access to the app, email us and we will delete your account manually within <strong>7 business days</strong>.
            </p>
            <a
              href={`mailto:${contactEmail}?subject=Account%20Deletion%20Request&body=Please%20delete%20my%20FinSnap%20account%20associated%20with%20this%20email%20address.`}
              style={{ display: 'inline-block', backgroundColor: '#6C63FF', color: '#fff', padding: '12px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 15 }}
            >
              Email deletion request
            </a>
            <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 12, marginBottom: 0 }}>
              Sends to: {contactEmail}
            </p>
          </div>

          {/* What gets deleted */}
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>What gets deleted</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15, marginBottom: 32 }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', borderRadius: '8px 0 0 8px', fontWeight: 600 }}>Data type</th>
                <th style={{ textAlign: 'left', padding: '10px 14px' }}>Action</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', borderRadius: '0 8px 8px 0', fontWeight: 600 }}>Retention period</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Account (email, name)', 'Permanently deleted', 'Immediate'],
                ['Transactions', 'Permanently deleted', 'Immediate'],
                ['Budgets', 'Permanently deleted', 'Immediate'],
                ['Daily scan usage counters', 'Permanently deleted', 'Immediate'],
                ['Subscription / plan status', 'Permanently deleted', 'Immediate'],
                ['Receipt images', 'Never stored — processed in memory only', 'Not applicable'],
                ['Your own API keys', 'Stored on your device only — deleted when you uninstall the app', 'Not applicable'],
                ['Vercel request logs', 'Not personally identifiable, retained by Vercel per their policy', 'Up to 30 days'],
              ].map(([type, action, retention], i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{type}</td>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>{action}</td>
                  <td style={{ padding: '10px 14px', color: '#6b7280' }}>{retention}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* What is NOT deleted */}
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '16px 20px', marginBottom: 40 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: '#166534' }}>What is NOT deleted</h3>
            <p style={{ margin: 0, color: '#15803d', fontSize: 14, lineHeight: 1.6 }}>
              Google Play purchase receipts are managed by Google and are not deleted by us. If you purchased a Pro subscription, the billing record remains with Google Play per their policies.
            </p>
          </div>

          {/* Footer */}
          <p style={{ color: '#9ca3af', fontSize: 13, borderTop: '1px solid #e5e7eb', paddingTop: 24 }}>
            {appName} · Questions? Contact us at{' '}
            <a href={`mailto:${contactEmail}`} style={{ color: '#6C63FF' }}>{contactEmail}</a>
          </p>
        </div>
      </body>
    </html>
  );
}
