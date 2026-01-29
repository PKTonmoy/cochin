# PARAGON Coaching Center Management System

A comprehensive MERN stack web application for managing a coaching center with Admin, Staff, and Student roles.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Staff, Student)
- Account lockout after failed login attempts
- Password change on first login

### 👨‍🎓 Student Management
- Student registration with auto-generated roll numbers
- Photo uploads via Cloudinary
- Payment tracking with due amounts
- Student portal for viewing results

### 💳 Payment System
- Manual payment verification workflow
- A4 printable PDF receipts with Puppeteer
- QR code on receipts linking to student portal
- Login credentials included on initial receipt

### 📝 Test & Results
- Test/exam creation with subjects and marks
- Excel import for bulk result entry
- Column mapping and validation before import
- Rollback support for imported batches
- Grade and rank calculation

### 🌐 Website Content
- Editable landing page sections
- Dynamic header, hero, about, teachers, services content
- Site content management from admin panel

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT, bcryptjs
- **File Storage**: Cloudinary
- **PDF Generation**: Puppeteer
- **Excel Processing**: ExcelJS
- **Email**: Nodemailer

### Frontend
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS
- **State Management**: React Query
- **Routing**: React Router DOM
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast

## Project Structure

```
paragon2/
├── client/                 # React frontend
│   ├── src/
│   │   ├── contexts/       # Auth context
│   │   ├── layouts/        # Page layouts
│   │   ├── lib/            # API utilities
│   │   └── pages/          # Page components
│   │       ├── admin/      # Admin dashboard pages
│   │       ├── public/     # Landing, login pages
│   │       └── student/    # Student portal pages
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # Database, Cloudinary config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, upload, error handlers
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API routes
│   │   ├── scripts/        # Seed script
│   │   └── services/       # Receipt service
│   └── package.json
└── package.json            # Root package with workspaces
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd paragon2
```

2. Install all dependencies:
```bash
npm run install:all
```

3. Configure environment variables:
```bash
cp server/.env.example server/.env
# Edit server/.env with your credentials
```

4. Seed the database with initial data:
```bash
npm run seed
```

5. Start development servers:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Default Credentials

After seeding, use these credentials:

**Admin Login:**
- Email: admin@paragon.com
- Password: admin123

**Staff Login:**
- Email: staff@paragon.com
- Password: staff123

**Student Login:**
- Roll: (Created after adding a student)
- Password: (Phone number used during registration)

## Environment Variables

Create a `.env` file in the `server` directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/paragon

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=PARAGON <noreply@paragon.com>

# Client URL
CLIENT_URL=http://localhost:5173
NODE_ENV=development
PORT=5000
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin/Staff login
- `POST /api/auth/student-login` - Student login
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/me` - Get current user

### Students
- `GET /api/students` - List students (paginated)
- `POST /api/students` - Create student
- `GET /api/students/:id` - Get student details
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `GET /api/students/dashboard` - Student dashboard data
- `GET /api/students/export` - Export to Excel

### Payments
- `GET /api/payments` - List payments
- `POST /api/payments` - Create payment
- `POST /api/payments/verify` - Verify payment (activates student)
- `PUT /api/payments/:id` - Update payment

### Results & Uploads
- `POST /api/uploads/results/upload` - Upload Excel file
- `POST /api/uploads/results/validate` - Validate mapping
- `POST /api/uploads/results/import` - Execute import
- `POST /api/uploads/results/rollback` - Rollback batch
- `GET /api/uploads/template` - Download template

### Tests
- `GET /api/tests` - List tests
- `POST /api/tests` - Create test
- `PUT /api/tests/:id` - Update test
- `POST /api/tests/:id/publish` - Publish test results

### Results
- `GET /api/results` - List all results
- `GET /api/results/test/:testId` - Results by test
- `GET /api/results/student/:studentId` - Results by student

### Site Content
- `GET /api/site-content` - Get all content
- `GET /api/site-content/:key` - Get section content
- `PUT /api/site-content/:key` - Update content

## Workflow: Student Registration

1. **Admin/Staff creates student** → Status: `pending_payment`
2. **Student pays offline** → Admin records payment
3. **Admin verifies payment** → Student activated
4. **Receipt generated** → Contains roll number + phone as password
5. **Student logs in** → Uses roll and phone number
6. **Password change** → Prompted to change password

## License

ISC
