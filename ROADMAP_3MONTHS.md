# 🚀 Tamely - 3 Month Roadmap (2 Developer Team Project)

**ช่วงเวลา:** 3 เดือน (Jan - Mar 2025)  
**ทีม:** 2 คน  
**ผู้ใช้ตัวอย่าง:** ~50 คน  
**Project Status:** โปรเจกเทมอเรียน

---

## 📊 Timeline Overview

```
Week 1-2:   Backend Setup + Auth
Week 3-6:   Core Features (Chat + Room)
Week 7-9:   AI Integration + Feed
Week 10-12: Testing + Deployment
```

---

## 🎯 Phase 1: Setup (Week 1-2) - 10 วัน

### 1.1 Infrastructure Setup (5 วัน)

**Backend Setup**

- [ ] Node.js + Express/NestJS setup
- [ ] TypeScript configuration
- [ ] Prisma ORM setup + PostgreSQL
- [ ] Environment variables (.env)
- [ ] Git repository structure

**Frontend Setup**

- [ ] React + TypeScript setup (Vite ⚡)
- [ ] TailwindCSS configuration
- [ ] Folder structure
- [ ] ESLint + Prettier

**DevOps**

- [ ] Docker setup (PostgreSQL container)
- [ ] Database migrations script
- [ ] .gitignore + README

**Estimated Time:** 5 วัน (หนึ่งคนทำ Backend, อีกคนทำ Frontend)

### 1.2 Authentication & User Management (5 วัน)

**Backend**

- [ ] User model + database schema
- [ ] JWT token strategy
- [ ] Hash password (bcrypt)
- [ ] Register endpoint
- [ ] Login endpoint
- [ ] Refresh token logic
- [ ] Middleware: auth guard

**Frontend**

- [ ] Login page
- [ ] Register page
- [ ] Auth context/store
- [ ] Protected routes

**Estimated Time:** 5 วัน

---

## 🎯 Phase 2: Core Features (Week 3-6) - 20 วัน

### 2.1 Workspace Management (5 วัน)

**Backend**

- [ ] Create workspace API
- [ ] Join workspace API (by code/link)
- [ ] List user's workspaces
- [ ] Workspace member management
- [ ] Role assignment (Admin/Member)
- [ ] Permission checking middleware

**Frontend**

- [ ] Workspace list page
- [ ] Create workspace form
- [ ] Join workspace form (with code)
- [ ] Workspace selector/switcher

**Database**

- [ ] Run migrations

**Estimated Time:** 5 วัน

### 2.2 Rooms/Channels (3 วัน)

**Backend**

- [ ] Create room API
- [ ] List rooms (in workspace)
- [ ] Join/leave room
- [ ] Room member management
- [ ] Public/Private room support
- [ ] Permission checks

**Frontend**

- [ ] Room list sidebar
- [ ] Create room modal
- [ ] Room selector
- [ ] Room info panel

**Estimated Time:** 3 วัน

### 2.3 Real-time Messaging (7 วัน)

**Backend**

- [ ] Socket.IO setup
- [ ] Message model + database
- [ ] Send message event handler
- [ ] Message history API (pagination)
- [ ] Broadcast message to room members
- [ ] User online/offline tracking
- [ ] Message validation

**Frontend**

- [ ] Socket.IO client setup
- [ ] Message input box
- [ ] Message list (auto-scroll)
- [ ] Real-time message rendering
- [ ] Typing indicator (optional)
- [ ] Error handling

**Estimated Time:** 7 วัน

### 2.4 Testing & Fixes (5 วัน)

- [ ] E2E testing (basic flow)
- [ ] Bug fixes
- [ ] Performance tuning

**Estimated Time:** 5 วัน

---

## 🎯 Phase 3: Announcement Feed (Week 7-9) - 15 วัน

### 3.1 Announcement Management (5 วัน)

**Backend**

- [ ] Create post API
- [ ] Edit post API
- [ ] Delete post API
- [ ] List posts (paginated)
- [ ] Pin/unpin post
- [ ] Permission checks (only Admin/Author)

**Frontend**

- [ ] Announcement feed page
- [ ] Post card component
- [ ] Create post form
- [ ] Edit post form
- [ ] Pin button

**Estimated Time:** 5 วัน

### 3.2 Post Comments (3 วัน)

**Backend**

- [ ] Add comment API
- [ ] List comments
- [ ] Delete comment

**Frontend**

- [ ] Comment section
- [ ] Comment input
- [ ] Display comments

**Estimated Time:** 3 วัน

### 3.3 AI Summarization (7 วัน)

**Backend**

- [ ] OpenAI API integration
- [ ] Fetch messages from room (last 24h)
- [ ] Generate summary endpoint
- [ ] Cache summary (AiSummary model)
- [ ] Rate limiting (1 summary per room per day)

**Frontend**

- [ ] Request summary button
- [ ] Display summary modal
- [ ] Show last summary time

**AI Logic (Simple Version)**

```
1. Get last N messages from room
2. Filter by content length > 20 chars
3. Send to OpenAI API
4. Parse response
5. Cache result
```

**Estimated Time:** 7 วัน

---

## 🎯 Phase 4: Polish & Deployment (Week 10-12) - 15 วัน

### 4.1 Bug Fixes (5 วัน)

- [ ] Fix chat room UI issues
- [ ] Fix Socket.IO disconnection handling
- [ ] Fix permission bugs
- [ ] Mobile responsive design

