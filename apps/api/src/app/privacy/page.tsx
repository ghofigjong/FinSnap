import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — FinSnap',
  description: 'Privacy Policy for the FinSnap expense tracking application.',
};

export default function PrivacyPolicy() {
  const lastUpdated = 'April 3, 2026';
  const contactEmail = '1clickadventure@gmail.com';
  const appName = 'FinSnap';

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: '#f9fafb', color: '#111827' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>Privacy Policy</h1>
          <p style={{ color: '#6b7280', marginTop: 0, marginBottom: 40 }}>Last updated: {lastUpdated}</p>

          <Section title="1. Introduction">
            <p>
              Welcome to {appName} (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We are committed to protecting your personal
              information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard
              information when you use our mobile application and related services (collectively, the &quot;Service&quot;).
            </p>
            <p>
              By using {appName}, you agree to the collection and use of information in accordance with this policy.
              If you disagree with any part of this policy, please discontinue use of the Service.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <SubHeading>2.1 Account Information</SubHeading>
            <p>When you register, we collect your name and email address to create and manage your account.</p>

            <SubHeading>2.2 Transaction Data</SubHeading>
            <p>
              Financial transactions you manually enter or extract via scanning (amounts, dates, descriptions,
              merchant names, categories) are stored in our database to provide the core functionality of the app.
            </p>

            <SubHeading>2.3 Images</SubHeading>
            <p>
              When you use the AI scanning feature, the image you capture or upload is sent to our API server
              and forwarded to Google Gemini for text extraction. Images are <strong>not stored</strong> — they
              are processed in memory and discarded immediately after the scan completes.
            </p>

            <SubHeading>2.4 Usage Data</SubHeading>
            <p>
              We track the number of AI scans performed per day per user for the purpose of enforcing daily
              usage limits on the free plan. Only the count and date are stored — not the content of scans.
            </p>

            <SubHeading>2.5 API Keys (Your Own)</SubHeading>
            <p>
              If you choose to use your own Gemini API key, it is stored <strong>exclusively on your device</strong>
              using secure encrypted storage (Expo SecureStore). Your API key is never transmitted to or stored
              on our servers.
            </p>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul>
              <li>To provide, operate, and maintain the Service</li>
              <li>To authenticate you and secure your account</li>
              <li>To store and display your transaction and budget data</li>
              <li>To enforce daily scan limits based on your plan</li>
              <li>To process AI-powered receipt and statement scanning</li>
              <li>To respond to support requests</li>
              <li>To improve the Service based on usage patterns (aggregate, anonymised data only)</li>
            </ul>
          </Section>

          <Section title="4. Third-Party Services">
            <SubHeading>4.1 Supabase</SubHeading>
            <p>
              We use Supabase (PostgreSQL) to store your account, transaction, and budget data. Supabase is
              SOC 2 Type II certified and GDPR compliant. Data is stored in secure cloud infrastructure.
              See <a href="https://supabase.com/privacy" style={linkStyle}>Supabase Privacy Policy</a>.
            </p>

            <SubHeading>4.2 Google Gemini API</SubHeading>
            <p>
              When using the FinSnap AI or your own Gemini key, receipt images are sent to Google&apos;s
              Gemini API for processing. Google&apos;s data use is governed by their API terms of service.
              Images are not retained by Google for model training when accessed via API.
              See <a href="https://policies.google.com/privacy" style={linkStyle}>Google Privacy Policy</a>.
            </p>

            <SubHeading>4.3 RevenueCat (Subscriptions)</SubHeading>
            <p>
              Subscription purchases for FinSnap Pro are processed through Google Play Billing and managed
              via RevenueCat. We do not store or process your payment details.
              See <a href="https://www.revenuecat.com/privacy" style={linkStyle}>RevenueCat Privacy Policy</a>.
            </p>

            <SubHeading>4.4 Vercel</SubHeading>
            <p>
              Our API is hosted on Vercel. Request logs may be retained by Vercel for a limited period for
              operational purposes. See <a href="https://vercel.com/legal/privacy-policy" style={linkStyle}>Vercel Privacy Policy</a>.
            </p>
          </Section>

          <Section title="5. Data Retention">
            <p>
              We retain your account and transaction data for as long as your account is active. You may
              delete all your transaction data or your entire account at any time from the app via
              <strong> Profile → Privacy &amp; Security</strong>. Deletion is permanent and irreversible.
            </p>
          </Section>

          <Section title="6. Data Security">
            <p>
              We implement appropriate technical and organisational measures to protect your data, including:
            </p>
            <ul>
              <li>All data in transit is encrypted via HTTPS/TLS</li>
              <li>Database access is protected by Row Level Security (RLS) — users can only access their own data</li>
              <li>API keys you provide are stored in device-level encrypted storage and never leave your device</li>
              <li>Authentication tokens are short-lived and managed by Supabase Auth</li>
            </ul>
            <p>
              No method of transmission over the internet or electronic storage is 100% secure. While we strive
              to use commercially acceptable means to protect your data, we cannot guarantee absolute security.
            </p>
          </Section>

          <Section title="7. Children's Privacy">
            <p>
              {appName} is not directed at children under the age of 13. We do not knowingly collect personal
              information from children under 13. If you become aware that a child has provided us with personal
              information, please contact us so we can take appropriate action.
            </p>
          </Section>

          <Section title="8. Your Rights">
            <p>Depending on your location, you may have the right to:</p>
            <ul>
              <li><strong>Access</strong> the personal data we hold about you</li>
              <li><strong>Correct</strong> inaccurate data</li>
              <li><strong>Delete</strong> your data (available directly in the app)</li>
              <li><strong>Port</strong> your data to another service</li>
              <li><strong>Object</strong> to certain processing</li>
            </ul>
            <p>To exercise any of these rights, contact us at <a href={`mailto:${contactEmail}`} style={linkStyle}>{contactEmail}</a>.</p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any significant changes
              by updating the &quot;Last updated&quot; date at the top of this page. Continued use of the Service
              after changes constitutes acceptance of the updated policy.
            </p>
          </Section>

          <Section title="10. Contact Us">
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
            <p>
              <strong>Email:</strong> <a href={`mailto:${contactEmail}`} style={linkStyle}>{contactEmail}</a>
            </p>
          </Section>
        </div>
      </body>
    </html>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, borderBottom: '1px solid #e5e7eb', paddingBottom: 8, marginBottom: 16 }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, marginTop: 20 }}>{children}</h3>;
}

const linkStyle = { color: '#6C63FF', textDecoration: 'none' as const };
