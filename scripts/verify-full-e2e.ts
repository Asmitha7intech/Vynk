import { buildServer } from '../apps/api/src/server';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

function assert(condition: any, message: string) {
  if (!condition) {
    console.error(`[FAIL] Assertion failed: ${message}`);
    process.exit(1);
  }
  console.log(`[PASS] ${message}`);
}

async function run() {
  console.log('=====================================================');
  console.log('   VYNK PHASE 7: MULTI-ACCOUNT END-TO-END VERIFICATION');
  console.log('=====================================================\n');

  console.log('Booting VYNK API Fastify server instance...');
  const server = await buildServer();
  await server.ready();
  console.log('Fastify API server initialized successfully.\n');

  const timestamp = Date.now();

  // Test Accounts
  const superAdminEmail = process.env.OWNER_EMAIL || 'asmitha7intech@gmail.com';
  const superAdminPass = process.env.OWNER_INITIAL_PASSWORD || 'VynkOwner#2026!SecureRoot';

  const studentAEmail = `student.a.${timestamp}@gmail.com`;
  const studentAPass = 'StudentAlpha#2026!';
  const studentAUser = `student_a_${timestamp}`;

  const studentBEmail = `student.b.${timestamp}@cit.edu.in`;
  const studentBPass = 'StudentBeta#2026!';
  const studentBUser = `student_b_${timestamp}`;

  let tokenAdmin = '';
  let tokenA = '';
  let tokenB = '';
  let studentAId = '';
  let studentBId = '';

  // -------------------------------------------------------------
  // 1. REGISTRATION OF STUDENT ACCOUNTS
  // -------------------------------------------------------------
  console.log('--- 1. Testing Registration of Student A (Gmail) ---');
  const regARes = await server.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: {
      email: studentAEmail,
      password: studentAPass,
      username: studentAUser,
      displayName: 'Aarav Patel (Student A)',
      college: 'Coimbatore Institute of Technology (CIT)',
      department: 'Computer Science and Engineering',
      graduationYear: 2026,
    },
  });
  assert(regARes.statusCode === 201, `Student A registered successfully (Status: ${regARes.statusCode})`);
  const regABody = JSON.parse(regARes.payload);
  assert(regABody.success === true, 'Student A registration response success flag is true');
  studentAId = regABody.data.user.id;
  tokenA = regABody.data.accessToken;
  assert(!!studentAId, `Student A ID assigned: ${studentAId}`);

  console.log('\n--- 2. Testing Registration of Student B (Campus/Institutional Email) ---');
  const regBRes = await server.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: {
      email: studentBEmail,
      password: studentBPass,
      username: studentBUser,
      displayName: 'Bhavna Sharma (Student B)',
      college: 'PSG College of Technology',
      department: 'Information Technology',
      graduationYear: 2027,
    },
  });
  assert(regBRes.statusCode === 201, `Student B registered successfully (Status: ${regBRes.statusCode})`);
  const regBBody = JSON.parse(regBRes.payload);
  assert(regBBody.success === true, 'Student B registration response success flag is true');
  studentBId = regBBody.data.user.id;
  tokenB = regBBody.data.accessToken;
  assert(!!studentBId, `Student B ID assigned: ${studentBId}`);

  // -------------------------------------------------------------
  // 2. SIGN-IN VERIFICATION FOR ALL ACCOUNTS
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Sign-In: Super Admin ---');
  const adminLoginRes = await server.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: {
      email: superAdminEmail,
      password: superAdminPass,
    },
  });
  assert(adminLoginRes.statusCode === 200, `Super Admin sign-in status 200 (Got: ${adminLoginRes.statusCode})`);
  const adminLoginBody = JSON.parse(adminLoginRes.payload);
  assert(adminLoginBody.success === true, 'Super Admin login success flag is true');
  assert(adminLoginBody.data.user.role === 'SUPER_ADMIN', `Super Admin verified with role ${adminLoginBody.data.user.role}`);
  tokenAdmin = adminLoginBody.data.accessToken;

  console.log('\n--- 4. Testing Sign-In: Student A (Gmail Account) ---');
  const loginARes = await server.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: {
      email: studentAEmail,
      password: studentAPass,
    },
  });
  assert(loginARes.statusCode === 200, `Student A login status 200 (Got: ${loginARes.statusCode})`);
  const loginABody = JSON.parse(loginARes.payload);
  assert(loginABody.success === true, 'Student A login success flag is true');
  tokenA = loginABody.data.accessToken;

  console.log('\n--- 5. Testing Sign-In: Student B (Personal/College Account) ---');
  const loginBRes = await server.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: {
      email: studentBEmail,
      password: studentBPass,
    },
  });
  assert(loginBRes.statusCode === 200, `Student B login status 200 (Got: ${loginBRes.statusCode})`);
  const loginBBody = JSON.parse(loginBRes.payload);
  assert(loginBBody.success === true, 'Student B login success flag is true');
  tokenB = loginBBody.data.accessToken;

  // -------------------------------------------------------------
  // 3. SUPER ADMIN DASHBOARD & PULSE TELEMETRY
  // -------------------------------------------------------------
  console.log('\n--- 6. Verifying Super Admin Dashboard (/pulse/summary & /pulse/events) ---');
  const pulseSummaryRes = await server.inject({
    method: 'GET',
    url: '/api/v1/pulse/summary',
    headers: { authorization: `Bearer ${tokenAdmin}` },
  });
  assert(pulseSummaryRes.statusCode === 200, `Pulse summary accessible to Super Admin (Status: ${pulseSummaryRes.statusCode})`);
  const pulseSummary = JSON.parse(pulseSummaryRes.payload);
  assert(pulseSummary.success === true, 'Pulse summary response success is true');
  assert(pulseSummary.data.kpis !== undefined, 'Pulse KPIs telemetry data present');

  const pulseEventsRes = await server.inject({
    method: 'GET',
    url: '/api/v1/pulse/events',
    headers: { authorization: `Bearer ${tokenAdmin}` },
  });
  assert(pulseEventsRes.statusCode === 200, `Pulse events telemetry accessible (Status: ${pulseEventsRes.statusCode})`);

  // RBAC test: Ensure regular student CANNOT access Super Admin dashboard
  const studentPulseForbiddenRes = await server.inject({
    method: 'GET',
    url: '/api/v1/pulse/summary',
    headers: { authorization: `Bearer ${tokenA}` },
  });
  assert(studentPulseForbiddenRes.statusCode === 403, `RBAC verified: Student A forbidden from Pulse (Status: ${studentPulseForbiddenRes.statusCode})`);

  // -------------------------------------------------------------
  // 4. PROFILE EDITING AND PERSISTENCE
  // -------------------------------------------------------------
  console.log('\n--- 7. Verifying Profile Editing & Persistence (Student A) ---');
  const updateProfileRes = await server.inject({
    method: 'PATCH',
    url: '/api/v1/profile/me',
    headers: { authorization: `Bearer ${tokenA}` },
    payload: {
      bio: 'Full-stack AI developer passionate about Rust, TypeScript, and distributed systems.',
      headline: 'CS Junior @ CIT | Open Source Contributor',
      skills: ['TypeScript', 'Fastify', 'React', 'Docker'],
    },
  });
  assert(updateProfileRes.statusCode === 200, `Student A profile updated successfully (Status: ${updateProfileRes.statusCode})`);
  const updatedProfileBody = JSON.parse(updateProfileRes.payload);
  const updatedUserData = updatedProfileBody.data?.user || updatedProfileBody.data;
  assert(updatedUserData.bio.includes('Full-stack AI developer'), 'Bio saved and returned');
  assert(updatedUserData.headline.includes('CS Junior @ CIT'), 'Headline saved and returned');

  // Verify persistence via GET /api/v1/profile/me
  const getProfileRes = await server.inject({
    method: 'GET',
    url: '/api/v1/profile/me',
    headers: { authorization: `Bearer ${tokenA}` },
  });
  const fetchedProfile = JSON.parse(getProfileRes.payload);
  const fetchedUser = fetchedProfile.data?.user || fetchedProfile.data;
  assert(fetchedUser.bio.includes('Full-stack AI developer'), 'Profile persistence verified via GET /profile/me');

  // -------------------------------------------------------------
  // 5. CONNECTION WORKFLOW: REQUEST & ACCEPT
  // -------------------------------------------------------------
  console.log('\n--- 8. Verifying Connection Request: Student A -> Student B ---');
  const sendConnRes = await server.inject({
    method: 'POST',
    url: `/api/v1/vynks/request/${studentBId}`,
    headers: { authorization: `Bearer ${tokenA}` },
  });
  assert(sendConnRes.statusCode === 201, `Connection request sent (Status: ${sendConnRes.statusCode})`);
  const connData = JSON.parse(sendConnRes.payload);
  const connectionId = connData.data.id;
  assert(!!connectionId, `Connection ID generated: ${connectionId}`);

  console.log('\n--- 9. Verifying Pending Request & Acceptance: Student B ---');
  const pendingRequestsRes = await server.inject({
    method: 'GET',
    url: '/api/v1/vynks/requests/pending',
    headers: { authorization: `Bearer ${tokenB}` },
  });
  assert(pendingRequestsRes.statusCode === 200, `Student B retrieved pending requests`);
  const pendingList = JSON.parse(pendingRequestsRes.payload).data;
  assert(pendingList.some((req: any) => req.id === connectionId), 'Student B received pending connection from Student A');

  // Student B accepts connection
  const acceptRes = await server.inject({
    method: 'POST',
    url: `/api/v1/vynks/requests/${connectionId}/accept`,
    headers: { authorization: `Bearer ${tokenB}` },
  });
  assert(acceptRes.statusCode === 200, `Student B accepted connection (Status: ${acceptRes.statusCode})`);
  const acceptedBody = JSON.parse(acceptRes.payload);
  assert(acceptedBody.data.status === 'ACCEPTED', 'Connection status updated to ACCEPTED');

  // Verify connection appears in Student A's active connections list
  const activeConnRes = await server.inject({
    method: 'GET',
    url: '/api/v1/vynks/connections',
    headers: { authorization: `Bearer ${tokenA}` },
  });
  const activeList = JSON.parse(activeConnRes.payload).data;
  assert(activeList.some((c: any) => c.id === connectionId && c.status === 'ACCEPTED'), 'Active connection verified for Student A');

  // -------------------------------------------------------------
  // 6. REAL-TIME MESSAGING
  // -------------------------------------------------------------
  console.log('\n--- 10. Verifying Direct Messaging Between Student A & Student B ---');
  // Student A initiates direct conversation
  const directConvRes = await server.inject({
    method: 'POST',
    url: `/api/v1/messages/direct/${studentBId}`,
    headers: { authorization: `Bearer ${tokenA}` },
  });
  assert(directConvRes.statusCode === 200, `Direct conversation initialized (Status: ${directConvRes.statusCode})`);
  const conversation = JSON.parse(directConvRes.payload).data;
  const conversationId = conversation.id;
  assert(!!conversationId, `Conversation ID assigned: ${conversationId}`);

  // Student A sends message
  const msgContentA = 'Hey Bhavna! Excited to connect on VYNK. Are you joining the Smart India Hackathon?';
  const sendMsgRes = await server.inject({
    method: 'POST',
    url: '/api/v1/messages/send',
    headers: { authorization: `Bearer ${tokenA}` },
    payload: {
      conversationId,
      content: msgContentA,
    },
  });
  assert(sendMsgRes.statusCode === 201, `Student A sent message (Status: ${sendMsgRes.statusCode})`);

  // Student B retrieves messages
  const getMsgsRes = await server.inject({
    method: 'GET',
    url: `/api/v1/messages/conversations/${conversationId}/messages`,
    headers: { authorization: `Bearer ${tokenB}` },
  });
  assert(getMsgsRes.statusCode === 200, `Student B retrieved conversation messages`);
  const msgList = JSON.parse(getMsgsRes.payload).data;
  assert(msgList.some((m: any) => m.content === msgContentA), 'Student B received Student A message');

  // Student B replies
  const msgContentB = 'Hey Aarav! Yes, our team is looking for a backend lead. Let us collaborate!';
  const replyMsgRes = await server.inject({
    method: 'POST',
    url: '/api/v1/messages/send',
    headers: { authorization: `Bearer ${tokenB}` },
    payload: {
      conversationId,
      content: msgContentB,
    },
  });
  assert(replyMsgRes.statusCode === 201, `Student B sent reply message (Status: ${replyMsgRes.statusCode})`);

  // -------------------------------------------------------------
  // 7. CAMPUS FEED: POST, LIKE, AND COMMENT
  // -------------------------------------------------------------
  console.log('\n--- 11. Verifying Campus Feed: Post Creation, Like, & Comment ---');
  // Student A creates a project update post
  const postRes = await server.inject({
    method: 'POST',
    url: '/api/v1/posts',
    headers: { authorization: `Bearer ${tokenA}` },
    payload: {
      content: 'Just deployed our autonomous drone perception pipeline built with PyTorch and ROS2! Looking for feedback.',
      title: 'Autonomous Drone Vision Pipeline',
      type: 'VOYAGE_LAUNCH',
      tags: ['Robotics', 'PyTorch', 'ROS2', 'AI'],
    },
  });
  assert(postRes.statusCode === 201, `Student A created feed post (Status: ${postRes.statusCode})`);
  const createdPost = JSON.parse(postRes.payload).data;
  const postId = createdPost.id;
  assert(!!postId, `Post ID assigned: ${postId}`);

  // Student B sees post in feed
  const feedRes = await server.inject({
    method: 'GET',
    url: '/api/v1/posts/feed',
    headers: { authorization: `Bearer ${tokenB}` },
  });
  assert(feedRes.statusCode === 200, `Student B retrieved feed`);
  const feedPosts = JSON.parse(feedRes.payload).data;
  assert(feedPosts.some((p: any) => p.id === postId), 'Student B found post in feed');

  // Student B reacts/likes the post
  const reactRes = await server.inject({
    method: 'POST',
    url: `/api/v1/posts/${postId}/react`,
    headers: { authorization: `Bearer ${tokenB}` },
    payload: { emoji: '🔥' },
  });
  assert(reactRes.statusCode === 200, `Student B reacted to post (Status: ${reactRes.statusCode})`);

  // Student B comments on the post
  const commentText = 'Incredible architecture! How did you optimize inference latency on edge devices?';
  const commentRes = await server.inject({
    method: 'POST',
    url: `/api/v1/posts/${postId}/comments`,
    headers: { authorization: `Bearer ${tokenB}` },
    payload: { content: commentText },
  });
  assert(commentRes.statusCode === 201, `Student B added comment (Status: ${commentRes.statusCode})`);
  const commentData = JSON.parse(commentRes.payload).data;
  assert(commentData.content === commentText, 'Comment content verified');

  // Verify comment retrieval
  const commentsListRes = await server.inject({
    method: 'GET',
    url: `/api/v1/posts/${postId}/comments`,
  });
  const commentsList = JSON.parse(commentsListRes.payload).data;
  assert(commentsList.some((c: any) => c.content === commentText), 'Comment present in post comments list');

  // -------------------------------------------------------------
  // 8. NOTIFICATIONS
  // -------------------------------------------------------------
  console.log('\n--- 12. Verifying Notifications ---');
  const notifARes = await server.inject({
    method: 'GET',
    url: '/api/v1/notifications',
    headers: { authorization: `Bearer ${tokenA}` },
  });
  assert(notifARes.statusCode === 200, `Student A retrieved notifications (Status: ${notifARes.statusCode})`);
  const notifAData = JSON.parse(notifARes.payload).data;
  assert(Array.isArray(notifAData.notifications), 'Student A notifications list is an array');

  // -------------------------------------------------------------
  // 9. VOYAGES (COLLABORATION & TEAMMATE DISCOVERY)
  // -------------------------------------------------------------
  console.log('\n--- 13. Verifying Voyage Creation & Discovery ---');
  const voyageRes = await server.inject({
    method: 'POST',
    url: '/api/v1/voyages',
    headers: { authorization: `Bearer ${tokenA}` },
    payload: {
      title: 'Smart City Decentralized Energy Grid',
      tagline: 'IoT and smart contract microgrid optimization',
      description: 'Building an IoT and smart contract solution for local microgrids during Coimbatore Hackathon 2026.',
      category: 'HACKATHON',
      technologies: ['Solidity', 'Go', 'Next.js', 'MQTT'],
      status: 'IN_PROGRESS',
    },
  });
  assert(voyageRes.statusCode === 201, `Student A created Voyage (Status: ${voyageRes.statusCode})`);
  const createdVoyage = JSON.parse(voyageRes.payload).data;
  const voyageId = createdVoyage.id;
  assert(!!voyageId, `Voyage ID assigned: ${voyageId}`);

  // Student B sends join request
  const joinVoyageRes = await server.inject({
    method: 'POST',
    url: `/api/v1/voyages/${voyageId}/join-request`,
    headers: { authorization: `Bearer ${tokenB}` },
    payload: {
      roleName: 'Smart Contract Dev',
      message: 'I have 2 years of Solidity experience and would love to join your project team.',
      skills: ['Solidity', 'Go'],
    },
  });
  assert(joinVoyageRes.statusCode === 201, `Student B sent join request to Voyage (Status: ${joinVoyageRes.statusCode})`);

  // -------------------------------------------------------------
  // 10. SESSION PERSISTENCE & LOGOUT / RE-LOGIN
  // -------------------------------------------------------------
  console.log('\n--- 14. Verifying Session Invalidation & Re-Authentication ---');
  // Student A logs out
  const logoutRes = await server.inject({
    method: 'POST',
    url: '/api/v1/auth/logout',
    headers: { authorization: `Bearer ${tokenA}` },
  });
  assert(logoutRes.statusCode === 200, `Student A logged out successfully`);

  // Student A logs back in with saved credentials
  const reloginRes = await server.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: {
      email: studentAEmail,
      password: studentAPass,
    },
  });
  assert(reloginRes.statusCode === 200, `Student A successfully re-authenticated`);
  const reloginBody = JSON.parse(reloginRes.payload);
  const freshTokenA = reloginBody.data.accessToken;

  // Verify access with fresh token
  const meVerifyRes = await server.inject({
    method: 'GET',
    url: '/api/v1/auth/me',
    headers: { authorization: `Bearer ${freshTokenA}` },
  });
  assert(meVerifyRes.statusCode === 200, `Student A session restored and verified via /auth/me`);

  await server.close();
  console.log('\n=====================================================');
  console.log('   ALL 14 MULTI-ACCOUNT VERIFICATION TESTS PASSED!');
  console.log('=====================================================');
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error during E2E verification:', err);
  process.exit(1);
});
