# TOEIC Center Management System - AI Coding Guide

## Architecture Overview
This is a **full-stack LMS (Learning Management System)** for TOEIC test preparation with:
- **Backend**: Flask API (`backend-for-lms/`) with MySQL database
- **Frontend**: React + Vite SPA (`frontend-for-lms/`) with Bootstrap/TailwindCSS

## Database & Models Architecture

### User Model Pattern
- **Base User Model**: `user_model.py` with polymorphic inheritance using `user_type` discriminator
- **Specialized Models**: `Teacher` and `Student` models **DO NOT inherit** from User - they're separate tables with identical user fields
- **ID Generation**: Auto-generated IDs follow pattern `S00000001` (Students), `T00000001` (Teachers)
- **Password Handling**: Uses Werkzeug's `generate_password_hash()` and `check_password_hash()`

### Database Migration Workflow
```bash
# Backend setup (from backend-for-lms/)
flask db init      # Initialize migrations (already done)
flask db migrate   # Generate migration after model changes
flask db upgrade   # Apply migrations to database
```

### Key Model Relationships
- Educational entities: `Course`, `LearningPath`, `Lesson`, `Test`, `Question`
- User progress: `Enrollment`, `Score`, `StudentWords`
- Scheduling: `Class`, `Schedule`, `Room`

## Backend Patterns

### Service Layer Architecture
- **Routes** (`routes/`) handle HTTP requests, delegate to services
- **Services** (`services/`) contain business logic, database operations
- **Models** (`models/`) define database schema and basic operations
- **Utils** (`utils/`) provide cross-cutting concerns (auth, validation, email)

### API Response Pattern
Use standardized responses from `utils/response_utils.py`:
```python
from app.utils.response_utils import success_response, error_response, validation_error_response

# Success response
return success_response(data=result, message="Operation successful")

# Error handling
return error_response(message="Error occurred", status_code=400)
```

### Authentication & Authorization
- **JWT tokens** created via `AuthService._create_token(user_id, role)`
- **Email verification** required for students (not teachers)
- **Password reset** uses JWT tokens with 1-hour expiration
- **CORS** configured for multiple local dev ports (5173-5177)

### Configuration Pattern
- Environment-specific configs in `config.py`: `DevelopmentConfig`, `ProductionConfig`
- Database connection with connection pooling and auto-reconnect
- Email configured for Gmail SMTP with Flask-Mail

## Frontend Patterns

### Component Structure
- **Layout**: `components/layout/` (Header, Footer)
- **Feature Components**: `components/auth/`, `components/admin/`, `components/common/`
- **Pages**: `pages/` for route components
- **Services**: `services/` for API communication

### API Service Pattern
All API calls follow this pattern in `services/`:
```javascript
// Standard API call with error handling
const response = await fetch(`${API_BASE_URL}/endpoint`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

const result = await response.json();
if (!response.ok) {
  throw new Error(result.message || 'Operation failed');
}
```

### State Management
- **localStorage** for auth tokens and user data
- **React hooks** for component state
- **Service functions** return promises for async operations

### Authentication Flow
1. Login stores `token`, `role`, `user` in localStorage
2. Services include token in headers for authenticated requests
3. `authService.js` provides: `isAuthenticated()`, `getCurrentUser()`, `logout()`

## Development Workflows

### Backend Development
```bash
cd backend-for-lms
# Install dependencies
pip install -r requirements.txt

# Set up database
flask db upgrade

# Run development server
flask run --debug
# OR
python run.py
```

### Frontend Development
```bash
cd frontend-for-lms
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Database Changes
1. Modify model in `app/models/`
2. Generate migration: `flask db migrate -m "Description"`
3. Review generated migration in `migrations/versions/`
4. Apply: `flask db upgrade`

## Key Integration Points

### Email System
- **Verification emails** sent via `AuthService._send_verification_email()`
- **Password reset** emails with JWT tokens
- **Templates** in `app/templates/` for email verification results

### Error Handling
- **Backend**: Standardized error responses with rollback on exceptions
- **Frontend**: Network error detection and user-friendly messages
- **Validation**: Both client-side and server-side validation

### CORS Configuration
Frontend dev servers (ports 5173-5177) are pre-configured in Flask CORS settings.

## File Naming Conventions
- **Models**: `*_model.py` (e.g., `student_model.py`)
- **Routes**: `*_route.py` (e.g., `auth_route.py`)
- **Services**: `*_service.py` (e.g., `auth_service.py`)
- **Components**: PascalCase (e.g., `AuthPage.jsx`)
- **Services**: camelCase (e.g., `authService.js`)

## Critical Dependencies
- **Backend**: Flask 2.3.3, SQLAlchemy 3.0.5, Flask-Migrate 4.0.5, PyMySQL 1.1.0
- **Frontend**: React 19.1.1, Vite 7.1.2, Bootstrap 5.3.8, React Router 7.9.1

## Common Gotchas
- Models use separate tables (not inheritance) - update both Student and Teacher models when changing user fields
- Email verification is required for students but not teachers
- Database URI is hardcoded in config - change for different environments
- Frontend services expect specific API response format with `data` property