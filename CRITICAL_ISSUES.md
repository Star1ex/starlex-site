# Critical Issues Report

## 🔴 CRITICAL SECURITY VULNERABILITIES

### 1. **Hardcoded JWT Secret Key** (CRITICAL)
**Location:** `backend/internal/api/handlers/middleware.go:13`
- **Issue:** JWT secret is hardcoded as `"super_secret_key_123"` in source code
- **Risk:** Anyone with access to code can forge tokens, impersonate users, bypass authentication
- **Fix Required:** Move to environment variable, use strong random secret in production

### 2. **No Authentication Middleware Applied** (CRITICAL)
**Location:** `backend/internal/api/routes/router.go`
- **Issue:** `UserIndentity` middleware is defined but NEVER used on any routes
- **Risk:** All endpoints are publicly accessible without authentication
- **Impact:** Anyone can create teams, tasks, access user data without login
- **Fix Required:** Apply middleware to protected routes

### 3. **JWT Token/Context Mismatch** (CRITICAL)
**Location:** 
- `backend/internal/api/handlers/middleware.go:73` - Sets `email` in context
- `backend/internal/api/handlers/task.go:13` - Expects `userID` in context
- **Issue:** Middleware stores `email` but handlers expect `userID`
- **Risk:** `CreateTask` will always fail with "user not authorized" even for authenticated users
- **Fix Required:** Either store userID in JWT token or lookup userID from email in middleware

### 4. **Password Exposed in API Response** (CRITICAL)
**Location:** `backend/internal/api/dto/user.go:24-32`
- **Issue:** `ToUserApi` function includes password field, which could leak in responses
- **Risk:** Passwords could be exposed in API responses
- **Fix Required:** Remove password from DTO conversion functions

### 5. **CORS Allows All Origins** (HIGH)
**Location:** `backend/internal/app/app.go:30`
- **Issue:** `AllowOrigins: "*"` allows any website to make requests
- **Risk:** CSRF attacks, unauthorized API access from any domain
- **Fix Required:** Restrict to specific allowed origins

### 6. **Environment File in Docker Image** (HIGH)
**Location:** `backend/Dockerfile:21`
- **Issue:** `.env` file is copied into Docker image
- **Risk:** Secrets exposed in Docker image layers
- **Fix Required:** Use environment variables or secrets management, don't copy .env

---

## 🔴 CRITICAL FUNCTIONAL BUGS

### 7. **GetUserTasks Handler Has Empty UserID** (CRITICAL)
**Location:** `backend/internal/api/handlers/task.go:56-58`
```go
var id string  // Empty string!
tasks, err := h.taskService.GetUserTasks(ctx.Context(), id)
```
- **Issue:** `id` is always empty string, will never return correct tasks
- **Impact:** Endpoint always fails or returns wrong data
- **Fix Required:** Extract userID from JWT token/context

### 8. **Config References Wrong File** (CRITICAL)
**Location:** `backend/internal/config/config.go:33,36`
- **Issue:** Comments and error message reference `.env.example.example` instead of `.env`
- **Impact:** Confusing error messages, potential misconfiguration
- **Fix Required:** Update to reference `.env`

### 9. **Task Repository Update Field Name Mismatch** (HIGH)
**Location:** `backend/internal/repository/task.go:89-109`
- **Issue:** Update method uses camelCase (`task`, `description`) but GORM expects snake_case for database columns
- **Risk:** Updates may silently fail or update wrong columns
- **Fix Required:** Use proper GORM column names or struct tags

### 10. **Repository Update Method Missing Context** (MEDIUM)
**Location:** `backend/internal/repository/task.go:112,117`
- **Issue:** `Updates()` and `First()` calls don't use `ctx` parameter
- **Risk:** Database operations can't be cancelled, no request tracing
- **Fix Required:** Use `WithContext(ctx)` for all DB operations

### 11. **Typo in Middleware Function Name** (LOW)
**Location:** `backend/internal/api/handlers/middleware.go:18`
- **Issue:** Function named `UserIndentity` should be `UserIdentity`
- **Impact:** Confusing, unprofessional code

---

## 🔴 CRITICAL AUTHORIZATION ISSUES

### 12. **No Authorization Checks** (CRITICAL)
**Location:** Multiple handlers
- **Issue:** No verification that:
  - User belongs to team before creating tasks
  - User has permission to view team tasks
  - User can only update their own tasks
- **Risk:** Users can access/modify any team's data
- **Fix Required:** Add authorization middleware/checks

### 13. **Team Creation Doesn't Validate User** (HIGH)
**Location:** `backend/internal/service/team.go:22-28`
- **Issue:** User lookup happens after team creation attempt, error handling is after
- **Risk:** Partial state if user doesn't exist
- **Fix Required:** Validate user exists before creating team

