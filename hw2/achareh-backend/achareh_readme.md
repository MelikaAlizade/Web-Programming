# Achareh Backend API

This project is a simplified backend implementation of the Achareh service platform ,where customers can post service requests and contractors can bid and perform jobs, developed using Django and Django REST Framework (DRF).

It supports multiple user roles, service request workflows, bidding, assignment, completion confirmation, commenting, rating, and ticket-based support.

This project also has Swagger API documentation, implemented using drf-spectacular.

## Features

### Core Functionality

- **User Management**: Registration, authentication with username/email/phone, role-based access control
- **Service Requests (Ads)**: Create, manage, and track service requests with status workflow
- **Bidding System**: Contractors can bid on open service requests
- **Work Completion Flow**: Structured workflow from assignment to completion confirmation
- **Rating & Reviews**: Customers can rate contractors and leave comments
- **Support System**: Ticket-based support with response management
- **Contractor Scheduling**: Time and location management with conflict detection

### User Roles

1. **Customer** - Posts service requests, selects contractors, confirms work completion
2. **Contractor** - Bids on requests, performs work, manages schedule
3. **Support** - Responds to tickets, assists users
4. **Admin** - Full system access, role management (via Django superuser)

### Ad Status Flow

```
OPEN → ASSIGNED → COMPLETED
  ↓        ↓
CANCELED ← ←
```

## Quick Start

### Prerequisites

- Python
- pip

### Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd achareh
```

2. **Create virtual environment**

```bash
python -m venv venv
source venv/bin/activate
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

4. **Run migrations**

```bash
python manage.py makemigrations
python manage.py migrate
```

5. **Create superuser (Admin)**

```bash
python manage.py createsuperuser
```

6. **Run development server**

```bash
python manage.py runserver
```

## API Documentation

### Swagger UI

Access the interactive API documentation at:

```
http://localhost:8000/swagger/
```

### OpenAPI Schema

Raw schema available at:

```
http://localhost:8000/api/schema/
```

### Admin pannel

```
http://localhost:8000/core/admin
```

## Authentication

The API uses Token Authentication. Include the token in request headers:

```
Authorization: Token <your-token-here>
```

### Getting a Token

1. Register: `POST /core/auth/register/`
2. Login: `POST /core/auth/login/`

### Login Methods

You can login using any of:

- Username
- Email
- Phone number

**Example:**

```json
{
  "login": "john_doe", // or "john@example.com" or "09123456789"
  "password": "your_password"
}
```

## API Endpoints Overview

### Authentication

- `POST /core/auth/register/` - Register new user
- `POST /core/auth/login/` - Login
- `GET /core/auth/profile/` - Get current user profile
- `PUT /core/auth/profile/` - Update profile
- `PATCH /core/auth/profile/` - Update partial profile

### User Management

- `POST /core/users/{id}/change-role/` - Change user role (Admin/Support only)
- `GET /core/users/{id}/ads/` - View user's created ads
- `GET /core/users/{id}/performed-ads/` - View contractor's performed ads

### Advertisements (Service Requests)

- `GET /core/ads/` - List all ads
- `POST /core/ads/` - Create new ad (Customer only)
- `POST /core/ads/{id}/assign/` - Assign contractor (Customer only)
- `GET /core/ads/{id}/bids/` - List bids for ad
- `POST /core/ads/{id}/cancel/` - Cancel ad (Customer only)
- `POST /core/ads/{id}/complete/` - Mark work complete (Contractor only)
- `POST /core/ads/{id}/confirm/` - Confirm completion (Customer only)
- `POST /core/ads/{id}/schedule/` - Set execution schedule (Contractor only)
- `GET /core/ads/{id}/` - Get ad details
- `PUT /core/ads/{id}/` - Update ad
- `PATCH /core/ads/{id}/` - Partial update ad

### Bids

- `GET /core/bids/` - List your bids
- `POST /core/bids/` - Create bid (Contractor only)
- `GET /core/bids/{id}/` - Get bid details
- `DELETE /core/bids/{id}/` - Cancel bid

### Comments & Ratings

- `GET /core/comments/` - List comments
- `POST /core/comments/` - Create comment (Customer only, after completion)
- `GET /core/comments/contractor/?contractor_id={id}&rating={1-5}` - Get contractor comments (with optional rating filter)

### Contractors

- `GET /core/contractors/` - List contractors (with filters)
- `GET /core/contractors/{id}/` - Get contractor profile with stats
- `GET /core/contractors/schedule/?date=YYYY-MM-DD` - Get contractor's schedule

