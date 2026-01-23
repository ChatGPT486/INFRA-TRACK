// InfraTrack Global - Backend Server with PostgreSQL
// File: server.js

const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'infratrack-secret-key-2025';

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'InfraTrack',
  password: process.env.DB_PASSWORD || 'Group',
  port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Connected to PostgreSQL database');
    initializeDatabase();
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Initialize database tables
async function initializeDatabase() {
  try {
    console.log('✅ Database tables already initialized (manual setup)');
  } catch (error) {
    console.error('❌ Database error:', error);
  }
}

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ============================================================
// AUTH ROUTES
// ============================================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, full_name, email, password, phone_number, country, city } = req.body;

    // Validate required fields
    if (!username || !full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, full name, email, and password are required'
      });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (username, full_name, email, password_hash, phone_number, country, city)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, full_name, email, country, city`,
      [username, full_name, email, hashedPassword, phone_number || null, country || null, city || null]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: user.id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user.id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
});

// ============================================================
// USER ROUTES
// ============================================================

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, full_name, email, country, city, verified, total_reports, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, username, full_name, email, phone_number, country, city, verified, total_reports, created_at
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone_number, country, city, verified } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           phone_number = COALESCE($2, phone_number),
           country = COALESCE($3, country),
           city = COALESCE($4, city),
           verified = COALESCE($5, verified),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, username, full_name, email, phone_number, country, city, verified`,
      [full_name, phone_number, country, city, verified, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // First, delete all reports by this user
    await pool.query('DELETE FROM reports WHERE user_id = $1', [id]);

    // Then, delete all verifications by this user
    await pool.query('DELETE FROM verifications WHERE user_id = $1', [id]);

    // Delete all notifications for this user
    await pool.query('DELETE FROM notifications WHERE user_id = $1', [id]);

    // Finally, delete the user
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// Get user stats
app.get('/api/users/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const stats = await pool.query(
      `SELECT 
        u.total_reports,
        COUNT(DISTINCT v.id) as verifications_count,
        COALESCE(SUM(r.upvotes), 0) as total_upvotes,
        COALESCE(SUM(r.downvotes), 0) as total_downvotes
       FROM users u
       LEFT JOIN reports r ON u.id = r.user_id
       LEFT JOIN verifications v ON u.id = v.user_id
       WHERE u.id = $1
       GROUP BY u.id, u.total_reports`,
      [id]
    );

    if (stats.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: stats.rows[0]
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user stats',
      error: error.message
    });
  }
});

// ============================================================
// REPORT ROUTES
// ============================================================

// Get all reports with filters
app.get('/api/reports', async (req, res) => {
  try {
    const { service_type, status, user_id, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT r.*, u.full_name as user_name, u.verified as user_verified
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (service_type) {
      query += ` AND r.service_type = $${paramCount}`;
      params.push(service_type);
      paramCount++;
    }

    if (status) {
      query += ` AND r.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (user_id) {
      query += ` AND r.user_id = $${paramCount}`;
      params.push(user_id);
      paramCount++;
    }

    query += ` ORDER BY r.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      reports: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message
    });
  }
});

