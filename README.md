# 🌍 InfraTrack Global

**Real-time Infrastructure Monitoring & Community Reporting Platform**

InfraTrack Global is a comprehensive web application that empowers communities in developing nations to report, track, and monitor infrastructure issues including power outages, water supply problems, and internet connectivity disruptions. Built with transparency and accountability at its core, the platform enables citizens to share real-time updates and hold service providers accountable.

![InfraTrack Banner](https://img.shields.io/badge/InfraTrack-Global-667eea?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-22c55e?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-764ba2?style=for-the-badge)

---

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [User Roles](#-user-roles)
- [Screenshots](#-screenshots)
- [Team](#-team)
- [License](#-license)

---

## ✨ Features

### Core Functionality
- **📱 Real-time Issue Reporting** - Report power, water, and internet infrastructure problems
- **🗺️ Interactive Map View** - Visualize all reported issues on an interactive map using Leaflet.js
- **📰 Live Reports Feed** - Browse and filter community-submitted reports in real-time
- **✅ Community Verification** - Upvote/downvote reports to verify their accuracy
- **🏆 Trust Score System** - Advanced algorithm that calculates user credibility based on:
  - Account verification status
  - Rating average
  - Task completion rate
  - Dispute ratio
  - Timeliness
  - Community feedback
  - System behavior

### User Features
- **👤 User Authentication** - Secure registration and login system with JWT tokens
- **📊 Personal Dashboard** - Track your reports, verifications, and statistics
- **🔔 Real-time Notifications** - Get instant updates about infrastructure issues
- **📷 Image Upload** - Attach photos to reports for better documentation
- **📍 Geolocation** - Auto-detect or manually enter location information

### Admin Features
- **🛡️ Admin Dashboard** - Comprehensive admin panel for platform management
- **👥 User Management** - Verify, moderate, and manage user accounts
- **📈 Analytics & Statistics** - View platform-wide metrics and trends
- **📥 Data Export** - Export reports to CSV for analysis
- **🔨 Report Moderation** - Update status, verify, or delete reports

### Additional Features
- **🌐 Multi-language Support** - English and French (expandable)
- **📱 Responsive Design** - Fully optimized for mobile, tablet, and desktop
- **🔌 Real-time Updates** - Socket.IO integration for live updates
- **🎨 Modern UI/UX** - Beautiful gradient backgrounds with glassmorphism effects

---

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom styling with modern features (glassmorphism, animations)
- **JavaScript (ES6+)** - Client-side logic
- **Leaflet.js** - Interactive maps
- **Socket.IO Client** - Real-time communication
- **Font Awesome & Bootstrap Icons** - Icon libraries

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **PostgreSQL** - Relational database
- **Socket.IO** - WebSocket server
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Multer** - File upload handling

### Libraries & Tools
- **pg** - PostgreSQL client
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variable management

---

## 📁 Project Structure

```
InfraTrack-Global/
│
├── server.js                 # Main backend server
├── package.json             # Node.js dependencies
├── .env                     # Environment variables
│
├── uploads/                 # Uploaded images directory
│
├── frontend/
│   ├── homepage.html        # Main landing page
│   ├── login.html          # Authentication page
│   ├── report.html         # Submit new report
│   ├── report_feeds.html   # Browse all reports
│   ├── map.html            # Interactive map view
│   ├── Account.html        # User profile & settings
│   ├── Admin.html          # Admin dashboard
│   ├── aboutUs.html        # About the platform
│   ├── Account.css         # Account page styles
│   └── image/              # Team photos
│       ├── paul.jpeg
│       ├── lea.jpeg
│       ├── simon.jpeg
│       ├── gety.jpeg
│       └── richard.jpeg
│
└── database/
    └── schema.sql          # PostgreSQL database schema
```

---

## 🚀 Installation

### Prerequisites
- **Node.js** (v14 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

### Step 1: Clone the Repository
```bash
git clone https://github.com/yourusername/infratrack-global.git
cd infratrack-global
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Set Up Database
1. Create a PostgreSQL database named `InfraTrack`
2. Run the database schema:
```sql
-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    country VARCHAR(50),
    city VARCHAR(50),
    verified BOOLEAN DEFAULT FALSE,
    total_reports INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reports table
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    service_type VARCHAR(20) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'outage',
    severity VARCHAR(20) DEFAULT 'medium',
    country VARCHAR(50) NOT NULL,
    city VARCHAR(50) NOT NULL,
    location_address TEXT,
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    image_path VARCHAR(255),
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(100),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create verifications table (optional)
CREATE TABLE verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    report_id INTEGER REFERENCES reports(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Step 4: Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
JWT_SECRET=infratrack-secret-key-2025
DB_USER=postgres
DB_HOST=localhost
DB_NAME=InfraTrack
DB_PASSWORD=Group
DB_PORT=5432
NODE_ENV=development
```

---

## ⚙️ Configuration

### Database Connection
Update database credentials in `.env` file:
```env
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_NAME=InfraTrack
```

### Admin Access
Default admin code: `INFRATRACK2025`

To change the admin code, update it in:
- `server.js` (if implementing server-side validation)
- `login.html` (line with `const ADMIN_CODE`)

---

## 🏃 Running the Application

### Start the Backend Server
```bash
node server.js
```
Server will run on `http://localhost:3000`

### Access the Frontend
Open your browser and navigate to:
```
http://localhost:3000/homepage.html
```
Or use a local development server for the frontend files.

### Test Accounts

**Regular User:**
- Email: `john@example.com`
- Password: `password123`

**Admin User:**
- Email: `admin@example.com`
- Password: `password123`
- Admin Code: `INFRATRACK2025`

---

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "full_name": "string",
  "email": "string",
  "password": "string",
  "phone_number": "string",
  "country": "string",
  "city": "string"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```

### User Endpoints

#### Get All Users
```http
GET /api/users
```

#### Get User by ID
```http
GET /api/users/:id
```

#### Update User
```http
PUT /api/users/:id
Content-Type: application/json

{
  "full_name": "string",
  "phone_number": "string",
  "country": "string",
  "city": "string",
  "verified": boolean
}
```

#### Delete User
```http
DELETE /api/users/:id
```

#### Get User Statistics
```http
GET /api/users/:id/stats
```

### Report Endpoints

#### Get All Reports
```http
GET /api/reports?service_type=power&status=outage&limit=50&offset=0
```

#### Create Report
```http
POST /api/reports
Content-Type: multipart/form-data

{
  "user_id": integer,
  "service_type": "power|water|internet",
  "title": "string",
  "description": "string",
  "status": "outage|partial|restored",
  "severity": "low|medium|high|critical",
  "country": "string",
  "city": "string",
  "location_address": "string",
  "location_latitude": decimal,
  "location_longitude": decimal,
  "image": file
}
```

#### Get Report by ID
```http
GET /api/reports/:id
```

#### Update Report (Upvote/Downvote/Status)
```http
PUT /api/reports/:id
Content-Type: application/json

{
  "action": "upvote|downvote",
  "status": "outage|partial|restored"
}
```

#### Delete Report
```http
DELETE /api/reports/:id
```

### Notification Endpoints

#### Get User Notifications
```http
GET /api/notifications/:userId
```

#### Mark Notification as Read
```http
PUT /api/notifications/:id/read
```

#### Mark All Notifications as Read
```http
PUT /api/notifications/:userId/read-all
```

---

## 🗄️ Database Schema

### Users Table
```sql
- id (SERIAL PRIMARY KEY)
- username (VARCHAR UNIQUE)
- full_name (VARCHAR)
- email (VARCHAR UNIQUE)
- password_hash (VARCHAR)
- phone_number (VARCHAR)
- country (VARCHAR)
- city (VARCHAR)
- verified (BOOLEAN)
- total_reports (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Reports Table
```sql
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER FOREIGN KEY)
- service_type (VARCHAR)
- title (VARCHAR)
- description (TEXT)
- status (VARCHAR)
- severity (VARCHAR)
- country (VARCHAR)
- city (VARCHAR)
- location_address (TEXT)
- location_latitude (DECIMAL)
- location_longitude (DECIMAL)
- image_path (VARCHAR)
- upvotes (INTEGER)
- downvotes (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Notifications Table
```sql
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER FOREIGN KEY)
- title (VARCHAR)
- message (TEXT)
- is_read (BOOLEAN)
- created_at (TIMESTAMP)
```

---

## 👥 User Roles

### Regular Users
- Submit infrastructure reports
- Browse and filter reports
- Upvote/downvote reports
- View interactive map
- Manage personal profile
- Receive notifications

### Admin Users
- All regular user permissions
- Access admin dashboard
- Verify user accounts
- Moderate reports (update status, delete)
- View platform analytics
- Export data to CSV
- Manage all users
- Send broadcast notifications

---

## 📸 Screenshots

### Homepage
![Homepage](https://via.placeholder.com/800x400/667eea/FFFFFF?text=Homepage+Dashboard)

### Interactive Map
![Map View](https://via.placeholder.com/800x400/764ba2/FFFFFF?text=Interactive+Map)

### Reports Feed
![Reports Feed](https://via.placeholder.com/800x400/22c55e/FFFFFF?text=Reports+Feed)

### Admin Dashboard
![Admin Panel](https://via.placeholder.com/800x400/ef4444/FFFFFF?text=Admin+Dashboard)

---

## 👨‍💻 Team

### Development Team - Software Engineering Students

**TABI PAUL AGWE**  
*Scrum Master*  
Software Engineering Student

**YUYAR LEA-BABARA**  
*Product Owner*  
Software Engineering Student

**SIMON AKUMA ASONGWE**  
*Chief Technology Officer*  
Software Engineering Student

**NDZEKA GETRUDE BERINYUY**  
*Front End Developer*  
Software Engineering Student

**TANDIE FOMEKONG RISCHARD**  
*Chief Financial Officer*  
Software Engineering Student

---

## 🎯 Vision & Mission

### Mission
InfraTrack Global was born from a simple observation: communities in developing nations deserve better infrastructure accountability. We're building a platform that gives power back to the people — a transparent, real-time system where every citizen can report infrastructure issues, verify others' reports, and hold service providers accountable.

### Vision
We envision a world where infrastructure transparency is the norm, not the exception. By 2030, we aim to be operating in 50+ developing nations, with millions of active users creating a global network of infrastructure accountability.

---

## 📊 Trust Score Algorithm

The platform uses a comprehensive trust scoring system:

**Formula:** `(10×V) + (6×R) + (20×C) - (15×D) + (10×T) + (5×F×100) + (10×B)`

**Components:**
- **V** - Verification (0-1): Account verification status
- **R** - Rating (1-5): Average user rating
- **C** - Completion (0-1): Task completion rate
- **D** - Disputes (0-1): Dispute ratio (negative weight)
- **T** - Timeliness (0-1): On-time report rate
- **F** - Feedback (-1 to +1): Community feedback ratio
- **B** - Behavior (0-1): System behavior score

**Trust Levels:**
- 0-39: Low Trust ⭐
- 40-69: Moderate Trust ⭐⭐⭐
- 70-89: Trusted ⭐⭐⭐⭐
- 90-100: Elite ⭐⭐⭐⭐⭐

---

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with salt rounds
- **Input Validation** - Server-side validation for all inputs
- **SQL Injection Protection** - Parameterized queries
- **XSS Prevention** - Input sanitization
- **CORS Configuration** - Controlled cross-origin requests
- **File Upload Restrictions** - Type and size validation

---

## 🚧 Known Issues & Future Enhancements

### Known Issues
- None currently reported

### Planned Features
- Email verification system
- SMS notifications
- Mobile applications (iOS/Android)
- Advanced analytics dashboard
- API rate limiting
- Multi-language support expansion
- Report comments/discussion threads
- Service provider dashboard
- Automated report resolution tracking

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📞 Contact & Support

For support, questions, or feedback:
- **Email:** support@infratrack.global
- **Website:** [infratrack.global](https://infratrack.global)

---

## 🙏 Acknowledgments

- OpenStreetMap for mapping data
- Leaflet.js for map visualization
- Font Awesome & Bootstrap Icons
- The open-source community

---

**Built with ❤️ by Software Engineering Students**

*Empowering communities through infrastructure transparency*