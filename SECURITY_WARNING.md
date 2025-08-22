# ⚠️ CRITICAL SECURITY WARNING ⚠️

## Original Password Storage - DEVELOPMENT ONLY

This application currently stores **BOTH** hashed passwords (secure) and original passwords (INSECURE) for development purposes only.

### 🚨 BEFORE PRODUCTION:

1. **REMOVE** all `originalPassword` fields from:
   - `prisma/schema.prisma`
   - `app/api/auth/signup/route.ts`
   - `app/api/admin/users/route.ts`
   - `prisma/seed.ts`

2. **RUN** migration to remove columns:
   ```bash
   npx prisma migrate dev --name remove_original_passwords
   ```

3. **DELETE** this file (`SECURITY_WARNING.md`)

### 🔒 Why This is Dangerous:

- **Database breach** = All passwords exposed
- **Admin access** = Can see all user passwords
- **Legal issues** = Violates privacy regulations
- **User trust** = Destroys reputation if discovered

### ✅ Proper Production Setup:

- Only store hashed passwords
- Use strong hashing (bcrypt with salt rounds ≥12)
- Never log passwords
- Implement proper access controls
- Regular security audits

## Current Fields (REMOVE IN PRODUCTION):

- `adminOriginalPassword`
- `librarianOriginalPassword`  
- `patronOriginalPassword`

**REMEMBER: This is only for your development/learning. Never use in production!**
