# SyncBridge

SyncBridge is a modern data synchronization platform that enables seamless device synchronization and secure data management across multiple platforms.

## 🚀 Features

- Multi-device synchronization
- Secure authentication system
- Real-time data syncing
- Device management
- Email notifications
- Security event tracking
- Storage quota management

## 🛠 Tech Stack

- **Backend**: NestJS (Node.js)
- **Database**: PostgreSQL 17
- **Authentication**: JWT
- **Email**: SMTP with Handlebars templates
- **Container**: Docker
- **API Documentation**: Swagger/OpenAPI

## 📋 Prerequisites

- Node.js (v18 or higher)
- Docker
- npm or yarn
- PostgreSQL 17

## 🔧 Installation

1. **Clone the repository**
   bash
   git clone https://github.com/yourusername/syncbridge.git
   cd syncbridge

2. **Set up environment variables**

Create a `.env` file in the root directory:
env
``
`Database Configuration`
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=syncbridge
JWT Configuration
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
MAIL_FROM_NAME=SyncBridge
MAIL_FROM_ADDRESS=noreply@syncbridge.com
SUPPORT_EMAIL=support@syncbridge.com
Application Configuration
PORT=3500
FRONTEND_URL=http://localhost:3000
``

3. **Start the database**
   bash
   docker run --name syncbridge-db \
   -e POSTGRES_PASSWORD=postgres \
   -e POSTGRES_DB=syncbridge \
   -e POSTGRES_USER=postgres \
   -p 5432:5432 \
   -d postgres:latest

4. **Start the Redis**
   bash
   docker run --name syncbridge-redis \
   -e REDIS_PASSWORD=redis \
   -p 6379:6379 \
   -d redis:latest

5. **Install dependencies**
   bash
   npm install
   pnpm install(im using pnpm)
   or
   yarn install
6. **Start the application**

bash
Development
npm run start:dev
Production
npm run build
npm run start:prod

## 🗄️ Database Schema

### Core Entities:

#### 👤 Users
- Primary user account information
- Email and authentication details
- Account status and subscription management
- Storage quota tracking
- Language and timezone preferences

#### 📱 Devices
- Device identification and type
- Operating system and browser information
- Sync preferences and settings
- Activity tracking
- Authentication status

#### 🔄 Sync Data
- Multi-type content support (Text, File, Image, URL, Note, Task)
- Version control and conflict management
- Metadata and encryption
- Size and checksum tracking
- Parent-child relationship support

#### 📋 Clipboard History
- Multi-format clipboard content (Text, Image, File, URL, HTML, RTF)
- Source device tracking
- Favorites and expiration management
- Size and checksum verification

#### 📚 Reading Progress
- Content position tracking
- Completion status
- Device-specific progress
- Metadata storage

### Management Entities:

#### 🔐 Device Authentication
- Refresh token management
- Expiration tracking
- Revocation handling
- IP tracking

#### 👥 Device Groups
- Group management and settings
- Device membership tracking
- Sync settings per group
- Hierarchical device organization

#### 🛡️ Security Events
- Comprehensive security logging
- Event severity tracking
- IP tracking
- Resolution management

#### ⚡ Sync Status
- Sync state management
- Conflict resolution strategies
- Error tracking and retry management
- Version control

### Key Features:

- **Relationships**: Robust entity relationships with proper foreign key constraints
- **Audit Trail**: Comprehensive timestamp tracking across entities
- **Data Integrity**: Checksums and version control
- **Security**: Built-in security event tracking and device authentication
- **Flexibility**: JSON storage for metadata and settings
- **Scalability**: Efficient indexing and unique constraints

## 🔒 API Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Login/Register**: Obtain access and refresh tokens
2. **Access Token**: Valid for 15 minutes
3. **Refresh Token**: Valid for 7 days
4. **Device Tracking**: Each device gets a unique identifier

## 📱 Device Management

- Multiple device support
- Device authentication
- Activity tracking
- Sync status monitoring
- Auto-sync configuration

## 🔐 Security Features

- Password hashing with bcrypt
- Email verification
- Device fingerprinting
- Security event logging
- IP tracking
- Rate limiting
- Session management

## 📨 Email Notifications

Automated emails for:

- Account verification
- Password reset
- New device login
- Security alerts
- Subscription updates


## 🤝 Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request


## 👥 Authors

- Seif Eddine Jlassi AKA Laakri - Initial work

## 🙏 Acknowledgments

- NestJS team
- PostgreSQL community
- Contributors and supporters