### Tickets

- `GET /core/tickets/` - List tickets
- `POST /core/tickets/` - Create ticket
- `GET /core/tickets/{id}/` - Get ticket details
- `PUT /core/tickets/{id}/` - Update ticket
- `PATCH /core/tickets/{id}/` - Partial update ticket
- `DELETE /core/tickets/{id}/` - Delete ticket (Support only)
- `POST /core/tickets/{id}/respond/` - Respond to ticket (Support only)

## Query Parameters

### Ads List

- `status` - Filter by status (OPEN, ASSIGNED, COMPLETED, CANCELED)
- `category` - Filter by category

### Contractors List

- `min_rating` - Minimum average rating (float)
- `min_comments` - Minimum number of comments (integer)
- `ordering` - Sort by: `rating`, `-rating`, `comments`, `-comments`

### Contractor Comments

- `contractor_id` - Required contractor ID
- `rating` - Filter by rating (1-5)

### Contractor Schedule

- `date` - Filter by date (YYYY-MM-DD format)

## Rules

### Access Control

- **Customers** can:

  - Create ads
  - View bids on their ads
  - Assign contractors
  - Cancel their ads
  - Confirm work completion
  - Comment on completed work

- **Contractors** can:

  - Bid on open ads
  - View assigned ads
  - Mark work as complete
  - Manage their schedule
  - Cannot comment on their own work

- **Support** can:

  - View all tickets
  - Respond to tickets
  - Assign contractor role to users
  - View canceled ads

- **Admin** can:
  - Perform all operations
  - Assign any role to users
  - Manage all resources

### Validation Rules

- Ads can only receive bids when status is OPEN
- Only customers who created the ad can assign contractors
- Only assigned contractors can mark work as complete
- Only ad creators can confirm completion
- Comments require a rating between 1-5
- Contractors cannot have schedule conflicts
- Canceled ads are hidden from non-owners (except Support/Admin)

## Database Schema

### Main Models

- **User** - Extended AbstractUser with role and phone
- **Ad** - Service requests with status tracking
- **Bid** - Contractor bids on ads
- **Comment** - Customer reviews with ratings
- **Ticket** - Support tickets

### Relationships

- User → Ads (one-to-many, as creator)
- User → Ads (one-to-many, as performer)
- Ad → Bids (one-to-many)
- Ad → Comments (one-to-many)
- User → Comments (one-to-many, as customer)
- User → Comments (one-to-many, as performer receiving)
- User → Tickets (one-to-many)

## Technology Stack

- **Backend Framework**: Django
- **API Framework**: Django REST Framework
- **API Documentation**: drf-spectacular
- **Database**: SQLite
- **Authentication**: Token-based authentication

## Development Notes

### Code Structure

```
achareh-backend/
├── achareh/          # Project settings
│   ├── settings.py
│   └── urls.py
├── core/              # Main application
│   ├── models.py     # Database models
│   ├── serializers.py # DRF serializers
│   ├── views.py      # API views
│   ├── permissions.py # Custom permissions
│   ├── urls.py       # API URLs
├── manage.py
└── requirements.txt
```

### Design Patterns

- Generic Views from DRF for CRUD operations
- Custom permissions for role-based access
- Token authentication for stateless API
- Comprehensive validation in serializers
- QuerySet filtering for data visibility

## Status Codes

- `200` - OK
- `201` - Created
- `204` - No Content (successful deletion)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

## Workflows

### 1. Complete Authentication Flow

```bash
# 1. Register
POST http://localhost:8000/core/auth/register/
```

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "phone_number": "09123456789",
  "password": "StrongPass123",
  "first_name": "John",
  "last_name": "Doe"
}
```

```bash
# 2. Login
POST http://localhost:8000/core/auth/login
```

```json
{
  "login": "john_doe", // or "john@example.com" or "09123456789"
  "password": "your_password"
}
```

Make sure to get Token from Response for user authentication and then add it to the Headers of Postman:

```
key: Authorization   value: Token d57440fcaf6a89323bc6e650bdfd6ec64a5a867f
```

```bash
# 3. Profile view
GET http://localhost:8000/core/auth/profile
```

### 3. Complete User Flow

```bash
# 1. Changing user role
  # 1.1 first login as admin or support then
POST http://localhost:8000/core/users/{user_id}/change-role/
```

```json
{
  "role": "CONTRACTOR"
}
```

```bash
# 2. Viewing list of adds of a User with its id

  # 2.1 Make sure to login as a customer
  # 2.2 Makeing ads
  POST http://localhost:8000/core/ads/
