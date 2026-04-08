# 🚀 Deployment Guide - Login Security Enhancement

## Pre-Deployment Checklist

### Step 1: Environment Setup (5 min)

```bash
# 1. Copy environment template
cp .env.example .env.local

# 2. Generate secure secrets
openssl rand -hex 32  # Keep one for BETTER_AUTH_SECRET

# 3. Edit .env.local with your values:
#    - BETTER_AUTH_SECRET: (paste generated secret)
#    - DATABASE_URL: (your PostgreSQL connection)
#    - BETTER_AUTH_URL: (http://localhost:3000 for dev)
#    - SMTP credentials: (Gmail, SendGrid, etc.)
#    - SUPPORT_EMAIL: (your support email)
```

### Step 2: Database Migration (2 min)

```bash
# Apply the new security tables
npm run db:push

# Verify tables created:
# - login_attempt
# - account_lockout
# - device_fingerprint
# - security_audit_log
```

### Step 3: Test Locally (10 min)

```bash
# Start dev server
npm run dev

# Test 1: Verify migration worked
# Query any table in database IDE/Studio

# Test 2: Make failed login attempt
curl -X POST http://localhost:3000/api/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'

# Test 3: Check audit log entry
# Query: SELECT * FROM security_audit_log ORDER BY createdAt DESC LIMIT 1

# Test 4: Verify email config (if SMTP configured)
# Make 3 failed attempts, check for email alert
```

---

## Staging Deployment (Production-Like)

### Environment Variables for Staging

```env
# .env.staging or Vercel/Railway environment

# Auth settings
BETTER_AUTH_SECRET=<new-secure-secret>
BETTER_AUTH_URL=https://staging.your-domain.com
SECURE_COOKIES=true
COOKIE_DOMAIN=staging.your-domain.com

# Database (staging database)
DATABASE_URL=postgresql://staging-user:password@staging-db:5432/tec_info_staging

# Email (use staging email or test account)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=staging-email@gmail.com
SMTP_PASS=app-specific-password
SUPPORT_EMAIL=staging-support@your-domain.com

# Security strict mode
LOGIN_LOCKOUT_DURATION=30
ENABLE_SUSPICIOUS_LOGIN_ALERTS=true
```

### Deployment Steps

```bash
# 1. Deploy code to staging
git push staging main

# 2. Run migrations on staging database
# (Usually automatic via CI/CD, or manual SSH)
npm run db:push

# 3. Verify services are up
curl https://staging.your-domain.com/api/sign-in -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'

# 4. Check logs for errors
# tail -f staging-logs.txt

# 5. Test security features
# See SECURITY_TESTING.md for full test suite
```

### Staging Testing Checklist

- [ ] Login with valid credentials works
- [ ] Failed login attempts tracked in database
- [ ] 3 failed attempts trigger CAPTCHA response
- [ ] 7 failed attempts trigger lockout
- [ ] Email alerts sent (check inbox)
- [ ] Audit logs created for all events
- [ ] HTTPS enforced (check headers)
- [ ] Secure cookies set (check DevTools)
- [ ] No console errors or warnings
- [ ] Performance acceptable (<1s response time)

---

## Production Deployment

### Pre-Production Hardening

#### 1. Secrets Management
```bash
# DO NOT use .env files in production
# Use your platform's secrets manager:

# Vercel: Settings → Environment Variables
# Railway: Variables → Add Variable
# AWS: Secrets Manager → Create Secret
# Heroku: Config Vars → Add Config Var

# Required secrets:
# - BETTER_AUTH_SECRET (rotate quarterly)
# - DATABASE_URL (with SSL certificate)
# - SMTP_PASS (app-specific password)
```

#### 2. Database Connection
```env
# Enable SSL/TLS
DATABASE_URL=postgresql://user:password@host:5432/db?sslmode=require

# Connection pooling (for high traffic)
DATABASE_POOL_URL=postgresql://pool:password@pool-host:6543/db

# Max connections recommended
# Production: 20-50 concurrent connections
```

#### 3. Rate Limiting Persistence
```env
# Switch from memory to Redis
RATE_LIMIT_STORAGE=redis
REDIS_URL=redis://[:password]@host:6379/0

# Production Redis setup:
# - Enable persistence (AOF/RDB)
# - Set memory limit and eviction policy
# - Enable TLS/SSL encryption
# - Configure backups
```

