# OpenPersona API - New Endpoints

> Base URL: `http://localhost:5000`
> All authenticated endpoints require header: `Authorization: Bearer <token>`

---

## 🔐 Authentication Enhancements

### Forgot Password

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Reset Password

```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "reset_token_from_email", "newPassword": "newSecurePass123"}'
```

### Change Password (Authenticated)

```bash
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"currentPassword": "oldPassword123", "newPassword": "newPassword456"}'
```

### Request Email Verification

```bash
curl -X POST http://localhost:5000/api/auth/request-verification \
  -H "Authorization: Bearer <token>"
```

### Verify Email

```bash
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token": "verification_token_from_email"}'
```

### Logout

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer <token>"
```

---

## ⚙️ User Settings

### Get Settings

```bash
curl -X GET http://localhost:5000/api/settings \
  -H "Authorization: Bearer <token>"
```

### Update Settings

```bash
curl -X PATCH http://localhost:5000/api/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"theme": "dark", "language": "en", "timezone": "Asia/Kolkata"}'
```

### Update Notification Preferences

```bash
curl -X PATCH http://localhost:5000/api/settings/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"email": true, "push": false, "marketing": false}'
```

### Update Privacy Settings

```bash
curl -X PATCH http://localhost:5000/api/settings/privacy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"profile_public": true, "show_email": false, "allow_indexing": true}'
```

### Delete Account

```bash
curl -X DELETE http://localhost:5000/api/settings/account \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"confirmPassword": "yourPassword123"}'
```

---

## 🔗 Links CRUD

### List Links

```bash
curl -X GET http://localhost:5000/api/links \
  -H "Authorization: Bearer <token>"
```

### Create Link

```bash
curl -X POST http://localhost:5000/api/links \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"label": "GitHub", "url": "https://github.com/username"}'
```

### Update Link

```bash
curl -X PUT http://localhost:5000/api/links/<link_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"label": "GitHub Profile", "url": "https://github.com/newusername"}'
```

### Delete Link

```bash
curl -X DELETE http://localhost:5000/api/links/<link_id> \
  -H "Authorization: Bearer <token>"
```

### Reorder Links

```bash
curl -X POST http://localhost:5000/api/links/reorder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"ids": ["uuid1", "uuid2", "uuid3"]}'
```

---

## 📁 Projects CRUD

### List Projects

```bash
curl -X GET http://localhost:5000/api/projects \
  -H "Authorization: Bearer <token>"
```

### Get Project

```bash
curl -X GET http://localhost:5000/api/projects/<project_id> \
  -H "Authorization: Bearer <token>"
```

### Create Project

```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "My Awesome Project",
    "description": "A detailed description of the project",
    "tags": ["react", "nodejs", "mongodb"],
    "links": ["https://github.com/user/project"]
  }'
```

### Update Project

```bash
curl -X PUT http://localhost:5000/api/projects/<project_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Updated Project Title",
    "description": "Updated description"
  }'
```

### Delete Project

```bash
curl -X DELETE http://localhost:5000/api/projects/<project_id> \
  -H "Authorization: Bearer <token>"
```

### Reorder Projects

```bash
curl -X POST http://localhost:5000/api/projects/reorder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"ids": ["uuid1", "uuid2", "uuid3"]}'
```

---

## 💼 Experience CRUD

### List Experiences

```bash
curl -X GET http://localhost:5000/api/experience \
  -H "Authorization: Bearer <token>"
```

### Create Experience

```bash
curl -X POST http://localhost:5000/api/experience \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "company": "Tech Corp",
    "role": "Senior Developer",
    "summary": "Led development of microservices architecture",
    "startDate": "2022-01",
    "endDate": "2024-01"
  }'
```

### Update Experience

```bash
curl -X PUT http://localhost:5000/api/experience/<exp_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "company": "Tech Corp Inc",
    "role": "Lead Developer"
  }'
