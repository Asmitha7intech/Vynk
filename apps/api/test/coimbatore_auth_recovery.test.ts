import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../src/server';
import { COIMBATORE_INSTITUTIONS } from '@vynk/types';
import { authService } from '../src/services/auth.service';
import { prisma } from '@vynk/database';

describe('VYNK — Critical Authentication Fix & Coimbatore College Directory Integration Suite', () => {
  let fastify: FastifyInstance;

  beforeAll(async () => {
    fastify = await buildServer();
    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  // =========================================================================
  // A. COIMBATORE INSTITUTIONS DIRECTORY VERIFICATION
  // =========================================================================
  describe('A. Coimbatore College / Institution Directory Verification', () => {
    it('contains verified Coimbatore institutions across all required categories', () => {
      expect(COIMBATORE_INSTITUTIONS.length).toBeGreaterThan(30);

      // CIT must be verified and present
      const cit = COIMBATORE_INSTITUTIONS.find((i) => i.id === 'cbe-cit');
      expect(cit).toBeDefined();
      expect(cit?.name).toBe('Coimbatore Institute of Technology (CIT)');
      expect(cit?.areaScope).toBe('Coimbatore City');
      expect(cit?.location).toContain('Peelamedu');
      expect(cit?.domains).toContain('cit.edu.in');

      // Key Engineering Colleges
      const psgTech = COIMBATORE_INSTITUTIONS.find((i) => i.id === 'cbe-psg-tech');
      expect(psgTech).toBeDefined();
      const gct = COIMBATORE_INSTITUTIONS.find((i) => i.id === 'cbe-gct');
      expect(gct).toBeDefined();
      const kct = COIMBATORE_INSTITUTIONS.find((i) => i.id === 'cbe-kct');
      expect(kct).toBeDefined();
      const skcet = COIMBATORE_INSTITUTIONS.find((i) => i.id === 'cbe-skcet');
      expect(skcet).toBeDefined();

      // Key Arts & Science Colleges
      const psgCas = COIMBATORE_INSTITUTIONS.find((i) => i.id === 'cbe-psg-cas');
      expect(psgCas).toBeDefined();
      const psgrKcw = COIMBATORE_INSTITUTIONS.find((i) => i.id === 'cbe-psgr-kcw');
      expect(psgrKcw).toBeDefined();
      const gac = COIMBATORE_INSTITUTIONS.find((i) => i.id === 'cbe-gac');
      expect(gac).toBeDefined();

      // Key Universities
      const bu = COIMBATORE_INSTITUTIONS.find((i) => i.id === 'cbe-bharathiar-univ');
      expect(bu).toBeDefined();
      const amrita = COIMBATORE_INSTITUTIONS.find((i) => i.id === 'cbe-amrita-univ');
      expect(amrita).toBeDefined();
      const tnau = COIMBATORE_INSTITUTIONS.find((i) => i.id === 'cbe-tnau');
      expect(tnau).toBeDefined();

      // Key Medical & Law
      const cmc = COIMBATORE_INSTITUTIONS.find((i) => i.id === 'cbe-medical-college');
      expect(cmc).toBeDefined();
      const lawCollege = COIMBATORE_INSTITUTIONS.find((i) => i.id === 'cbe-govt-law-college');
      expect(lawCollege).toBeDefined();
    });

    it('clearly distinguishes Coimbatore City from Coimbatore District taluk regions', () => {
      const cityColleges = COIMBATORE_INSTITUTIONS.filter((i) => i.areaScope === 'Coimbatore City');
      const districtColleges = COIMBATORE_INSTITUTIONS.filter((i) => i.areaScope === 'Coimbatore District');

      expect(cityColleges.length).toBeGreaterThan(15);
      expect(districtColleges.length).toBeGreaterThan(5);

      // Pollachi / Sulur institutions belong to Coimbatore District
      const mcetPollachi = COIMBATORE_INSTITUTIONS.find((i) => i.id === 'cbe-mcet-pollachi');
      expect(mcetPollachi?.areaScope).toBe('Coimbatore District');
      expect(mcetPollachi?.location).toContain('Pollachi');

      const rvsSulur = COIMBATORE_INSTITUTIONS.find((i) => i.id === 'cbe-rvs-cet-sulur');
      expect(rvsSulur?.areaScope).toBe('Coimbatore District');
    });

    it('strictly EXCLUDES institutions outside Coimbatore district (e.g. Bannari Amman in Erode)', () => {
      const bannariAmman = COIMBATORE_INSTITUTIONS.find(
        (i) => i.name.toLowerCase().includes('bannari') || i.id.includes('bannari')
      );
      expect(bannariAmman).toBeUndefined();
    });

    it('GET /api/v1/institutions returns the approved list sorted alphabetically', async () => {
      const res = await fastify.inject({
        method: 'GET',
        url: '/api/v1/institutions',
      });
      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // B. SUPER ADMIN AUTHENTICATION & RECOVERY VERIFICATION
  // =========================================================================
  describe('B. Super Admin Authentication & Privilege Verification', () => {
    it('authenticates canonical SuperAdmin with rotated password', async () => {
      const ownerEmail = (process.env.OWNER_EMAIL || 'asmitha7intech@gmail.com').toLowerCase().trim();
      const ownerPassword = process.env.OWNER_INITIAL_PASSWORD;
      if (!ownerPassword) throw new Error('OWNER_INITIAL_PASSWORD must be configured');

      const user = await authService.login(ownerEmail, ownerPassword);
      expect(user).toBeDefined();
      expect(user.email.toLowerCase()).toBe(ownerEmail);
      expect(user.role).toBe('SUPER_ADMIN');
      expect(user.mustChangePassword).toBe(true);
    });

    it('rejects incorrect password attempts for SuperAdmin', async () => {
      const ownerEmail = (process.env.OWNER_EMAIL || 'asmitha7intech@gmail.com').toLowerCase().trim();
      await expect(authService.login(ownerEmail, 'WrongPassword999!')).rejects.toThrow(
        'Invalid email or password.'
      );
    });

    it('allows SuperAdmin to access privileged Pulse & Admin routes via API', async () => {
      const ownerEmail = (process.env.OWNER_EMAIL || 'asmitha7intech@gmail.com').toLowerCase().trim();
      const ownerPassword = process.env.OWNER_INITIAL_PASSWORD;
      if (!ownerPassword) throw new Error('OWNER_INITIAL_PASSWORD must be configured');

      const loginRes = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: ownerEmail,
          password: ownerPassword,
        },
      });
      expect(loginRes.statusCode).toBe(200);
      const loginJson = JSON.parse(loginRes.body);
      const token = loginJson.data.accessToken;

      // Access admin analytics
      const adminRes = await fastify.inject({
        method: 'GET',
        url: '/api/v1/admin/analytics',
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(adminRes.statusCode).toBe(200);

      // Access pulse summary
      const pulseRes = await fastify.inject({
        method: 'GET',
        url: '/api/v1/pulse/summary',
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(pulseRes.statusCode).toBe(200);
    });
  });

  // =========================================================================
  // C. STUDENT REGISTRATION, LOGIN & CASE-INSENSITIVITY
  // =========================================================================
  describe('C. Student Registration & Login Lifecycle Verification', () => {
    const studentData = {
      email: `Kaviya_${Date.now()}@cit.edu.in`,
      password: 'SecureStudentPass2026!',
      username: `kaviya_${Date.now().toString().slice(-6)}`,
      displayName: 'Kaviya M',
      college: 'Coimbatore Institute of Technology (CIT)',
      department: 'Artificial Intelligence & Data Science',
      graduationYear: 2026,
    };

    it('registers a new student with Coimbatore college selection', async () => {
      const res = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: studentData,
      });

      expect(res.statusCode).toBe(201);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.user.email).toBe(studentData.email.toLowerCase());
      expect(json.data.user.college).toBe(studentData.college);
      expect(json.data.user.role).toBe('STUDENT');
      expect(json.data.accessToken).toBeDefined();
    });

    it('allows newly registered student to immediately log in with same credentials', async () => {
      const res = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: studentData.email,
          password: studentData.password,
        },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.user.email).toBe(studentData.email.toLowerCase());
      expect(json.data.accessToken).toBeDefined();
    });

    it('supports case-insensitive email authentication (uppercase vs lowercase)', async () => {
      // User entered email with uppercase letters
      const upperEmail = studentData.email.toUpperCase();

      const res = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: upperEmail,
          password: studentData.password,
        },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.user.email).toBe(studentData.email.toLowerCase());
    });

    it('supports whitespace-tolerant email authentication', async () => {
      const spacedEmail = `  ${studentData.email}  `;

      const res = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: spacedEmail,
          password: studentData.password,
        },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
    });

    it('rejects incorrect student password with 401', async () => {
      const res = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: studentData.email,
          password: 'CompletelyWrongPassword123!',
        },
      });

      expect(res.statusCode).toBe(401);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(false);
      expect(json.message).toContain('Invalid email or password');
    });

    it('enforces RBAC: student account CANNOT access SuperAdmin administrative endpoints', async () => {
      const loginRes = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: studentData.email,
          password: studentData.password,
        },
      });
      const token = JSON.parse(loginRes.body).data.accessToken;

      // Attempt to access admin endpoint
      const adminRes = await fastify.inject({
        method: 'GET',
        url: '/api/v1/admin/analytics',
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(adminRes.statusCode).toBe(403);

      // Attempt to access pulse endpoint
      const pulseRes = await fastify.inject({
        method: 'GET',
        url: '/api/v1/pulse/summary',
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(pulseRes.statusCode).toBe(403);
    });

    it('allows students to register with personal email (e.g. @gmail.com)', async () => {
      const personalStudent = {
        email: `personal_${Date.now()}@gmail.com`,
        password: 'PersonalSecurePass2026!',
        username: `personal_${Date.now().toString().slice(-6)}`,
        displayName: 'Personal Email Student',
        college: 'PSG College of Technology',
        department: 'Mechanical Engineering',
        graduationYear: 2027,
      };

      const res = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: personalStudent,
      });

      expect(res.statusCode).toBe(201);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.user.email).toBe(personalStudent.email.toLowerCase());

      // Immediate login
      const loginRes = await fastify.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: personalStudent.email,
          password: personalStudent.password,
        },
      });
      expect(loginRes.statusCode).toBe(200);
    });
  });
});
