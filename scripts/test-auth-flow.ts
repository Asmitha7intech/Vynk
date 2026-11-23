import { buildServer } from '../apps/api/src/server';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  console.log('Initializing Fastify server...');
  const server = await buildServer();
  await server.ready();
  console.log('Fastify server ready.');

  console.log('\n--- 1. Testing Registration of student with Gmail ---');
  const regEmail = `test_${Date.now()}@gmail.com`;
  const regPass = 'StudentSecure#2026!';
  const regRes = await server.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: {
      email: regEmail,
      password: regPass,
      username: `student_${Date.now()}`,
      displayName: 'Test Gmail Student',
      college: 'Coimbatore Institute of Technology (CIT)',
      department: 'Computer Science',
      graduationYear: 2026,
    },
  });
  console.log('Register status:', regRes.statusCode);
  const regBody = JSON.parse(regRes.payload);
  console.log('Register success:', regBody.success, 'User ID:', regBody.data?.user?.id);

  console.log('\n--- 2. Testing Login of Registered Student ---');
  const loginRes = await server.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: {
      email: regEmail,
      password: regPass,
    },
  });
  console.log('Login status:', loginRes.statusCode);
  const loginBody = JSON.parse(loginRes.payload);
  console.log('Login success:', loginBody.success, 'Access Token Present:', !!loginBody.data?.accessToken);

  if (loginBody.data?.accessToken) {
    console.log('\n--- 3. Testing /api/v1/auth/me with Student Token ---');
    const meRes = await server.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: {
        authorization: `Bearer ${loginBody.data.accessToken}`,
      },
    });
    console.log('Auth /me status:', meRes.statusCode);
    const meBody = JSON.parse(meRes.payload);
    console.log('Auth /me user email:', meBody.data?.user?.email);
  }

  console.log('\n--- 4. Testing Canonical Super Admin Login ---');
  const ownerEmail = process.env.OWNER_EMAIL || 'asmitha7intech@gmail.com';
  const ownerPass = process.env.OWNER_INITIAL_PASSWORD;
  console.log('Owner email:', ownerEmail);
  console.log('Owner password length from env:', ownerPass?.length);

  const adminLoginRes = await server.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: {
      email: ownerEmail,
      password: ownerPass,
    },
  });
  console.log('Admin login status:', adminLoginRes.statusCode);
  const adminBody = JSON.parse(adminLoginRes.payload);
  console.log('Admin login response:', adminBody);

  if (adminBody.data?.accessToken) {
    console.log('\n--- 5. Testing /api/v1/auth/me with Super Admin Token ---');
    const adminMeRes = await server.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: {
        authorization: `Bearer ${adminBody.data.accessToken}`,
      },
    });
    console.log('Admin /me status:', adminMeRes.statusCode);
    const adminMeBody = JSON.parse(adminMeRes.payload);
    console.log('Admin /me user role:', adminMeBody.data?.user?.role);
    console.log('Admin /me mustChangePassword:', adminMeBody.data?.user?.mustChangePassword);

    console.log('\n--- 6. Testing Pulse Telemetry Access with Super Admin Token ---');
    const pulseRes = await server.inject({
      method: 'GET',
      url: '/api/v1/pulse/summary',
      headers: {
        authorization: `Bearer ${adminBody.data.accessToken}`,
      },
    });
    console.log('Pulse summary status:', pulseRes.statusCode);
    const pulseBody = JSON.parse(pulseRes.payload);
    console.log('Pulse summary success:', pulseBody.success);
  }

  await server.close();
  console.log('\nAll diagnostics completed successfully.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error during auth test:', err);
  process.exit(1);
});