```

### Delete Experience

```bash
curl -X DELETE http://localhost:5000/api/experience/<exp_id> \
  -H "Authorization: Bearer <token>"
```

### Reorder Experiences

```bash
curl -X POST http://localhost:5000/api/experience/reorder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"ids": ["uuid1", "uuid2"]}'
```

---

## 🎓 Education CRUD

### List Education

```bash
curl -X GET http://localhost:5000/api/education \
  -H "Authorization: Bearer <token>"
```

### Create Education

```bash
curl -X POST http://localhost:5000/api/education \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "institution": "MIT",
    "degree": "B.S. Computer Science",
    "summary": "Graduated with honors",
    "startDate": "2018-09",
    "endDate": "2022-05"
  }'
```

### Update Education

```bash
curl -X PUT http://localhost:5000/api/education/<edu_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"degree": "M.S. Computer Science"}'
```

### Delete Education

```bash
curl -X DELETE http://localhost:5000/api/education/<edu_id> \
  -H "Authorization: Bearer <token>"
```

### Reorder Education

```bash
curl -X POST http://localhost:5000/api/education/reorder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"ids": ["uuid1", "uuid2"]}'
```

---

## 📜 Certifications CRUD

### List Certifications

```bash
curl -X GET http://localhost:5000/api/certifications \
  -H "Authorization: Bearer <token>"
```

### Create Certification

```bash
curl -X POST http://localhost:5000/api/certifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "AWS Solutions Architect",
    "issuer": "Amazon Web Services",
    "summary": "Professional level certification",
    "credentialId": "AWS-12345",
    "issuedAt": "2023-06-15",
    "expiresAt": "2026-06-15"
  }'
```

### Update Certification

```bash
curl -X PUT http://localhost:5000/api/certifications/<cert_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "AWS Solutions Architect - Professional"}'
```

### Delete Certification

```bash
curl -X DELETE http://localhost:5000/api/certifications/<cert_id> \
  -H "Authorization: Bearer <token>"
```

### Reorder Certifications

```bash
curl -X POST http://localhost:5000/api/certifications/reorder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"ids": ["uuid1", "uuid2"]}'
```

---

## 🛠️ Skills CRUD

### List Skills

```bash
curl -X GET http://localhost:5000/api/skills \
  -H "Authorization: Bearer <token>"
```

### Create Skill

```bash
curl -X POST http://localhost:5000/api/skills \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "TypeScript", "level": "Expert"}'
```

### Update Skill

```bash
curl -X PUT http://localhost:5000/api/skills/<skill_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "TypeScript", "level": "Advanced"}'
```

### Delete Skill

```bash
curl -X DELETE http://localhost:5000/api/skills/<skill_id> \
  -H "Authorization: Bearer <token>"
```

### Reorder Skills

```bash
curl -X POST http://localhost:5000/api/skills/reorder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"ids": ["uuid1", "uuid2", "uuid3"]}'
```

---

## 🌐 Social Links CRUD

### List Social Links

```bash
curl -X GET http://localhost:5000/api/social-links \
  -H "Authorization: Bearer <token>"
```

### Create Social Link

```bash
curl -X POST http://localhost:5000/api/social-links \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"platform": "LinkedIn", "url": "https://linkedin.com/in/username"}'
```

### Update Social Link

```bash
curl -X PUT http://localhost:5000/api/social-links/<link_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"platform": "LinkedIn", "url": "https://linkedin.com/in/newusername"}'
```

### Delete Social Link

```bash
curl -X DELETE http://localhost:5000/api/social-links/<link_id> \
  -H "Authorization: Bearer <token>"
```

### Reorder Social Links

```bash
curl -X POST http://localhost:5000/api/social-links/reorder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"ids": ["uuid1", "uuid2"]}'
```

---

## 💬 Testimonials CRUD

### List Testimonials

```bash
curl -X GET http://localhost:5000/api/testimonials \
  -H "Authorization: Bearer <token>"