// Create report
app.post('/api/reports', upload.single('image'), async (req, res) => {
  try {
    const {
      user_id,
      service_type,
      title,
      description,
      status,
      severity,
      country,
      city,
      location_address,
      location_latitude,
      location_longitude
    } = req.body;

    // Validate required fields
    if (!service_type || !title || !country || !city) {
      return res.status(400).json({
        success: false,
        message: 'Service type, title, country, and city are required'
      });
    }

    const image_path = req.file ? `uploads/${req.file.filename}` : null;

    const result = await pool.query(
      `INSERT INTO reports (
        user_id, service_type, title, description, status, severity,
        country, city, location_address, location_latitude, location_longitude, image_path
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        user_id || null,
        service_type,
        title,
        description || null,
        status || 'outage',
        severity || 'medium',
        country,
        city,
        location_address || null,
        location_latitude || null,
        location_longitude || null,
        image_path
      ]
    );

    const report = result.rows[0];

    // Update user's total reports count
    if (user_id) {
      await pool.query(
        'UPDATE users SET total_reports = total_reports + 1 WHERE id = $1',
        [user_id]
      );
    }

    // Emit socket event for new report
    io.emit('new-report', report);

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: report
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating report',
      error: error.message
    });
  }
});

// Get report by ID
app.get('/api/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT r.*, u.full_name as user_name, u.verified as user_verified
       FROM reports r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching report',
      error: error.message
    });
  }
});

// REPLACE THE EXISTING PUT /api/reports/:id ENDPOINT IN server.js WITH THIS:

// Update report (upvote/downvote/status)
app.put('/api/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, status } = req.body;

    console.log(`📝 Update request for report #${id}:`, { action, status });

    let result;

    if (action === 'upvote') {
      console.log(`👍 Upvoting report #${id}`);
      await pool.query(
        'UPDATE reports SET upvotes = upvotes + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );
      result = await pool.query('SELECT * FROM reports WHERE id = $1', [id]);
    } else if (action === 'downvote') {
      console.log(`👎 Downvoting report #${id}`);
      await pool.query(
        'UPDATE reports SET downvotes = downvotes + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );
      result = await pool.query('SELECT * FROM reports WHERE id = $1', [id]);
    } else if (status) {
      console.log(`🔄 Updating status of report #${id} to: ${status}`);
      result = await pool.query(
        'UPDATE reports SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [status, id]
      );
    } else {
      console.log('❌ No valid action or status provided');
      return res.status(400).json({
        success: false,
        message: 'Either action (upvote/downvote) or status is required'
      });
    }

    if (!result || result.rows.length === 0) {
      console.log(`❌ Report #${id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    console.log(`✅ Report #${id} updated successfully`);

    // Emit socket event for real-time updates
    if (io) {
      io.emit('report-updated', result.rows[0]);
    }

    res.json({
      success: true,
      message: 'Report updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error updating report:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating report',
      error: error.message
    });
  }
});

// Delete report
app.delete('/api/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM reports WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      message: 'Report deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting report',
      error: error.message
    });
  }
});

// ============================================================
// NOTIFICATION ROUTES
// ============================================================

// Add this route to your server.js file after the other notification routes

// ============================================================
// BROADCAST NOTIFICATION TO ALL USERS
// ============================================================

app.post('/api/notifications/broadcast', async (req, res) => {
  try {
    const { title, message } = req.body;

    console.log('📢 Broadcast request received:', { title, message });

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    // Get all users
    const usersResult = await pool.query('SELECT id FROM users');
    const users = usersResult.rows;

    console.log(`Found ${users.length} users to notify`);

    if (users.length === 0) {
      return res.json({
        success: true,
        message: 'No users to notify',
        count: 0
      });
    }

    // Create notification for each user (WITHOUT type column)
    const notifications = [];
    for (const user of users) {
      try {
        const result = await pool.query(
          `INSERT INTO notifications (user_id, title, message, is_read)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [user.id, title, message, false]
        );
        notifications.push(result.rows[0]);
        console.log(`✅ Created notification for user ${user.id}`);
      } catch (insertError) {
        console.error(`❌ Failed to create notification for user ${user.id}:`, insertError.message);
      }
    }

    console.log(`✅ Successfully created ${notifications.length} notifications`);

    // Emit socket event for real-time notification
    io.emit('new-notification', {
      title,
      message
    });

    res.json({
      success: true,
      message: `Notification sent to ${notifications.length} users`,
      count: notifications.length,
      notifications: notifications
    });
  } catch (error) {
    console.error('❌ Error broadcasting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error broadcasting notification',
      error: error.message
    });
  }
});


// Get user notifications
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({
      success: true,
      notifications: result.rows
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
});

// Mark all notifications as read
app.put('/api/notifications/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;

    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message
    });
  }
});

// ============================================================
// SOCKET.IO
// ============================================================

io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// ============================================================
// ERROR HANDLING
// ============================================================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================================
// START SERVER
// ============================================================

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🌍 InfraTrack Global Backend Server                    ║
║                                                           ║
║   🚀 Server running on: http://localhost:${PORT}         ║
║   💾 Database: PostgreSQL                                ║
║   📡 Socket.IO: Enabled                                  ║
║                                                           ║
║   📚 API Documentation:                                  ║
║   - POST   /api/auth/register                            ║
║   - POST   /api/auth/login                               ║
║   - GET    /api/users                                    ║
║   - GET    /api/users/:id                                ║
║   - PUT    /api/users/:id                                ║
║   - DELETE /api/users/:id                                ║
║   - GET    /api/users/:id/stats                          ║
║   - GET    /api/reports                                  ║
║   - POST   /api/reports                                  ║
║   - GET    /api/reports/:id                              ║
║   - PUT    /api/reports/:id                              ║
║   - DELETE /api/reports/:id                              ║
║   - GET    /api/notifications/:userId                    ║
║   - PUT    /api/notifications/:id/read                   ║
║   - PUT    /api/notifications/:userId/read-all           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});