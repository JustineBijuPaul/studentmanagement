# Student Records Management System

A cloud-native Student Records Management Web Application built with Next.js 16, deployed on AWS with high availability, scalability, and security.

## Features

- ✅ **CRUD Operations**: Create, Read, Update, Delete student records
- ✅ **Responsive UI**: Modern interface built with Tailwind CSS
- ✅ **AWS Integration**: Secrets Manager for secure credential management
- ✅ **High Availability**: Designed for AWS ALB + Auto Scaling
- ✅ **Form Validation**: Client and server-side validation with Zod
- ✅ **Health Checks**: Built-in health endpoint for load balancers
- ✅ **Dark Mode**: Automatic dark mode support

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Next.js API Routes, MySQL, mysql2
- **Cloud**: AWS (EC2, RDS, ALB, Auto Scaling, Secrets Manager)
- **Forms**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 20+
- MySQL 8.0+
- AWS Account (for production deployment)

### Local Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up MySQL database**
   ```bash
   # Create database
   mysql -u root -p -e "CREATE DATABASE student_records;"
   
   # Run schema
   mysql -u root -p student_records < lib/db/schema.sql
   ```

3. **Configure environment variables**
   ```bash
   # Copy example file
   cp .env.local.example .env.local
   
   # Edit .env.local with your database credentials
   ```

   Example `.env.local`:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=student_records
   USE_SECRETS_MANAGER=false
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open application**
   ```
   http://localhost:3000
   ```

## Project Structure

```
studentmanagement/
├── app/
│   ├── api/
│   │   ├── health/           # Health check endpoint
│   │   └── students/         # Student CRUD API routes
│   ├── components/
│   │   ├── StudentTable.tsx  # Student list with actions
│   │   ├── StudentForm.tsx   # Add/Edit form
│   │   └── DeleteConfirmation.tsx
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── lib/
│   └── db/
│       ├── connection.ts     # Database connection with Secrets Manager
│       ├── queries.ts        # Database queries
│       ├── types.ts          # TypeScript types and Zod schemas
│       └── schema.sql        # Database schema
├── .env.local.example        # Environment variables template
├── DEPLOYMENT.md             # AWS deployment guide
└── package.json
```

## API Endpoints

### Students API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | Get all students |
| POST | `/api/students` | Create new student |
| GET | `/api/students/[id]` | Get student by ID |
| PUT | `/api/students/[id]` | Update student |
| DELETE | `/api/students/[id]` | Delete student |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check for ALB |

## AWS Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive AWS infrastructure setup guide.

## Troubleshooting

### Database Connection Error

Check MySQL is running and `.env.local` has correct credentials.

### Port Already in Use

```bash
# Find and kill process using port 3000
lsof -i :3000
kill -9 <PID>
```

## License

Educational project for AWS Academy coursework.