### 4.2 Performance & Security (3 วัน)

- [ ] Add rate limiting (express-rate-limit)
- [ ] Input validation (joi/yup)
- [ ] CORS configuration
- [ ] SQL injection prevention (Prisma ✓)
- [ ] Cache optimization

### 4.3 Testing (4 วัน)

- [ ] Manual testing all features
- [ ] Load testing (50 concurrent users)
- [ ] Regression testing
- [ ] UI/UX review

### 4.4 Deployment (3 วัน)

- [ ] Prepare deploy (Railway/Render/Vercel)
- [ ] Database backup strategy
- [ ] Monitoring setup
- [ ] Launch!

---

## 📋 Feature Checklist (MVP Only)

### Core Features ✅

- [x] User authentication (register/login)
- [x] Workspace management
- [x] Room/channel creation
- [x] Real-time messaging
- [x] Message history
- [x] Announcement posts
- [x] Pin important posts
- [x] Basic AI summarization

### NOT Included (Phase 2+)

- [ ] File/image upload
- [ ] Message reactions (emoji)
- [ ] Message mentions (@user)
- [ ] Message threads/replies
- [ ] Read receipts
- [ ] Advanced AI (RAG)
- [ ] Search functionality
- [ ] Notifications
- [ ] Multi-level roles (Manager/Executive)
- [ ] Invitation links with expiry

---

## 💻 Technology Stack

### Backend

- **Framework:** Express.js / NestJS
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Real-time:** Socket.IO
- **Auth:** JWT + bcrypt
- **AI:** OpenAI API (GPT-3.5 turbo)
- **Validation:** Joi/Yup

### Frontend

- **Framework:** React + TypeScript
- **Build:** Vite
- **Styling:** TailwindCSS
- **HTTP:** Axios
- **Real-time:** Socket.IO Client
- **State:** Context API / Zustand
- **Forms:** React Hook Form + Yup

### DevOps

- **Database:** PostgreSQL (Docker)
- **Hosting Options:**
  - Backend: Railway/Render/Heroku
  - Frontend: Vercel/Netlify
  - Database: Railway/Supabase

---

## 📊 Team Task Division (Suggested)

### Developer 1 (Backend Lead)

- Week 1-2: Backend setup + Auth
- Week 3-4: Workspace + Rooms
- Week 5-6: Socket.IO messaging
- Week 7-8: AI integration
- Week 9-12: API optimization + deployment

### Developer 2 (Frontend Lead)

- Week 1-2: Frontend setup + Auth UI
- Week 3-4: Workspace/Room UI
- Week 5-6: Chat UI + real-time rendering
- Week 7-8: Feed UI + AI features
- Week 9-12: Bug fixes + deployment

### Parallel Work (when possible)

- Backend/Frontend ทำพร้อมกันได้ หลังจากเสร็จ API contract
- Test while developing

---

## 🚨 Risk Management

### Potential Bottlenecks

1. **Socket.IO Stability** - May need debugging (Day 5-7)
   - Solution: Test early with 10-20 mock users
2. **Database Scaling** - PostgreSQL with 50 users should be fine
   - Solution: Add basic indexing, query optimization
3. **AI Cost** - OpenAI might be expensive if not rate-limited
   - Solution: Limit to 1 summary/room/day = $0.02/day max
4. **Real-time Sync** - Race conditions with concurrent messages
   - Solution: Message queue with timestamp

### Mitigation Strategies

- ✅ Weekly progress check
- ✅ Early testing with Socket.IO
- ✅ Use OpenAI `gpt-3.5-turbo` (cheaper)
- ✅ Set up monitoring from day 1

---

## 📈 Success Metrics

### MVP Completion

- [ ] All 50 test users can log in
- [ ] Create workspace successfully
- [ ] Send messages in real-time (<500ms latency)
- [ ] View message history
- [ ] Post announcements
- [ ] Get AI summaries

### Performance Targets

- API response time: <200ms
- Message delivery: <500ms
- Page load time: <3s
- Uptime: >99% during testing

### Quality Gates

- No critical bugs at launch
- Basic security checks passed
- Mobile responsive design
- Works on Chrome/Safari/Firefox

---

## 📚 MVP Schema (Simplified)

```sql
-- REQUIRED tables only
- User
- Workspace
- WorkspaceMember
- Room
- RoomMember
- Message
- Post
- PostComment
- AiSummary (summary cache)
- AiQuery (log)

-- NOT INCLUDED YET
- Attachment
- Notification
- MessageReaction
- MessageMention
- ReadReceipt
- WorkspaceInvitation
- AiUsageLog
```

---

## 🎓 Demo for Professor

**What to Show:**

1. Create account + login (2 min)
2. Create workspace (1 min)
3. Invite friend to join (1 min)
4. Create room + send messages real-time (2 min)
5. Post announcement (1 min)
6. Request AI summary (1 min)
7. Show database + architecture (2 min)

**Total Demo Time:** ~10 minutes ✅

---

## 📝 Notes

- ⚠️ **First Priority:** Get messaging working reliably
- ⚠️ **Second Priority:** Test with 50 concurrent users
- ⚠️ **Third Priority:** Polish UI/UX
- ✅ **Don't worry about:** Advanced features, perfect mobile UI
- ✅ **Use:** Tailwind for fast UI development
- ✅ **Test early:** Socket.IO + real-time sync issues

---

**Good luck! 💪 ท่าแนวๆ นี้ 3 เดือนจำหน่ายได้!**