```

```json
{
  "title": "Fix AC",
  "description": "AC not cooling",
  "category": "Electrical"
}
```

```bash
  # 2.3 View the list of adds of a User with its id
  GET http://localhost:8000/core/users/{user_id}/ads/

```

```json
{
  "title": "Fix AC",
  "description": "AC not cooling",
  "category": "Electrical"
}
```

### 4. Complete Ads Flow

```bash
# 1. Viewing list of adds of a User with its id

  # 1.1 Make sure to login as a customer
  # 1.2 Creating ads
  POST http://localhost:8000/core/ads/

  {
    "title": "Fix AC",
    "description": "AC not cooling",
    "category": "Electrical"
  }

  # 1.3 View the list of adds of a User with its id
  GET http://localhost:8000/core/users/{user_id}/ads/

  {
    "title": "Fix AC",
    "description": "AC not cooling",
    "category": "Electrical"
  }
```

```bash
# 2. Getting full list of ads
GET http://localhost:8000/core/ads/

# or details of one ad
GET http://localhost:8000/core/ads/{ad_id}/
```

```bash
# 3. list of things that customer can do

  # You can see the list of bids on a ad
  GET http://localhost:8000/core/ads/{ad_id}/bids/

  POST http://localhost:8000/core/ads/{ad_id}/cancel/ # only by the creator of the ad and for a not completed ad

  POST http://localhost:8000/core/ads/{ad_id}/assign/ # only if it has bid and ad is open and only by the creator of the ad
  {
  "contractor_id": 0
  }

  POST http://localhost:8000/core/ads/{ad_id}/confirm/ # Only ad creator can confirm completion and for those that Contractor has marked as complete
```

```bash
# 4. list of things that contractor can do

  # As a contractor you can see the performed ads
  GET http://localhost:8000/core/users/{user_id}/performed-ads/

  POST http://localhost:8000/core/ads/{ad_id}/complete/ # Only assigned contractor can mark as complete

  POST http://localhost:8000/core/ads/{ad_id}/schedule/ # Only assigned contractor can set schedule and in a way that has no conflicts with another job
  {
  "execution_time": "2025-12-27T07:37:25.515Z",
  "execution_location": "string"
  }
```

### 5. Complete Service Request Flow(bids, comments & tickets)

```bash
# 1. Login as customer
```

```bash
# 2. Create service request
POST http://localhost:8000/core/ads/
{
  "title": "Need plumber for kitchen sink",
  "description": "Kitchen sink is leaking, needs urgent repair",
  "category": "Plumbing"
}
```

```bash
# 3. Contractor (separate registration) places bid
POST http://localhost:8000/core/bids/
{
  "ad": 1,
  "proposed_price": "150.00",
  "message": "I can fix this today"
}

# Contractor can also Delete its own bid
DELETE http://localhost:8000/core/bids/{bid_id}/

# 4. Customer assigns contractor
POST http://localhost:8000/core/ads/1/assign/
{
  "contractor_id": 2
}

# 5. Contractor sets schedule
POST http://localhost:8000/core/ads/1/schedule/
{
  "execution_time": "2024-12-25T10:00:00Z",
  "execution_location": "123 Main St, Apt 4B"
}

# 6. Contractor completes work
POST http://localhost:8000/core/ads/1/complete/

# 7. Customer confirms completion
POST http://localhost:8000/core/ads/1/confirm/

# 8. Customer leaves review
POST http://localhost:8000/core/comments/
{
  "ad": 1,
  "text": "Excellent work, very professional",
  "rating": 5
}

# Customer can also query on Contractors comments set filters
GET http://localhost:8000/core/comments/contractor/

# Customer can query on Contractors and set filters
GET http://localhost:8000/core/contractor/

GET http://localhost:8000/core/contractor/{id}

GET http://localhost:8000/core/contractor/schedule/
```

### 6. Support Ticket Flow

```bash
# 1. User creates ticket
POST http://localhost:8000/core/tickets/
{
  "title": "Payment issue",
  "message": "I cannot complete payment for ad #5",
  "ad": 5
}

# 2. Support responds
POST http://localhost:8000/core/tickets/1/respond/
{
  "response": "We've resolved the payment issue. Please try again.",
  "status": "CLOSED"
}

# User can also delete a ticket
DELETE http://localhost:8000/core/tickets/{id}/

# Can also view the tickets
GET http://localhost:8000/core/tickets/

GET http://localhost:8000/core/tickets/{id}/
```