### 14. **Role Assignment Without Validation** (HIGH)
**Location:** `backend/internal/service/team.go:35`
- **Issue:** User role set to "owner" without checking if user already has a role
- **Risk:** Users can become owners of multiple teams, role conflicts
- **Fix Required:** Validate role assignment logic

### 15. **Task Creation Authorization Logic Flaw** (HIGH)
**Location:** `backend/internal/service/task.go:35-37`
- **Issue:** Checks if user is "owner" but doesn't verify user belongs to the team
- **Risk:** Any owner can create tasks for any team
- **Fix Required:** Verify user is owner OF THE SPECIFIC TEAM

---

## 🔴 CRITICAL DATA INTEGRITY ISSUES

### 16. **Task Update Returns Wrong Order** (MEDIUM)
**Location:** `backend/internal/service/task.go:72`
- **Issue:** Function signature `(error, *entity.Task)` - error first is non-idiomatic Go
- **Impact:** Confusing API, easy to misuse
- **Fix Required:** Use standard Go pattern `(*entity.Task, error)`

### 17. **Missing Input Validation** (HIGH)
**Location:** Multiple handlers
- **Issue:** No validation for:
  - Email format
  - Password strength
  - Team name uniqueness
  - Task priority values
  - Progress values (only checked in one place)
- **Risk:** Invalid data in database, potential crashes
- **Fix Required:** Add comprehensive input validation

### 18. **Error Message Typo** (LOW)
**Location:** `backend/internal/service/task.go:36`
- **Issue:** "now allowed" should be "not allowed"
- **Impact:** Unprofessional error message

---

## 🔴 CRITICAL ARCHITECTURAL ISSUES

### 19. **No Request Context Propagation** (MEDIUM)
**Location:** Multiple service methods
- **Issue:** Some methods don't accept or use `context.Context`
- **Risk:** Can't implement timeouts, cancellation, tracing
- **Fix Required:** Ensure all service methods accept context

### 20. **Inconsistent Error Handling** (MEDIUM)
**Location:** Throughout codebase
- **Issue:** Some errors logged, some returned, some ignored
- **Risk:** Difficult debugging, inconsistent user experience
- **Fix Required:** Standardize error handling strategy

### 21. **Missing Database Transaction Boundaries** (MEDIUM)
**Location:** `backend/internal/service/team.go:30-39`
- **Issue:** Team creation and role update not in same transaction
- **Risk:** Partial state if role update fails
- **Fix Required:** Wrap in transaction

---

## 🔴 CRITICAL COMPILATION ERRORS

### 22. **Code May Not Compile** (CRITICAL)
**Location:** Multiple files
- **Linter Errors Found:**
  1. `backend/internal/api/dto/user.go:50` - `u.Role undefined` (but entity.User has Role field)
  2. `backend/internal/service/task.go:31` - `GetByID undefined` (but interface defines it)
  3. `backend/internal/service/team.go:22,36` - `GetByID` and `Update undefined` (but interface defines them)
  4. `backend/internal/service/user.go:33` - `too many arguments to entity.NewUser` (but function accepts 6 params)
  5. `backend/internal/repository/user.go:34,48,169,170` - Multiple `Role undefined` errors

- **Issue:** Linter reports compilation errors that suggest:
  - Possible import/package resolution issues
  - Possible interface implementation mismatches
  - Possible IDE cache issues
  
- **Risk:** Code may not compile or run
- **Fix Required:** Verify code compiles, fix any actual compilation errors, ensure all interfaces are properly implemented

---

## Summary

**Total Critical Issues: 22**
- **Compilation Errors: 1** (1 CRITICAL - needs verification)
- **Security Vulnerabilities: 6** (3 CRITICAL, 3 HIGH)
- **Functional Bugs: 5** (3 CRITICAL, 2 HIGH)
- **Authorization Issues: 4** (1 CRITICAL, 3 HIGH)
- **Data Integrity: 3** (3 HIGH)
- **Architectural: 3** (3 MEDIUM)

### Priority Fix Order:
1. **IMMEDIATE:** Fix authentication middleware application (#2)
2. **IMMEDIATE:** Fix JWT token/context mismatch (#3)
3. **IMMEDIATE:** Move JWT secret to environment (#1)
4. **URGENT:** Fix GetUserTasks empty ID bug (#7)
5. **URGENT:** Add authorization checks (#12, #15)
6. **HIGH:** Fix password exposure (#4)
7. **HIGH:** Fix CORS configuration (#5)
8. **HIGH:** Fix Docker .env issue (#6)

