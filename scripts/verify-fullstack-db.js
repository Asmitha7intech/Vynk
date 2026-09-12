const path = require('path');
const fs = require('fs');

async function testFullDatabaseFlow() {
  console.log('🧪 Running VYNK Full-Stack Database Integration Test...\n');

  const { buildServer } = require('./apps/api/dist/server.js');
  const server = await buildServer();
  await server.ready();

  let testPassed = 0;
  let testFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      testPassed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      testFailed++;
    }
  }

  try {
    // 1. Health check
    const healthRes = await server.inject({ method: 'GET', url: '/health' });
    assert(healthRes.statusCode === 200, 'GET /health returns 200');

    // 2. Register new student
    const testEmail = `asmitha_${Date.now()}@mit.edu`;
    const regRes = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: testEmail,
        password: 'Password123!',
        username: `asmitha_${Date.now().toString().slice(-4)}`,
        displayName: 'Asmitha S',
        college: 'Massachusetts Institute of Technology (MIT)',
        department: 'Computer Science',
        graduationYear: 2026,
      },
    });
    const regBody = JSON.parse(regRes.body);
    assert(regRes.statusCode === 201 && regBody.success === true, 'POST /api/v1/auth/register creates user');
    assert(!!regBody.data.accessToken, 'Registration returns JWT access token');
    const token = regBody.data.accessToken;
    const userId = regBody.data.user.id;

    // 3. Reject duplicate registration
    const dupRes = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: testEmail,
        password: 'Password123!',
        username: 'asmitha_dup',
        displayName: 'Asmitha S',
      },
    });
    assert(dupRes.statusCode === 400 || dupRes.statusCode === 500, 'POST /api/v1/auth/register rejects duplicate email');

    // 4. Login with correct credentials
    const loginRes = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: testEmail,
        password: 'Password123!',
      },
    });
    const loginBody = JSON.parse(loginRes.body);
    assert(loginRes.statusCode === 200 && loginBody.success === true, 'POST /api/v1/auth/login succeeds with valid credentials');
    assert(loginBody.data.user.email === testEmail, 'Login returns correct user record');

    // 5. Login with invalid credentials
    const badLoginRes = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: testEmail,
        password: 'WrongPassword!',
      },
    });
    assert(badLoginRes.statusCode === 400 || badLoginRes.statusCode === 500, 'POST /api/v1/auth/login rejects wrong password');

    // 6. Authenticated /me
    const meRes = await server.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: `Bearer ${token}` },
    });
    const meBody = JSON.parse(meRes.body);
    assert(meRes.statusCode === 200 && meBody.data.user.id === userId, 'GET /api/v1/auth/me returns authenticated user');

    // 7. Feed Posts
    const feedRes = await server.inject({
      method: 'GET',
      url: '/api/v1/posts/feed',
      headers: { authorization: `Bearer ${token}` },
    });
    const feedBody = JSON.parse(feedRes.body);
    assert(feedRes.statusCode === 200 && Array.isArray(feedBody.data.posts), 'GET /api/v1/posts/feed returns list of posts');
    assert(feedBody.data.posts.length > 0, 'Feed contains initial seeded posts');

    // 8. Create Post
    const newPostRes = await server.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        type: 'TEXT',
        title: 'Building Realtime Multi-Agent Systems on VYNK',
        content: 'Excited to connect with fellow student builders across departments!',
        tags: ['AI', 'Startups', 'Web3'],
      },
    });
    const newPostBody = JSON.parse(newPostRes.body);
    assert(newPostRes.statusCode === 201 && !!newPostBody.data.post.id, 'POST /api/v1/posts creates new post');
    const createdPostId = newPostBody.data.post.id;

    // 9. Like Post
    const reactRes = await server.inject({
      method: 'POST',
      url: `/api/v1/posts/${createdPostId}/reactions`,
      headers: { authorization: `Bearer ${token}` },
      payload: { emoji: '🔥' },
    });
    assert(reactRes.statusCode === 200, 'POST /api/v1/posts/:id/reactions toggles like');

    // 10. Comment on Post
    const commRes = await server.inject({
      method: 'POST',
      url: `/api/v1/posts/${createdPostId}/comments`,
      headers: { authorization: `Bearer ${token}` },
      payload: { content: 'Let us build something epic!' },
    });
    assert(commRes.statusCode === 201, 'POST /api/v1/posts/:id/comments adds comment');

    // 11. Voyages
    const voyRes = await server.inject({
      method: 'GET',
      url: '/api/v1/voyages',
      headers: { authorization: `Bearer ${token}` },
    });
    const voyBody = JSON.parse(voyRes.body);
    assert(voyRes.statusCode === 200 && Array.isArray(voyBody.data.voyages), 'GET /api/v1/voyages returns project list');

    // 12. Crews
    const crewRes = await server.inject({
      method: 'GET',
      url: '/api/v1/crews',
      headers: { authorization: `Bearer ${token}` },
    });
    const crewBody = JSON.parse(crewRes.body);
    assert(crewRes.statusCode === 200 && Array.isArray(crewBody.data.crews), 'GET /api/v1/crews returns teams list');

    // 13. Daily Quests
    const questRes = await server.inject({
      method: 'GET',
      url: '/api/v1/quests/daily',
      headers: { authorization: `Bearer ${token}` },
    });
    const questBody = JSON.parse(questRes.body);
    assert(questRes.statusCode === 200 && !!questBody.data.challenge, 'GET /api/v1/quests/daily returns active challenge');

    // 14. Leaderboard & Gamification
    const lbRes = await server.inject({
      method: 'GET',
      url: '/api/v1/gamification/leaderboard',
      headers: { authorization: `Bearer ${token}` },
    });
    const lbBody = JSON.parse(lbRes.body);
    assert(lbRes.statusCode === 200 && Array.isArray(lbBody.data.leaderboard), 'GET /api/v1/gamification/leaderboard returns leaderboard');

    // 15. Cross-Department Matchmaking
    const crossRes = await server.inject({
      method: 'GET',
      url: '/api/v1/users/cross-department',
      headers: { authorization: `Bearer ${token}` },
    });
    assert(crossRes.statusCode === 200, 'GET /api/v1/users/cross-department returns cross-dept collaborators');

    // 16. BigData Analytics
    const bigDataHeatmap = await server.inject({
      method: 'GET',
      url: '/api/v1/analytics/bigdata/campus-heatmap',
      headers: { authorization: `Bearer ${token}` },
    });
    assert(bigDataHeatmap.statusCode === 200, 'GET /api/v1/analytics/bigdata/campus-heatmap returns analytics');

    // 17. Verify disk persistence
    const dbPath = path.resolve(__dirname, 'data', 'vynk_db.json');
    assert(fs.existsSync(dbPath), `Persistent database file exists at ${dbPath}`);
    const diskData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    assert(diskData.users.some((u) => u.email === testEmail), 'Newly registered user is persisted in vynk_db.json');
    assert(diskData.posts.some((p) => p.id === createdPostId), 'Newly created post is persisted in vynk_db.json');

    console.log(`\n========================================`);
    console.log(`Results: ${testPassed} Passed, ${testFailed} Failed`);
    console.log(`========================================\n`);

    if (testFailed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test execution error:', err);
    process.exit(1);
  } finally {
    await server.close();
  }
}

testFullDatabaseFlow();