#### 4. Email Service Reliability
```env
# Production email configuration examples:

# Option 1: SendGrid
SENDGRID_API_KEY=SG.xxxx...
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey

# Option 2: AWS SES
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxxx...
AWS_SECRET_ACCESS_KEY=xxxx...

# Option 3: Custom SMTP
SMTP_HOST=mail.your-server.com
SMTP_PORT=587
SMTP_USER=smtp-user
SMTP_PASS=encrypted-password
```

#### 5. Monitoring & Alerting
```bash
# Essential monitoring setup:

# 1. Error Tracking (Sentry)
SENTRY_DSN=https://key@sentry.io/project

# 2. Uptime Monitoring (UptimeRobot, Pingdom)
# Add monitoring for /health endpoint

# 3. Log Aggregation (Datadog, LogRocket)
# Aggregate logs from all instances

# 4. APM (Application Performance Monitoring)
# Track response times, database queries
```

### Production Deployment Steps

```bash
# 1. Code review and approval
# - Security team reviews all changes
# - Performance benchmarking done
# - Backup plan documented

# 2. Pre-deployment backup
# - Backup production database
# - Tag current release: git tag v1.0.0

# 3. Deploy during low-traffic window
# - Morning in your timezone
# - Have team on standby
# - Monitor error logs closely

# 4. Health checks
curl -f https://your-domain.com/api/sign-in \
  -X OPTIONS \
  -H "Origin: https://your-domain.com" || exit 1

# 5. Monitor for issues (first 24 hours)
# - Check error rates in Sentry
# - Monitor database performance
# - Review security_audit_log for anomalies
# - Monitor email delivery success

# 6. Rollback procedure (if needed)
# git revert <commit-hash>
# npm run db:push (run migrations in reverse)
```

### Production Configuration Example

```env
# .env.production (never commit to git)

# ===== AUTHENTICATION =====
BETTER_AUTH_SECRET=<secret-from-vault>
BETTER_AUTH_URL=https://your-domain.com
SECURE_COOKIES=true
COOKIE_DOMAIN=your-domain.com

# ===== DATABASE =====
DATABASE_URL=postgresql://prod_user:pass@prod-db-host.rds.amazonaws.com:5432/tec_info?sslmode=require
DATABASE_POOL_URL=postgresql://pool:pass@pgbouncer:6543/tec_info

# ===== EMAIL =====
SENDGRID_API_KEY=SG.your-key-here
SUPPORT_EMAIL=support@your-domain.com
ADMIN_EMAIL=admin@your-domain.com

# ===== REDIS =====
RATE_LIMIT_STORAGE=redis
REDIS_URL=redis://default:password@redis-cluster.cache.amazonaws.com:6379/0

# ===== SECURITY =====
LOG_LEVEL=warn
ENABLE_SUSPICIOUS_LOGIN_ALERTS=true
ENABLE_IP_VALIDATION=true
LOGIN_LOCKOUT_DURATION=30
AUDIT_LOG_RETENTION_DAYS=90

# ===== MONITORING =====
SENTRY_DSN=https://key@sentry.io/12345
NODE_ENV=production
```

---

## Post-Deployment Monitoring

### First 24 Hours

```bash
# Every 4 hours:
# 1. Check Sentry for new errors
# 2. Review database performance metrics
# 3. Verify email delivery rate >95%

# Hourly:
# 1. Check error logs in CloudWatch/Datadog
# 2. Monitor auth endpoint response times
# 3. Check database query performance

# Immediately check:
# 1. Failed account lockout count
# 2. Account lockout false positive rate
# 3. Email delivery failures
# 4. Session validation errors
# 5. Security audit log for anomalies
```

### Week 1 Monitoring

```bash
# Daily:
# Query email alert statistics:
SELECT event_type, COUNT(*) 
FROM security_audit_log 
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY event_type;

# Check lockout patterns:
SELECT user_id, COUNT(*) 
FROM account_lockout 
WHERE locked_at > NOW() - INTERVAL '1 day'
GROUP BY user_id;

# Monitor failed attempts:
SELECT ipaddress, COUNT(*) 
FROM login_attempt 
WHERE success = false 
AND created_at > NOW() - INTERVAL '1 day'
GROUP BY ipaddress
ORDER BY COUNT(*) DESC;
```

### Month 1 Review

