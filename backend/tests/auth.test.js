const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const User = require('../src/models/User');

describe('Authentication System', () => {
  let testUser;
  let authToken;
  let refreshToken;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/ai_counseling_test');
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.accessToken).toBeDefined();
      
      testUser = res.body.data.user;
      authToken = res.body.data.accessToken;
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!',
          username: 'testuser2',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should validate password requirements', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test2@example.com',
          password: 'weak',
          username: 'testuser3',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test123!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('test@example.com');
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/auth/profile');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          profile: {
            bio: 'Updated bio',
            firstName: 'Updated',
            lastName: 'Name'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.bio).toBe('Updated bio');
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password with correct current password', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'Test123!',
          newPassword: 'NewTest123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject change with incorrect current password', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'NewTest123!'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/password-reset', () => {
    it('should request password reset', async () => {
      const res = await request(app)
        .post('/api/auth/password-reset')
        .send({
          email: 'test@example.com'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should not reveal if email exists', async () => {
      const res = await request(app)
        .post('/api/auth/password-reset')
        .send({
          email: 'nonexistent@example.com'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on login attempts', async () => {
      const requests = [];
      
      // Make 6 requests (limit is 5)
      for (let i = 0; i < 6; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'test@example.com',
              password: 'wrongpassword'
            })
        );
      }

      const responses = await Promise.all(requests);
      const lastResponse = responses[5];
      
      expect(lastResponse.status).toBe(429);
      expect(lastResponse.body.success).toBe(false);
    });
  });
});