```

### Create Testimonial

```bash
curl -X POST http://localhost:5000/api/testimonials \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "authorName": "John Doe",
    "authorTitle": "CTO",
    "authorCompany": "Tech Corp",
    "content": "Amazing developer, highly recommend!",
    "rating": 5,
    "isPublic": true
  }'
```

### Update Testimonial

```bash
curl -X PUT http://localhost:5000/api/testimonials/<testimonial_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"content": "Updated testimonial content", "rating": 5}'
```

### Delete Testimonial

```bash
curl -X DELETE http://localhost:5000/api/testimonials/<testimonial_id> \
  -H "Authorization: Bearer <token>"
```

### Reorder Testimonials

```bash
curl -X POST http://localhost:5000/api/testimonials/reorder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"ids": ["uuid1", "uuid2"]}'
```

---

## 🔔 Notifications

### List Notifications

```bash
curl -X GET "http://localhost:5000/api/notifications?limit=20&offset=0" \
  -H "Authorization: Bearer <token>"
```

### List Unread Only

```bash
curl -X GET "http://localhost:5000/api/notifications?unreadOnly=true" \
  -H "Authorization: Bearer <token>"
```

### Mark Notification as Read

```bash
curl -X PATCH http://localhost:5000/api/notifications/<notification_id>/read \
  -H "Authorization: Bearer <token>"
```

### Mark All as Read

```bash
curl -X PATCH http://localhost:5000/api/notifications/read-all \
  -H "Authorization: Bearer <token>"
```

### Delete Notification

```bash
curl -X DELETE http://localhost:5000/api/notifications/<notification_id> \
  -H "Authorization: Bearer <token>"
```

### Clear All Notifications

```bash
curl -X DELETE http://localhost:5000/api/notifications \
  -H "Authorization: Bearer <token>"
```

---

## 📊 Dashboard Analytics

### Track Dashboard View (Public)

```bash
curl -X POST http://localhost:5000/api/analytics/<dashboard_id>/track/view
```

### Track Link Click (Public)

```bash
curl -X POST http://localhost:5000/api/analytics/<dashboard_id>/track/click \
  -H "Content-Type: application/json" \
  -d '{"linkId": "link_uuid", "linkUrl": "https://clicked-link.com"}'
```

### Get Dashboard Analytics

```bash
curl -X GET "http://localhost:5000/api/analytics/<dashboard_id>/analytics?period=7d" \
  -H "Authorization: Bearer <token>"
```

### Get Overall Analytics

```bash
curl -X GET "http://localhost:5000/api/analytics/analytics?period=30d" \
  -H "Authorization: Bearer <token>"
```

### Create Share Link

```bash
curl -X POST http://localhost:5000/api/analytics/<dashboard_id>/share \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"expiresIn": "7d", "maxViews": 100}'
```

### Get Dashboard by Share Token (Public)

```bash
curl -X GET http://localhost:5000/api/analytics/share/<share_token>
```

### Revoke Share Link

```bash
curl -X DELETE http://localhost:5000/api/analytics/<dashboard_id>/share/<share_id> \
  -H "Authorization: Bearer <token>"
```

### Duplicate Dashboard

```bash
curl -X POST http://localhost:5000/api/analytics/<dashboard_id>/duplicate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"newSlug": "my-dashboard-copy"}'
```

### Reorder Dashboards

```bash
curl -X POST http://localhost:5000/api/analytics/reorder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"order": ["uuid1", "uuid2", "uuid3"]}'
```

---

## 🔍 Search

### Search Public Profiles

```bash
curl -X GET "http://localhost:5000/api/search/profiles?q=john&limit=20"
```

### Search User's Own Content

```bash
curl -X GET "http://localhost:5000/api/search/content?q=react&type=projects" \
  -H "Authorization: Bearer <token>"
