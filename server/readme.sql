CREATE TABLE "User" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT  NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  verify_email BOOLEAN DEFAULT(false),
  status TEXT DEFAULT('ACTIVE'),
  avatar TEXT,
  mobile TEXT,
  last_login_date TIMESTAMP,
  refresh_token TEXT,
  forgot_password_otp TEXT,
  forgot_password_expire TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);