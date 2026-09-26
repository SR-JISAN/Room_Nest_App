Room Nest --- Backend API

Room Nest is a backend server for a property rental and booking
platform. It provides REST APIs for authentication, users, properties,
rooms, amenities, bookings, payments, reviews, and related dashboard
functionality.

Tech Stack

Node.js

Express.js

TypeScript

Prisma ORM

PostgreSQL

Redis

JWT Authentication

Google Authentication

Nodemailer + EJS

Cloudinary

Multer

Zod

PDFKit

Stripe / Payment integration

pnpm

tsup

Biome

Main Features

Authentication & Authorization

User registration with email verification

OTP-based email verification using Redis

Login and logout

Access token and refresh token authentication

Password hashing with bcrypt

Password reset flow

Google authentication

Role-based authorization

Account status management

Protected routes

User Management

Get user profile

Update profile information

Profile image upload

Cloudinary image management

User role and account status handling

Property Management

Create properties

Update properties

Get property details

Get property lists

Delete/soft-delete properties

Property verification and status management

Property images

Property amenities

Property rooms

Landlord/property-owner relationship

Room Management

Create rooms under properties

Update room information

Room type and pricing

Security deposit

Room availability/status management

Amenities

Create amenities

Get amenities

Manage property-amenity relationships

Booking & Sub-booking

Property/room booking

Booking ownership tracking

Booking status management

Payment-related booking flow

Sub-booking support

Booking history

Payments

Payment processing

Payment status tracking

Booking-payment relationship

Payment-related validation

Reviews

Create reviews

Manage property reviews

Review-related validation

Email & Notifications

Registration verification email

Welcome email

Password reset email

EJS email templates

Nodemailer-based email delivery

File & Document Handling

Multipart/form-data upload using Multer

Cloudinary image upload

PDF generation using PDFKit

Project Structure

room_nest_server/
├── prisma/
│   └── schema/
│       └── schema.prisma
│
├── src/
│   ├── app/
│   │   ├── config/
│   │   ├── errors/
│   │   ├── lib/
│   │   ├── middleware/
│   │   └── modules/
│   │       ├── amenities/
│   │       ├── auth/
│   │       ├── booking/
│   │       ├── dashboard/
│   │       ├── payments/
│   │       ├── properties/
│   │       ├── reviews/
│   │       ├── subBooking/
│   │       └── users/
│   │
│   ├── template/
│   │   └── email templates
│   │
│   └── server.ts
│
├── .env
├── package.json
├── prisma7.config.ts
├── tsconfig.json
└── tsup.config.ts

Requirements

Before running the project, install:

Node.js

pnpm

PostgreSQL

Redis

Check Node and pnpm:

node -v
pnpm -v

Installation

Clone the repository and install dependencies:

git clone <YOUR_REPOSITORY_URL>
cd room_nest_server
pnpm install

Environment Variables

Create a .env file in the project root.

Example:




FRONTEND_URL=http://localhost:3000
BACKEND_URL=[http://localhost:5000](https://room-nest-server.vercel.app/)

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

BCRYPT_SALT_ROUNDS=12

REDIS_URL=redis://localhost:6379

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_email_password
SMTP_FROM=your_email

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

Add or remove variables according to the services enabled in your
local environment. Never commit real credentials to Git.

Database Setup

After configuring DATABASE_URL, generate the Prisma client:

pnpm prisma generate

Run migrations when using Prisma migrations:

pnpm prisma migrate dev

For deployment:

pnpm prisma migrate deploy

Development

Start the development server:

pnpm dev

The server will run using:

tsx watch src/server.ts

Build

Create a production build:

pnpm build

The build output is generated in:

dist/

Production

Start the production server:

pnpm start

Code Formatting

Check formatting:

pnpm format:check

Automatically format the source:

pnpm format:fix

Linting

Check lint errors:

pnpm lint:check

Automatically fix lint issues where possible:

pnpm lint:fix

API Architecture

The application follows a modular backend architecture.

A typical module contains:

module/
├── module.controller.ts
├── module.service.ts
├── module.route.ts
├── module.validation.ts
└── module.interface.ts

Request Flow

Client
  ↓
Route
  ↓
Middleware
  ↓
Validation
  ↓
Controller
  ↓
Service
  ↓
Prisma
  ↓
PostgreSQL

Authentication and authorization are handled through middleware before
protected controllers are executed.

Validation

Request payloads are validated using Zod.

Example:

const result = schema.safeParse(req.body);

if (!result.success) {
  // handle validation error
}

Validated data should be passed to the service layer rather than
trusting raw request input.

Authentication

The API uses JWT-based authentication.

Typical flow:

Login
  ↓
Validate credentials
  ↓
Generate access token
  ↓
Generate refresh token
  ↓
Set authentication cookies

Protected requests use the authenticated user information to determine
ownership and authorization.

Role-Based Access

The application supports role-based access control.

Typical roles include:

USER
LANDLORD
ADMIN

Exact roles should follow the current Prisma enum/schema configuration.

Error Handling

The backend uses centralized error handling so controllers and services
can throw application-specific errors.

Example:

throw new AppError(
  httpStatus.NOT_FOUND,
  "User Not Found"
);

The global error handler then converts errors into a consistent API
response.

Security Practices

Passwords are hashed with bcrypt

JWT secrets are stored in environment variables

Authentication tokens should not be hard-coded

Request bodies are validated with Zod

Protected routes use authentication middleware

Role-based authorization is applied to restricted resources

Sensitive credentials should never be committed to Git

Uploaded files should be validated before processing

Useful Commands

Command                     Purpose

pnpm install              Install dependencies
pnpm dev                  Start development server
pnpm build                Build production bundle
pnpm start                Start production server
pnpm prisma generate      Generate Prisma client
pnpm prisma migrate dev   Run development migration
pnpm format:check         Check formatting
pnpm format:fix           Fix formatting
pnpm lint:check           Check lint
pnpm lint:fix             Fix lint issues

API Documentation

API endpoints can be documented here as the project evolves.

Suggested structure:

/auth
/users
/properties
/rooms
/amenities
/bookings
/sub-bookings
/payments
/reviews
/dashboard

For API testing, use Postman or another REST API client.

Environment & Deployment

Before deployment:

Configure production environment variables.

Configure the production PostgreSQL database.

Configure Redis.

Configure Cloudinary.

Configure email credentials.

Configure Google OAuth credentials if enabled.

Configure payment credentials if enabled.

Run Prisma generation/migrations.

Build the application.

Start the production server.

Author

Shajidur Rahman Jisan

Full Stack Web Developer

GitHub: https://github.com/SR-JISAN

LinkedIn: https://linkedin.com/in/dev-md-jisan/