```

### Admin Global Search

```bash
curl -X GET "http://localhost:5000/api/search/admin?q=john&entity=users" \
  -H "Authorization: Bearer <token>"
```

---

## 💳 Billing

### Get Available Plans

```bash
curl -X GET http://localhost:5000/api/billing/plans
```

### Get Current Subscription

```bash
curl -X GET http://localhost:5000/api/billing/subscription \
  -H "Authorization: Bearer <token>"
```

### Get Billing History

```bash
curl -X GET "http://localhost:5000/api/billing/history?limit=20" \
  -H "Authorization: Bearer <token>"
```

### Upgrade Plan

```bash
curl -X POST http://localhost:5000/api/billing/upgrade \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"planTier": "growth", "paymentMethod": "card"}'
```

### Cancel Subscription

```bash
curl -X POST http://localhost:5000/api/billing/cancel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"reason": "Not needed anymore"}'
```

### Get Invoice

```bash
curl -X GET http://localhost:5000/api/billing/invoices/<invoice_id> \
  -H "Authorization: Bearer <token>"
```

---

## 📤 Export / Import

### Export User Data (JSON)

```bash
curl -X GET "http://localhost:5000/api/data/export?format=json" \
  -H "Authorization: Bearer <token>" \
  -o export.json
```

### Export User Data (CSV)

```bash
curl -X GET "http://localhost:5000/api/data/export?format=csv" \
  -H "Authorization: Bearer <token>" \
  -o export.csv
```

### Import User Data

```bash
curl -X POST http://localhost:5000/api/data/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "data": {
      "profile": {"headline": "Developer"},
      "links": [{"title": "GitHub", "url": "https://github.com/user"}],
      "skills": [{"name": "JavaScript", "level": "Expert"}]
    },
    "overwrite": false
  }'
```

### Export Resume as PDF (Coming Soon)

```bash
curl -X GET http://localhost:5000/api/data/export/pdf \
  -H "Authorization: Bearer <token>"
```

---

## 📋 Summary of New Routes

| Method              | Endpoint                         | Description                 |
| ------------------- | -------------------------------- | --------------------------- |
| POST                | `/api/auth/forgot-password`      | Request password reset      |
| POST                | `/api/auth/reset-password`       | Reset password with token   |
| POST                | `/api/auth/change-password`      | Change password (auth)      |
| POST                | `/api/auth/request-verification` | Request email verification  |
| POST                | `/api/auth/verify-email`         | Verify email with token     |
| POST                | `/api/auth/logout`               | Logout and invalidate token |
| GET                 | `/api/settings`                  | Get user settings           |
| PATCH               | `/api/settings`                  | Update user settings        |
| PATCH               | `/api/settings/notifications`    | Update notification prefs   |
| PATCH               | `/api/settings/privacy`          | Update privacy settings     |
| DELETE              | `/api/settings/account`          | Delete user account         |
| GET/POST/PUT/DELETE | `/api/links`                     | Links CRUD                  |
| GET/POST/PUT/DELETE | `/api/projects`                  | Projects CRUD               |
| GET/POST/PUT/DELETE | `/api/experience`                | Experience CRUD             |
| GET/POST/PUT/DELETE | `/api/education`                 | Education CRUD              |
| GET/POST/PUT/DELETE | `/api/certifications`            | Certifications CRUD         |
| GET/POST/PUT/DELETE | `/api/skills`                    | Skills CRUD                 |
| GET/POST/PUT/DELETE | `/api/social-links`              | Social Links CRUD           |
| GET/POST/PUT/DELETE | `/api/testimonials`              | Testimonials CRUD           |
| GET/PATCH/DELETE    | `/api/notifications`             | Notifications management    |
| GET/POST            | `/api/analytics/*`               | Dashboard analytics         |
| GET                 | `/api/search/*`                  | Search functionality        |
| GET/POST            | `/api/billing/*`                 | Billing management          |
| GET/POST            | `/api/data/*`                    | Export/Import               |