1. [ ] Analyze lockout patterns
   - False positive rate acceptable?
   - Any legitimate users repeatedly locked out?
   - Need to adjust thresholds?

2. [ ] Review email metrics
   - Delivery rate >98%?
   - Unsubscribe rate acceptable?
   - Are users reading alerts?

3. [ ] Security incidents
   - Any brute-force attacks detected?
   - Any suspected account takeovers?
   - Any credential stuffing attempts?

4. [ ] Performance impact
   - Database queries optimized?
   - Email queue performance good?
   - API response times acceptable?

---

## Rollback Procedure (Emergency)

```bash
# If security features cause issues:

# 1. Identify the problem
# Check logs, Sentry, database performance metrics

# 2. Emergency rollback (option 1):
# Revert auth.ts to minimize security features temporarily
# POST requests still validate input
# Rate limiting set to minimal (1 per second)

# 3. Emergency rollback (option 2):
# Disable middleware:
# Comment out middleware validation
# Set ENABLE_SECURITY_FEATURES=false in .env

# 4. Full rollback (option 3):
git revert <commit-hash>
npm run db:push  # Downgrade schema if needed
npm run build
npm run start

# 5. Communicate status
# - Notify security team
# - Post status update
# - Plan investigation
```

---

## Troubleshooting Deployment Issues

### Issue: Email not sending in production

```bash
# 1. Check SMTP credentials
# Test SMTP connection manually:
telnet smtp.gmail.com 587

# 2. Check email queue logs
# View application logs for email errors
# tail -f /var/log/app.log | grep -i email

# 3. Verify firewall rules
# Check that outbound port 587 is open
# Check that outbound mail server is not blocked

# 4. Check email service limits
# Gmail: 500 emails/day for standard user
# Use SendGrid/Mailgun for production volumes

# 5. Fallback: Disable and re-enable
ENABLE_SUSPICIOUS_LOGIN_ALERTS=false
# Fix SMTP settings
ENABLE_SUSPICIOUS_LOGIN_ALERTS=true
```

### Issue: Rate limiting too strict

```bash
# 1. Check thresholds in LOGIN_SECURITY_CONFIG
# Are legitimate users getting locked out?

# 2. Adjust in real-time:
# Modify environment variables
# Restart application

# 3. Monitor legitimate login patterns:
SELECT email, COUNT(*) AS attempt_count
FROM login_attempt
WHERE created_at > NOW() - INTERVAL '1 hour'
AND success = true
GROUP BY email
ORDER BY attempt_count DESC;
```

### Issue: Database connection issues

```bash
# 1. Check connection string
# Verify DATABASE_URL is correct
# Test connection: psql $DATABASE_URL

# 2. Check connection pool settings
# Verify DATABASE_POOL_URL if using PgBouncer
# Check pool size and timeout settings

# 3. Monitor active connections
SELECT count(*)
FROM pg_stat_activity
WHERE datname = 'tec_info';

# 4. Check database performance
# Run slow query log analysis
# Check index usage
```

---

## Maintenance Schedule

### Weekly
- [ ] Review security_audit_log for anomalies
- [ ] Check email delivery metrics
- [ ] Monitor database performance
- [ ] Check for failed deployments in logs

### Monthly
- [ ] Analyze login security metrics
- [ ] Review device fingerprint data
- [ ] Check account lockout patterns
- [ ] Update security thresholds if needed

### Quarterly
- [ ] Rotate BETTER_AUTH_SECRET
- [ ] Update SMTP credentials if employees changed
- [ ] Review and rotate database passwords
- [ ] Security audit of auth system

### Annually
- [ ] Full security review
- [ ] Penetration testing
- [ ] Update dependencies and libraries
- [ ] Compliance audit (GDPR, etc.)

---

## Support & Escalation

### Emergency Contacts
- **Security Issue:** Security team email
- **Deployment Issue:** DevOps team
- **Database Problem:** Database administrator
- **Email Not Working:** Email provider support

### Documentation Links
- [SECURITY.md](SECURITY.md) - Feature details
- [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md) - Verification
- [SECURITY_TESTING.md](SECURITY_TESTING.md) - Test procedures
- [.env.example](.env.example) - Configuration

---

**Deployment Checklist Status:** Ready for Staging  
**Last Updated:** April 8, 2024  
**Maintained By:** DevOps/Security Team
