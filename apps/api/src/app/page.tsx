export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>FinSnap API</h1>
      <p>This is the backend API for the FinSnap mobile app.</p>
      <h2>Available Endpoints:</h2>
      <ul>
        <li><code>GET /api/health</code> - Health check</li>
        <li><code>POST /api/scan</code> - Scan receipt/statement image</li>
        <li><code>GET /api/user</code> - Get authenticated user</li>
      </ul>
    </main>
  );
}
