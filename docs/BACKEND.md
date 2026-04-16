# CodeAether Backend Requirements & API Specification

**Document Version**: 2.0  
**Date**: April 15, 2026  
**Planned API Target**: ASP .NET Core 7+ (User/Profile) + Supabase (Training/Realtime)  
**Database**: SQL Server (Profiles/Auth) · PostgreSQL via Supabase (Training)  
**Authentication**: JWT (JSON Web Tokens) — currently client-side, must move server-side  

---

## Table of Contents

1. [Current Implementation Status](#current-implementation-status)
2. [Security Gaps & Required Fixes](#security-gaps--required-fixes)
3. [Missing API Requirements](#missing-api-requirements)
4. [Environment Variables](#environment-variables)
5. [Architecture Overview](#architecture-overview)
6. [Security Requirements](#security-requirements)
7. [Authentication & Authorization](#authentication--authorization)
8. [Database Schema](#database-schema)
9. [API Endpoints](#api-endpoints)
10. [Data Validation Rules](#data-validation-rules)
11. [Error Handling](#error-handling)
12. [Rate Limiting & Quotas](#rate-limiting--quotas)
13. [File Handling](#file-handling)
14. [Deployment & Infrastructure](#deployment--infrastructure)

---

## Current Implementation Status

> This section documents what is **actually built and running** as of v2.0. Everything below it is the planned production backend that is not yet implemented.

### What Exists Today

| Component | Implementation | Location | Notes |
|-----------|---------------|----------|-------|
| **Badge Generation API** | Vercel Edge Function | `api/agent/run.js` | Gemini 1.5 Flash; generates 3–5 training badges with YouTube paths |
| **Authentication** | Client-side only | `src/context/AuthContext.jsx` | PBKDF2-SHA256 (100k iterations) + HS256 JWT via `jose`; stored in `localStorage` + cookie |
| **User Registry** | `localStorage` | `src/utils/userStorage.js` | Keys: `ca_users`, `ca_profiles`, `ca_avatars` |
| **Avatar Storage** | `localStorage` (base64) | `src/utils/userStorage.js` | Auto-compresses to ≤300 KB using Canvas API |
| **Profile Storage** | `localStorage` | `src/utils/userStorage.js` | Full UserProfile JSON stored per username |
| **Training Persistence** | `localStorage` | `src/utils/training/hunterStorage.js` | Hunter profile, badges, goals, XP ledger |
| **AI Profile Extraction** | Client-side fetch → Gemini API | `src/utils/geminiAgents.js` | Agent Alpha: Gemini 2.5 Flash; resume → UserProfile JSON |
| **AI Avatar Generation** | Client-side fetch → Gemini API | `src/utils/geminiAgents.js` | Agent Beta: Gemini 2.0 Flash; photo → RPG portrait |
| **Contact Form Relay** | Client-side fetch → CallMeBot | `src/utils/whatsapp.js` | WhatsApp via CallMeBot API; API key exposed in browser |
| **Static Demo Profiles** | Bundled JSON | `src/data/users/` | `sumit-thakur.json` (real), `boilerplate.json` (demo) |

### Current Data Flow (Client-Only)

```
Registration:
  Browser → Gemini API (profile extraction) → localStorage
  Browser → Gemini API (avatar generation)  → localStorage

Portfolio View:
  Browser → localStorage (ca_profiles) → React sections

Training:
  Browser → localStorage (hunterStorage) → Zustand store → UI
  Browser → /api/agent/run (Vercel Edge) → Gemini → badges → localStorage

Contact:
  Browser → CallMeBot API (WhatsApp) ← API key in browser (INSECURE)
```

### Active Vercel Edge Function

**`POST /api/agent/run`**  
Input: `{ username, level, class, goals, trigger }`  
Output: `{ badges: [...], badgesGenerated: number }`  
Model: Gemini 1.5 Flash  
Auth: None (internal-only call from GoalsEditor)  
Env var required: `GEMINI_API_KEY`

---

## Security Gaps & Required Fixes

> These are **must-fix issues** before production launch. The current implementation is appropriate for a demo/portfolio but not for production with real user data.

### CRITICAL — Fix Before Launch

| # | Gap | Current State | Required Fix |
|---|-----|---------------|--------------|
| 1 | **WhatsApp API key exposed in browser** | `WHATSAPP_API_KEY` fetched from client in `whatsapp.js` | Move to server-side relay endpoint: `POST /api/contact/send` |
| 2 | **JWT secret resides on client** | JWT signed with hardcoded secret in `AuthContext.jsx` | JWT must be issued and verified server-side only |
| 3 | **Passwords never verified server-side** | PBKDF2 hash lives in `localStorage` (`ca_users`) — client verifies itself | Move auth to backend; browser sends credentials, server responds with JWT |
| 4 | **All user data in localStorage** | Any user can read/modify profiles of other users via DevTools | Profiles, avatars, hunter data must live in a database |
| 5 | **Gemini API key exposed in browser** | `GEMINI_API_KEY` used directly in `geminiAgents.js` (client-side fetch) | Proxy all Gemini calls through a Vercel Edge Function |

### LOW PRIORITY (Post-Launch)

| # | Gap | Recommendation |
|---|-----|---------------|
| 6 | `/api/agent/run` has no auth | Any request can trigger badge generation (costs money) | Add `Authorization` header check or Vercel-signed token |
| 7 | No rate limiting on agent endpoint | DDoS/abuse possible | Implement IP-based rate limiting in `run.js` |
| 8 | Avatar stored as base64 in localStorage | Hits ~5 MB localStorage quota quickly | Move to Vercel Blob or Cloudinary |

---

## Missing API Requirements

> Minimum server-side endpoints required to replace the current client-only implementation in production.

### Priority 1 — Auth (Required to remove localStorage auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create user; hash password server-side; return JWT |
| `POST` | `/api/auth/signin` | Verify credentials; return JWT + refresh token |
| `POST` | `/api/auth/refresh` | Exchange refresh token for new access token |
| `POST` | `/api/auth/logout` | Revoke refresh token |
| `GET` | `/api/auth/check-username` | Check if username is available `?username=...` |

### Priority 2 — Profile & Avatar (Required to remove localStorage profiles)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/profiles` | Save AI-generated profile after registration |
| `GET` | `/api/profiles/{username}` | Retrieve profile by username (public) |
| `PUT` | `/api/profiles/{username}` | Update profile (auth required, own profile only) |
| `DELETE` | `/api/profiles/{username}` | Delete profile and all associated data |
| `POST` | `/api/profiles/{username}/avatar` | Upload avatar image (max 5 MB) |
| `GET` | `/api/avatars/{username}` | Serve avatar (public) |

### Priority 3 — Proxy Endpoints (Required to hide API keys from browser)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/generate-profile` | Proxy: resume + LinkedIn → Gemini → UserProfile JSON |
| `POST` | `/api/ai/generate-avatar` | Proxy: photo → Gemini → RPG avatar base64 |
| `POST` | `/api/contact/send` | Proxy: contact form → CallMeBot WhatsApp relay |

### Priority 4 — Training Sync (Required to move hunterStorage out of localStorage)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/training/{username}/profile` | Fetch hunter profile |
| `PUT` | `/api/training/{username}/profile` | Update hunter profile |
| `GET` | `/api/training/{username}/badges` | Fetch badges list |
| `PUT` | `/api/training/{username}/badges` | Sync badges array |
| `GET` | `/api/training/{username}/goals` | Fetch goals |
| `POST` | `/api/training/{username}/goals` | Add goal; optionally trigger badge agent |
| `DELETE` | `/api/training/{username}/goals/{goalId}` | Remove goal |
| `POST` | `/api/training/{username}/xp` | Award XP; calculate level-up; return result |

> The training endpoints align with the Supabase schema defined in `docs/TRAINING.md`. Recommend implementing training endpoints directly as Supabase RPC functions or via a lightweight Vercel Edge layer, and keeping the ASP .NET Core backend focused on user auth and profile storage.

---

## Environment Variables

> All variables must be set in Vercel Project Settings → Environment Variables. **Never commit these to source control.**

### Currently Required (Vercel Edge Function)

| Variable | Used By | Required | Notes |
|----------|---------|----------|-------|
| `GEMINI_API_KEY` | `api/agent/run.js` | Yes | Google AI Studio API key |

### Currently Exposed in Browser (Must Fix)

| Variable | Currently Used By | Should Move To |
|----------|------------------|----------------|
| `GEMINI_API_KEY` | `src/utils/geminiAgents.js` | `api/ai/generate-profile.js`, `api/ai/generate-avatar.js` |
| `WHATSAPP_PHONE` | `src/utils/whatsapp.js` | `api/contact/send.js` |
| `WHATSAPP_API_KEY` | `src/utils/whatsapp.js` | `api/contact/send.js` |

### Full Required Variable Set (Production)

| Variable | Service | Example |
|----------|---------|---------|
| `GEMINI_API_KEY` | Google Gemini | `AIzaSy...` |
| `JWT_SECRET` | Backend Auth | 64-char random string |
| `WHATSAPP_PHONE` | CallMeBot | `+919876543210` |
| `WHATSAPP_API_KEY` | CallMeBot | `abc123xyz` |
| `DATABASE_URL` | SQL Server / Supabase | connection string |
| `SUPABASE_URL` | Supabase (training) | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase (training) | `eyJh...` |
| `SUPABASE_SERVICE_KEY` | Supabase (server-only) | `eyJh...` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob (avatars) | `vercel_blob_...` |
| `ALLOWED_ORIGINS` | CORS | `https://codeaether.com` |

---

## Architecture Overview (Planned Backend)

### System Components

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   React     │◄───────►│  ASP .NET    │◄───────►│ SQL Server  │
│ Frontend    │  HTTPS  │  Backend API │  EF ORM │ Database    │
└─────────────┘         └──────────────┘         └─────────────┘
                              ▲
                              │
                         JWT Auth
                              │
                        Session Tokens
```

### Data Flow

1. **Registration Flow**:
   - Client creates account → Backend validates & stores credentials
   - Frontend calls AI agents (local) to generate profile + avatar
   - Frontend uploads generated profile + avatar to backend
   - Backend validates, stores, and returns confirmation

2. **Authentication Flow**:
   - Client sends username/password → Backend verifies & returns JWT
   - Client stores JWT in localStorage + cookie
   - Client includes JWT in all subsequent requests

3. **Profile Retrieval Flow**:
   - Client requests `/api/profiles/{username}` with JWT
   - Backend validates JWT, retrieves profile from database
   - Response includes profile data + avatar metadata

### Technology Stack (Backend)

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | ASP .NET Core | 7.0+ |
| Language | C# | 11+ |
| ORM | Entity Framework Core | 7.0+ |
| Database | SQL Server | 2019+ |
| Authentication | JWT Bearer | - |
| Validation | FluentValidation | 11+ |
| Logging | Serilog | - |
| API Documentation | Swagger/OpenAPI | 3.0 |

---

## Security Requirements

### 1. Password Security

**MUST:**
- Hash passwords using PBKDF2 (minimum 100,000 iterations) or bcrypt
- Generate cryptographically secure salts (minimum 32 bytes)
- Never store plain-text passwords
- Enforce minimum 6 characters (validated on client)
- Recommend 12+ characters with uppercase, numbers, special chars

**Code Pattern (C#):**
```csharp
// Example using Microsoft.AspNetCore.Cryptography.KeyDerivation
public static string HashPassword(string password, out string salt)
{
    byte[] saltBytes = new byte[128 / 8];
    using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
    {
        rng.GetBytes(saltBytes);
    }
    
    string hashed = Convert.ToBase64String(KeyDerivation.Pbkdf2(
        password: password,
        salt: saltBytes,
        prf: KeyDerivationPrf.HMACSHA256,
        iterationCount: 100000,
        numBytesRequested: 256 / 8));
    
    salt = Convert.ToBase64String(saltBytes);
    return hashed;
}
```

### 2. JWT Token Security

**MUST:**
- Use HS256 (HMAC-SHA256) or RS256 (RSA-SHA256) signing
- Token expiration: 30 days for "remember me" cookies, 1 hour for session tokens
- Refresh token rotation on each use
- Validate token signature on every request
- Check token hasn't expired before processing requests

**Token Payload (Claims):**
```json
{
  "sub": "sumit-thakur",
  "username": "sumit-thakur",
  "email": "optional@example.com",
  "iat": 1712973600,
  "exp": 1743509600,
  "iss": "codeaether-api",
  "aud": "codeaether-frontend"
}
```

### 3. HTTPS & Transport Security

**MUST:**
- All endpoints require HTTPS (TLS 1.2+)
- Redirect HTTP → HTTPS
- Enable HSTS (HTTP Strict-Transport-Security) header
- Include Secure flag on JWT cookies
- Include HttpOnly flag on JWT cookies (prevent XSS access)
- Include SameSite=Strict on JWT cookies (prevent CSRF)

**Response Headers:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; script-src 'self'
```

### 4. CORS (Cross-Origin Resource Sharing)

**Allowed Origins:**
- `http://localhost:5173` (dev)
- `http://localhost:3000` (dev)
- `https://codeaether.com` (production)
- `https://www.codeaether.com` (production)

**Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS  
**Allowed Headers:** Content-Type, Authorization, Accept  
**Max Age:** 86400 seconds (1 day)

```csharp
services.AddCors(options =>
{
    options.AddPolicy("CodeAetherPolicy", policyBuilder =>
    {
        policyBuilder
            .WithOrigins("https://codeaether.com", "https://www.codeaether.com")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials()
            .SetIsOriginAllowedToAllowWildcardSubdomains()
            .WithExposedHeaders("X-Total-Count", "X-Page-Number");
    });
});
```

### 5. Input Validation & Sanitization

**MUST:**
- Validate all input on server-side (never trust client validation)
- Reject requests with missing required fields before processing
- Use parameterized queries (Entity Framework handles this)
- Sanitize strings to remove malicious content
- Validate file uploads (size, type, content)
- Implement request body size limits (max 50MB for profile + avatar)

**Example (C#):**
```csharp
public class CreateProfileRequest
{
    [Required]
    [StringLength(50, MinimumLength = 3)]
    public string Username { get; set; }
    
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string DisplayName { get; set; }
    
    [MaxLength(80)]
    public string Tagline { get; set; }
    
    [EnumDataType(typeof(RankEnum))]
    public string Rank { get; set; }
}
```

### 6. Rate Limiting

**Limits:**
- 100 requests per minute per IP (global)
- 10 requests per minute per user (authenticated)
- 5 registration attempts per 15 minutes per IP
- 3 login attempts per 15 minutes per username (account lockout after)

### 7. Avatar File Security

**MUST:**
- Validate MIME type (image/jpeg, image/png, image/webp only)
- Check file magic bytes (not just extension)
- Max file size: 5MB (pre-compression)
- Store avatars in isolated directory with no direct web access
- Generate unique filenames: `{username}_{timestamp}_{randomId}.jpg`
- Never expose server file paths to client
- Return avatars through authenticated endpoint only

### 8. Resume File Handling

**MUST:**
- Accept only PDF and DOCX files
- Max file size: 25MB
- Store resumesin temporary directory, delete after AI processing
- Never expose resume content to other users
- Hash resume content to detect duplicates (optional for analytics)
- Log all resume uploads for audit trail

### 9. SQL Injection & NoSQL Injection Prevention

**MUST:**
- Use Entity Framework Core parameterized queries exclusively
- Never construct SQL strings with string concatenation
- Use `FromSqlInterpolated()` if raw SQL needed
- Never use `FromSql()` with string concatenation

**WRONG:**
```csharp
// ❌ VULNERABLE
var users = context.Users.FromSql($"SELECT * FROM Users WHERE Username = '{username}'");
```

**CORRECT:**
```csharp
// ✅ SAFE
var users = context.Users.FromSqlInterpolated($"SELECT * FROM Users WHERE Username = {username}");
```

### 10. Data Encryption

**AT REST:**
- Encrypt sensitive data in database (email if stored, contact info)
- Use TDE (Transparent Data Encryption) at database level
- Store API keys in Azure Key Vault (not in code/config)

**IN TRANSIT:**
- All communication over HTTPS/TLS 1.2+
- Implement certificate pinning in mobile apps (if applicable)

### 11. Logging & Monitoring

**MUST LOG:**
- All authentication attempts (success and failure)
- All profile modifications (who, what, when)
- All API errors with request context
- All file uploads/downloads
- Rate limit violations

**MUST NOT LOG:**
- Passwords or password hashes
- JWT tokens
- Full request bodies (log summaries instead)
- Personal identifying information (PII) outside audit logs

**Serilog Configuration:**
```csharp
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .WriteTo.Console()
    .WriteTo.File("logs/codeaether-.txt", rollingInterval: RollingInterval.Day)
    .WriteTo.ApplicationInsights(telemetryClient, TelemetryConverter.Traces)
    .CreateLogger();
```

---

## Authentication & Authorization

### JWT Workflow

```
1. User submits credentials (POST /api/auth/register or /api/auth/signin)
2. Backend validates credentials against database
3. Backend generates JWT token with user claims
4. Backend returns JWT in response + sets cookie
5. Client stores JWT in localStorage
6. Client includes JWT in Authorization header for all requests:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
7. Backend middleware validates JWT on every request
8. If valid, extracts claims and sets HttpContext.User
9. If invalid/expired, returns 401 Unauthorized
```

### Token Refresh Strategy

**Option 1: Sliding Window**
- Each successful request extends token expiration by X minutes
- Reduces logout lag but increases token lifetime per active session

**Option 2: Refresh Tokens**
- Access token expires in 1 hour
- Refresh token expires in 30 days
- Client uses refresh token to get new access token
- More secure, prevents token theft impact

**Recommendation**: Implement both:
- Short-lived access tokens (1 hour)
- Long-lived refresh tokens (30 days)
- Rotation of refresh tokens on use

### Permission Model

**Roles:**
- `User` - Standard user, can view own profile, create new registration
- `Admin` - Can view/edit any profile, manage users (future)
- `System` - Internal service accounts for AI agents (future)

**Permissions:**
```csharp
public enum Permission
{
    ReadOwnProfile,
    UpdateOwnProfile,
    DeleteOwnProfile,
    ReadAllProfiles,        // Admin only
    UpdateAnyProfile,       // Admin only
    DeleteAnyProfile,       // Admin only
    ManageUsers,            // Admin only
}
```

**Authorization Example (C#):**
```csharp
[Authorize]
[HttpGet("api/profiles/{username}")]
public async Task<IActionResult> GetProfile(string username)
{
    var currentUser = User.FindFirst("username")?.Value;
    
    // Allow user to read own profile, or admin to read any
    if (username != currentUser && !User.IsInRole("Admin"))
    {
        return Forbid();
    }
    
    var profile = await context.Profiles.FirstOrDefaultAsync(p => p.Username == username);
    return Ok(profile);
}
```

---

## Database Schema

### Tables

#### Users Table
```sql
CREATE TABLE Users (
    UserId BIGINT PRIMARY KEY IDENTITY(1,1),
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Email NVARCHAR(254) UNIQUE,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    PasswordSalt NVARCHAR(MAX) NOT NULL,
    DisplayName NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    LastLoginAt DATETIME2,
    IsActive BIT NOT NULL DEFAULT 1,
    IsEmailVerified BIT NOT NULL DEFAULT 0,
    
    INDEX idx_username NONCLUSTERED (Username),
    INDEX idx_email NONCLUSTERED (Email)
);
```

#### Profiles Table
```sql
CREATE TABLE Profiles (
    ProfileId BIGINT PRIMARY KEY IDENTITY(1,1),
    UserId BIGINT NOT NULL,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    DisplayName NVARCHAR(100) NOT NULL,
    Tagline NVARCHAR(80),
    AvatarUrl NVARCHAR(500),
    Status NVARCHAR(50),                         -- 'available', 'employed', 'not-looking'
    Theme NVARCHAR(50),                          -- 'solo-leveling'
    Rank NVARCHAR(1),                            -- 'E', 'D', 'C', 'B', 'A', 'S'
    Level INT DEFAULT 1,
    CurrentXP INT DEFAULT 0,
    MaxXP INT DEFAULT 10000,
    FirstName NVARCHAR(50),
    LastName NVARCHAR(50),
    Role NVARCHAR(100),                          -- e.g. 'Full Stack Developer'
    Stack NVARCHAR(500),                         -- e.g. 'React · Node.js · Python'
    Location NVARCHAR(100),
    AlertText NVARCHAR(200),
    Bio NVARCHAR(MAX),                           -- JSON array of paragraphs
    GitHubUsername NVARCHAR(100),
    LinkedInUrl NVARCHAR(500),
    HeatmapSeed NVARCHAR(MAX),                   -- JSON array of 364 values
    ProfileFieldsJson NVARCHAR(MAX),             -- JSON
    QuickStatsJson NVARCHAR(MAX),                -- JSON
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT fk_user FOREIGN KEY (UserId) REFERENCES Users(UserId),
    INDEX idx_username NONCLUSTERED (Username),
    INDEX idx_userid NONCLUSTERED (UserId)
);
```

#### Skills Table
```sql
CREATE TABLE Skills (
    SkillId BIGINT PRIMARY KEY IDENTITY(1,1),
    ProfileId BIGINT NOT NULL,
    Category NVARCHAR(50),                       -- 'BACKEND', 'FRONTEND', etc.
    Name NVARCHAR(100) NOT NULL,                 -- e.g. 'Python'
    Alias NVARCHAR(100) NOT NULL,                -- e.g. 'SHADOW EXTRACTION'
    Value INT NOT NULL,                          -- 0-100
    Description NVARCHAR(500),
    Order INT,                                   -- Sort order within category
    
    CONSTRAINT fk_profile FOREIGN KEY (ProfileId) REFERENCES Profiles(ProfileId) ON DELETE CASCADE,
    INDEX idx_profileid NONCLUSTERED (ProfileId)
);
```

#### Experience Table
```sql
CREATE TABLE Experience (
    ExperienceId BIGINT PRIMARY KEY IDENTITY(1,1),
    ProfileId BIGINT NOT NULL,
    Company NVARCHAR(100) NOT NULL,
    Role NVARCHAR(100) NOT NULL,
    Status NVARCHAR(50),                         -- 'ACTIVE', 'COMPLETED'
    Period NVARCHAR(100),                        -- e.g. 'Jan 2020 - Present'
    Location NVARCHAR(100),
    Rank NVARCHAR(1),                            -- 'E' to 'S'
    AchievementsJson NVARCHAR(MAX),              -- JSON array of bullet points
    Order INT,                                   -- Chronological order
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT fk_profile FOREIGN KEY (ProfileId) REFERENCES Profiles(ProfileId) ON DELETE CASCADE,
    INDEX idx_profileid NONCLUSTERED (ProfileId)
);
```

#### Projects Table
```sql
CREATE TABLE Projects (
    ProjectId BIGINT PRIMARY KEY IDENTITY(1,1),
    ProfileId BIGINT NOT NULL,
    Title NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    TechStack NVARCHAR(500),                     -- e.g. 'React · Node.js · PostgreSQL'
    Rank NVARCHAR(1),
    IsClassified BIT DEFAULT 0,
    ProjectLink NVARCHAR(500),
    Order INT,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT fk_profile FOREIGN KEY (ProfileId) REFERENCES Profiles(ProfileId) ON DELETE CASCADE,
    INDEX idx_profileid NONCLUSTERED (ProfileId)
);
```

#### Certifications Table
```sql
CREATE TABLE Certifications (
    CertificationId BIGINT PRIMARY KEY IDENTITY(1,1),
    ProfileId BIGINT NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Type NVARCHAR(50),                           -- '[CERTIFICATION]', '[TITLE EARNED]', '[EDUCATION]'
    Variant NVARCHAR(50),                        -- 'gold', 'purple'
    Year INT,
    Organization NVARCHAR(100),
    Url NVARCHAR(500),
    Order INT,
    
    CONSTRAINT fk_profile FOREIGN KEY (ProfileId) REFERENCES Profiles(ProfileId) ON DELETE CASCADE,
    INDEX idx_profileid NONCLUSTERED (ProfileId)
);
```

#### Contact Info Table
```sql
CREATE TABLE ContactInfo (
    ContactId BIGINT PRIMARY KEY IDENTITY(1,1),
    ProfileId BIGINT NOT NULL UNIQUE,
    Email NVARCHAR(254),
    WhatsAppNumber NVARCHAR(20),
    LinkedInUrl NVARCHAR(500),
    GitHubUrl NVARCHAR(500),
    PersonalSiteUrl NVARCHAR(500),
    Location NVARCHAR(100),
    
    CONSTRAINT fk_profile FOREIGN KEY (ProfileId) REFERENCES Profiles(ProfileId) ON DELETE CASCADE
);
```

#### AuditLog Table
```sql
CREATE TABLE AuditLogs (
    AuditLogId BIGINT PRIMARY KEY IDENTITY(1,1),
    UserId BIGINT,
    Action NVARCHAR(100),                        -- 'CREATE_PROFILE', 'UPDATE_PROFILE', 'LOGIN', etc.
    EntityType NVARCHAR(50),                     -- 'Profile', 'User', 'Avatar'
    EntityId NVARCHAR(100),
    OldValues NVARCHAR(MAX),                     -- JSON
    NewValues NVARCHAR(MAX),                     -- JSON
    IpAddress NVARCHAR(45),
    UserAgent NVARCHAR(MAX),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    INDEX idx_userid NONCLUSTERED (UserId),
    INDEX idx_createdat NONCLUSTERED (CreatedAt)
);
```

---

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/register`
**Description:** Create a new user account  
**Authentication:** None required  
**Request Body:**
```json
{
  "username": "sumit-thakur",
  "password": "SecurePassword123!",
  "displayName": "Sumit Thakur"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "userId": 1,
    "username": "sumit-thakur",
    "displayName": "Sumit Thakur",
    "createdAt": "2026-04-13T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": "USERNAME_TAKEN",
  "message": "Username 'sumit-thakur' is already taken"
}
```

---

#### POST `/api/auth/signin`
**Description:** Authenticate with existing credentials  
**Authentication:** None required  
**Request Body:**
```json
{
  "username": "sumit-thakur",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": 1,
    "username": "sumit-thakur",
    "displayName": "Sumit Thakur"
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": "INVALID_CREDENTIALS",
  "message": "Username or password is incorrect"
}
```

---

#### POST `/api/auth/refresh`
**Description:** Get new access token using refresh token  
**Authentication:** Refresh token supplied  
**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### POST `/api/auth/logout`
**Description:** Revoke tokens and end session  
**Authentication:** Bearer JWT required  
**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Profile Endpoints

#### POST `/api/profiles`
**Description:** Create new user profile (after AI extraction)  
**Authentication:** Bearer JWT required  
**Request Body:**
```json
{
  "username": "sumit-thakur",
  "displayName": "Sumit Thakur",
  "tagline": "Full Stack Developer building awesome experiences",
  "rank": "B",
  "level": 3,
  "xp": {
    "current": 6200,
    "max": 10000
  },
  "hero": {
    "alertText": "A NEW HUNTER HAS AWAKENED!",
    "firstName": "SUMIT",
    "lastName": "THAKUR",
    "role": "Full Stack Engineer",
    "stack": "React.js · Node.js · Python",
    "location": "San Francisco, USA"
  },
  "about": {
    "profileFields": [
      {"key": "NAME", "val": "Sumit Thakur"},
      {"key": "CLASS", "val": "Full Stack Developer"}
    ],
    "bio": ["Passionate about creating innovative solutions..."],
    "quickStats": [{"val": "5+", "label": "Years Experience"}]
  },
  "skills": [
    {
      "category": "BACKEND",
      "icon": "⚔",
      "skills": [
        {
          "name": "Python",
          "alias": "SHADOW EXTRACTION",
          "value": 90,
          "desc": "Expert in Python with 5+ years experience"
        }
      ]
    }
  ],
  "experience": [
    {
      "rank": "A",
      "guild": "Tech Company",
      "role": "Senior Developer",
      "period": "Jan 2022 - Present",
      "location": "San Francisco, USA",
      "status": "ACTIVE",
      "achievements": ["Led team of 5 engineers", "Shipped product to 100K users"]
    }
  ],
  "projects": [
    {
      "rank": "S",
      "title": "CodeAether",
      "tech": "React · Node.js · MongoDB",
      "desc": "RPG-themed portfolio platform",
      "classified": false,
      "link": "https://codeaether.com"
    }
  ],
  "certifications": [
    {
      "variant": "gold",
      "type": "[CERTIFICATION]",
      "title": "AWS Solutions Architect",
      "year": 2023
    }
  ],
  "contact": {
    "email": "sumit@example.com",
    "whatsappNumber": "+1234567890",
    "linkedin": "https://linkedin.com/in/sumit",
    "location": "San Francisco, USA"
  },
  "github": {
    "username": "sumit-thakur",
    "stats": [
      {"label": "Experience:", "value": "5+ Years"},
      {"label": "Primary Stack:", "value": "Python, JavaScript"}
    ],
    "heatmapSeed": [0,1,2,1,0,2,3,1,...364 total values...]
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Profile created successfully",
  "profile": {
    "profileId": 1,
    "username": "sumit-thakur",
    "displayName": "Sumit Thakur",
    "createdAt": "2026-04-13T10:30:00Z",
    "updatedAt": "2026-04-13T10:30:00Z"
  }
}
```

---

#### GET `/api/profiles/{username}`
**Description:** Retrieve user profile by username  
**Authentication:** Optional (public profiles)  
**Query Parameters:**
- `includeAvatar` (boolean, default: true) - Include avatar URL
- `includeEmail` (boolean, default: false) - Include email (only if own profile or admin)

**Response (200 OK):**
```json
{
  "success": true,
  "profile": {
    "profileId": 1,
    "username": "sumit-thakur",
    "displayName": "Sumit Thakur",
    "tagline": "Full Stack Developer...",
    "avatarUrl": "/api/avatars/sumit-thakur/avatar.jpg",
    "rank": "B",
    "level": 3,
    "xp": {"current": 6200, "max": 10000},
    "hero": {...},
    "about": {...},
    "skills": [...],
    "experience": [...],
    "projects": [...],
    "certifications": [...],
    "github": {...},
    "createdAt": "2026-04-13T10:30:00Z"
  }
}
```

---

#### PUT `/api/profiles/{username}`
**Description:** Update user profile  
**Authentication:** Bearer JWT required (own profile or admin)  
**Request Body:** Same as POST (partial updates allowed)  
**Response (200 OK):** Updated profile object

---

#### DELETE `/api/profiles/{username}`
**Description:** Delete user profile  
**Authentication:** Bearer JWT required (own profile or admin)  
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile deleted successfully"
}
```

---

### Avatar Endpoints

#### POST `/api/profiles/{username}/avatar`
**Description:** Upload or update user avatar  
**Authentication:** Bearer JWT required (own profile or admin)  
**Content-Type:** multipart/form-data  
**Body:**
```
avatar: [binary PNG/JPEG/WEBP file, max 5MB]
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "avatarUrl": "/api/avatars/sumit-thakur/avatar.jpg",
  "size": 234567
}
```

---

#### GET `/api/avatars/{username}/avatar`
**Description:** Download user avatar  
**Authentication:** Optional (public)  
**Response:** Binary image file with appropriate Content-Type header

---

#### DELETE `/api/profiles/{username}/avatar`
**Description:** Delete user avatar  
**Authentication:** Bearer JWT required (own profile or admin)  
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Avatar deleted successfully"
}
```

---

### Search & Discovery Endpoints

#### GET `/api/profiles`
**Description:** Search/browse user profiles  
**Authentication:** Optional  
**Query Parameters:**
- `search` (string) - Search in displayName, username, tagline
- `rank` (string) - Filter by rank (E, D, C, B, A, S)
- `skill` (string) - Filter by skill name
- `status` (string) - Filter by status (available, employed, not-looking)
- `page` (int, default: 1) - Pagination
- `pageSize` (int, default: 20, max: 100) - Items per page
- `sortBy` (string, default: createdAt) - Sort field: createdAt, rank, level
- `sortOrder` (string, default: desc) - asc or desc

**Response (200 OK):**
```json
{
  "success": true,
  "profiles": [
    {
      "profileId": 1,
      "username": "sumit-thakur",
      "displayName": "Sumit Thakur",
      "rank": "B",
      "tagline": "Full Stack Developer...",
      "avatarUrl": "/api/avatars/sumit-thakur/avatar.jpg"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 150,
    "totalPages": 8
  }
}
```

---

### Resume Upload Endpoint (Future)

#### POST `/api/profiles/{username}/regenerate-from-resume`
**Description:** Upload updated resume to regenerate profile via Agent Alpha  
**Authentication:** Bearer JWT required (own profile or admin)  
**Content-Type:** multipart/form-data  
**Body:**
```
resume: [binary PDF/DOCX file, max 25MB]
(optional) linkedinUrl: https://linkedin.com/in/user
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Profile regeneration started",
  "jobId": "job_abc123xyz",
  "status": "processing",
  "estimatedSeconds": 45
}
```

---

### Job Status Endpoint (Future)

#### GET `/api/jobs/{jobId}/status`
**Description:** Poll regeneration job status  
**Authentication:** Bearer JWT required  
**Response (200 OK):**
```json
{
  "jobId": "job_abc123xyz",
  "status": "completed",
  "progress": 100,
  "result": {
    "profile": {...},
    "updatedAt": "2026-04-13T10:35:00Z"
  }
}
```

```json
{
  "jobId": "job_abc123xyz",
  "status": "processing",
  "progress": 65,
  "estimatedSecondsRemaining": 15
}
```

---

## Data Validation Rules

### Username Validation
- **Length**: 3-50 characters
- **Format**: Lowercase alphanumeric + hyphens (^[a-z0-9-]{3,50}$)
- **Uniqueness**: Must be unique in database
- **Reserved**: Exclude system usernames (admin, api, system, root, etc.)

### Password Validation
- **Length**: Minimum 6 characters
- **Strength**: Recommend uppercase, numbers, special characters
- **History**: Don't allow reusing last 3 passwords
- **Expiration**: Optionally force reset every 90 days (configurable)

### Profile Fields Validation

| Field | Type | Rules |
|-------|------|-------|
| displayName | string | 1-100 chars, required |
| tagline | string | 0-80 chars, optional |
| rank | enum | E, D, C, B, A, S only |
| level | int | 1-99 |
| xp.current | int | 0 ≤ current ≤ max |
| xp.max | int | > 0 |
| firstName | string | 1-50 chars |
| lastName | string | 1-50 chars |
| role | string | 1-100 chars |
| stack | string | Comma/·-separated tech list, max 500 chars |
| location | string | 1-100 chars |

### Skills Validation

| Field | Type | Rules |
|-------|------|-------|
| category | enum | BACKEND, FRONTEND, CLOUD & DEVOPS, TOOLS, etc. |
| name | string | 1-100 chars, required |
| alias | string | 1-100 chars, required (RPG ability name) |
| value | int | 0 ≤ value ≤ 100 |
| description | string | 0-500 chars |

### Experience Validation

| Field | Type | Rules |
|-------|------|-------|
| company | string | 1-100 chars, required |
| role | string | 1-100 chars, required |
| period | string | Format: "Mon YYYY - Mon YYYY" or "Mon YYYY - Present" |
| status | enum | ACTIVE, COMPLETED |
| achievements | array | Max 10 items, each max 200 chars |

### GitHub Heatmap Validation
- **Array Length**: Exactly 364 elements (52 weeks × 7 days)
- **Element Values**: Each must be integer 0-3
- **Represents**: GitHub contribution activity pattern

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field": "Invalid value",
    "anotherField": "Another error"
  },
  "timestamp": "2026-04-13T10:30:00Z",
  "traceId": "0HN1GJ7K5M:00000001"
}
```

### HTTP Status Codes

| Code | Scenario |
|------|----------|
| 200 | Success |
| 201 | Created (POST successful) |
| 202 | Accepted (async job started) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (lack of permission) |
| 404 | Not Found (resource doesn't exist) |
| 409 | Conflict (resource already exists) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### Error Codes by Category

**Authentication Errors:**
```
AUTH_MISSING - No token provided
AUTH_INVALID - Token is malformed
AUTH_EXPIRED - Token has expired
AUTH_REVOKED - Token was revoked
CREDENTIALS_INVALID - Username/password mismatch
CREDENTIALS_WEAK - Password doesn't meet requirements
```

**Profile Errors:**
```
PROFILE_NOT_FOUND - Username doesn't exist
PROFILE_EXISTS - Username already taken
PROFILE_INVALID - Data doesn't match schema
PROFILE_PERMISSION_DENIED - User can't edit this profile
```

**Validation Errors:**
```
VALIDATION_ERROR - One or more fields invalid
FIELD_MISSING - Required field is null/empty
FIELD_INVALID - Field value is malformed
FIELD_TOO_LONG - String exceeds max length
FIELD_TOO_SHORT - String below min length
FIELD_OUT_OF_RANGE - Number outside valid range
```

**File Errors:**
```
FILE_MISSING - No file provided
FILE_TOO_LARGE - File exceeds size limit
FILE_INVALID_TYPE - File format not allowed
FILE_CORRUPT - File can't be processed
AVATAR_UPLOAD_FAILED - Avatar storage failed
```

**Rate Limit Errors:**
```
RATE_LIMITED - Too many requests
ACCOUNT_LOCKED - Too many login failures
```

### Example Error Responses

**Validation Error (400):**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": {
    "username": "Username must be 3-50 characters",
    "password": "Password must be at least 6 characters",
    "displayName": "Display name is required"
  },
  "timestamp": "2026-04-13T10:30:00Z"
}
```

**Unauthorized (401):**
```json
{
  "success": false,
  "error": "AUTH_EXPIRED",
  "message": "Token has expired. Please refresh.",
  "timestamp": "2026-04-13T10:30:00Z"
}
```

**Rate Limited (429):**
```json
{
  "success": false,
  "error": "RATE_LIMITED",
  "message": "Too many requests. Try again after 60 seconds.",
  "retryAfter": 60,
  "timestamp": "2026-04-13T10:30:00Z"
}
```

---

## Rate Limiting & Quotas

### Rate Limit Headers (on all responses)

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1712977200
X-RateLimit-RetryAfter: 60
```

### Tier-Based Limits

**Unauthenticated (Per IP):**
- 10 requests/minute
- 100 requests/hour

**Authenticated (Per User):**
- 60 requests/minute
- 1000 requests/hour

**Special Endpoints:**
- Registration: 5 per 15 minutes per IP
- Login: 10 failed attempts = 15 minute lockout per username
- Profile upload: 1 per minute per user
- Avatar upload: 1 per minute per user (max 50/day)

### Storage Quotas

**Per User:**
- Avatar storage: 300MB max per user (multiple avatars)
- Profile data: 10MB (includes all nested objects)
- Audit trail: 1 year rolling window

---

## File Handling

### Avatar Upload Process

1. Client uploads file (multipart/form-data)
2. Backend validates:
   - File type (check MIME + magic bytes)
   - File size (≤ 5MB)
   - Image dimensions (≤ 4000×4000px)
3. Generate unique filename: `{username}_{timestamp}_{random}.jpg`
4. Store in Azure Blob Storage or local disk
5. Generate thumbnail (512×512)
6. Return URL to client

### Resume Upload Process (Future)

1. Client uploads file (multipart/form-data)
2. Backend validates:
   - File type (PDF or DOCX only)
   - File size (≤ 25MB)
3. Store temporarily in secure directory
4. Queue job to send to AI agent (not backend's responsibility)
5. Delete file after processing complete
6. Return job ID for polling

### File Storage Locations

**Development:**
- Local disk: `./storage/avatars/{username}/`
- Temporary: `./storage/temp/{sessionId}/`

**Production:**
- Azure Blob Storage: `https://caaether.blob.core.windows.net/avatars/{username}/`
- Azure Temp: `https://codeaether.blob.core.windows.net/temp/{sessionId}/`
- Never expose direct file URLs; always route through authenticated endpoints

---

## Deployment & Infrastructure

### Environment Configuration

**Development (.env):**
```
ASPNETCORE_ENVIRONMENT=Development
ConnectionString=Server=localhost;Database=CodeAether_Dev;Trusted_Connection=true
JwtSecret=dev-secret-key-not-for-production
JwtExpiration=3600
AllowedOrigins=http://localhost:5173,http://localhost:3000
```

**Production (.env):**
```
ASPNETCORE_ENVIRONMENT=Production
ConnectionString=Server=sql-server.database.windows.net;Database=CodeAether_Prod
JwtSecret=[load from Azure Key Vault]
JwtExpiration=3600
AllowedOrigins=https://codeaether.com
AzureBlobConnectionString=[load from Azure Key Vault]
SendGridApiKey=[load from Azure Key Vault]
```

### Database Backup Strategy

- **Frequency**: Daily at 2 AM UTC
- **Retention**: 30 days
- **Location**: Azure Backup, geo-redundant
- **Recovery RTO**: < 1 hour
- **Recovery RPO**: < 5 minutes

### API Versioning Strategy

```
/api/v1/profiles
/api/v1/auth/signin
/api/v2/profiles   (future breaking changes)
```

**Current Version**: v1  
**Deprecation Policy**: Maintain v1 for 1 year after v2 release

### Monitoring & Alerting

**Key Metrics:**
- API response time (target: < 200ms p95)
- Error rate (target: < 0.1%)
- Database connection pool usage
- Authentication success rate
- Rate limit violations
- File upload success rate

**Dashboards:**
- Real-time API health (Application Insights)
- Database performance (SQL Server Management Studio)
- User activity (custom dashboard)
- Error logs (Serilog sink)

### Scaling Strategy

**Horizontal Scaling:**
- Stateless API design enabling multiple instances
- Load balancer (Azure Application Gateway)
- Session affinity: OFF (using stateless JWT)

**Database Scaling:**
- Read replicas for profile queries
- Query optimization and indexing
- Connection pooling (max 100 connections)
- Cache layer (Redis) for frequently accessed profiles

**File Storage Scaling:**
- CDN for avatar serving (Azure CDN)
- Blob storage auto-scaling
- Cleanup job for old avatars (retention: 90 days)

### Security Checklist

- [ ] All secrets stored in Azure Key Vault
- [ ] API key rotation every 90 days
- [ ] Database encryption at rest enabled
- [ ] TLS 1.2+ enforced
- [ ] CORS whitelist configured
- [ ] Rate limiting enabled
- [ ] Request logging configured
- [ ] Error response sanitization (no internal paths exposed)
- [ ] SQL injection prevention (parameterized queries)
- [ ] CSRF protection enabled
- [ ] Security headers configured
- [ ] Dependency updates scheduled
- [ ] Penetration testing completed before launch
- [ ] GDPR compliance reviewed
- [ ] Data residency requirements met

### Disaster Recovery Plan

**Scenario 1: Database Failure**
- Switch to read replica within 5 minutes
- Restore from backup if needed
- Notify users of potential data loss

**Scenario 2: API Service Down**
- Auto-restart failed instances
- Scale up additional instances
- Return 503 Service Unavailable errors

**Scenario 3: DDoS Attack**
- Enable Azure DDoS Protection Standard
- Implement rate limiting aggressively
- Route traffic through WAF (Web Application Firewall)

---

## Frontend-Backend Integration

### Frontend Configuration for Backend

```javascript
// src/utils/apiClient.js
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000';

export async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('ca_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (response.status === 401) {
    // Token expired, try refresh
    const refreshToken = localStorage.getItem('ca_refresh_token');
    if (refreshToken) {
      // Refresh and retry
    }
  }
  
  return response.json();
}
```

### Migration Path from localStorage

**Phase 1 (Current):** localStorage only
- No changes to frontend
- AI agents run locally

**Phase 2 (Backend Launch):** Backend API mirror
- Store profiles in backend AND localStorage
- Prioritize backend data
- Feature flag to switch sources

**Phase 3 (Full Migration):** Backend only
- Remove localStorage profile storage
- Keep JWT refresh token in cookies
- All profile operations go through API

---

## Support & Documentation

### API Documentation (Auto-Generated via Swagger)

```
https://api.codeaether.com/swagger/ui
https://api.codeaether.com/swagger/json
```

### Postman Collection

Published collection for easy API testing:
```
[Link to Postman collection]
```

### Support Contact

- **Email**: backend-support@codeaether.com
- **Slack Channel**: #backend-api
- **Response Time**: < 4 hours for P1 issues

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-13 | Initial API specification |
| TBD | TBD | Resume regeneration endpoints |
| TBD | TBD | Profile search/discovery features |

