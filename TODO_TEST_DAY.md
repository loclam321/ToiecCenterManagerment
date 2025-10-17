# ✅ TODO List - Test Day (17/10/2025)

## 🌅 Morning (08:00 - 12:00)

### ⏰ 08:00 - 08:30: Setup & Preparation
- [ ] Check email/notifications
- [ ] Pull latest code: `git pull origin Dev-B`
- [ ] Backup database: `python scripts/backup_db.py`
- [ ] Start backend: `flask run --debug`
- [ ] Start frontend: `npm run dev`
- [ ] Review test plan documents

### ⏰ 08:30 - 09:00: Seed Test Data
- [ ] Run: `python scripts/seed_realistic_test_data.py`
- [ ] Verify: `python scripts/verify_seeded_data.py`
- [ ] Check data counts match expected
- [ ] Save login credentials for testing
- [ ] Take screenshot of verify output

### ⏰ 09:00 - 10:00: Basic Functionality Test
- [ ] Login với student account
- [ ] Navigate to Schedule page
- [ ] Check schedule displays correctly
- [ ] Test filter Course dropdown
- [ ] Test filter Class dropdown
- [ ] Test "Reset" filter
- [ ] Note any issues found

### ⏰ 10:00 - 10:30: Coffee Break ☕
- [ ] Review notes from morning tests
- [ ] Prepare for deep testing session

### ⏰ 10:30 - 12:00: Deep Testing - Schedule Module
- [ ] **Week Navigation**
  - [ ] Click "Tuần trước" → Verify correct data
  - [ ] Click "Tuần sau" → Verify correct data  
  - [ ] Click "Tuần này" → Verify reset to current week
  - [ ] Check URL parameters update correctly
  
- [ ] **Status Colors**
  - [ ] Past sessions = Gray + opacity
  - [ ] Today sessions = Yellow/Red + animation
  - [ ] Future sessions = Blue/Purple
  - [ ] Status badges display correctly
  
- [ ] **Filters Combined**
  - [ ] Select Course + Class together
  - [ ] Change week while filter active
  - [ ] Clear filters
  - [ ] Multiple filter combinations

---

## 🌤️ Afternoon (13:00 - 18:00)

### ⏰ 13:00 - 14:00: Lunch Break 🍜
- [ ] Eat lunch
- [ ] Quick review of morning findings
- [ ] Prioritize afternoon tasks

### ⏰ 14:00 - 15:00: Test Other Modules
- [ ] **Tests Module**
  - [ ] Test attempt limit (max 2)
  - [ ] Test score display (10-point scale)
  - [ ] Test eligibility check
  - [ ] Test history display
  
- [ ] **Enrollment Module**
  - [ ] Check active enrollments display
  - [ ] Check completed enrollments
  - [ ] Check dropped enrollments hidden

### ⏰ 15:00 - 16:00: Edge Cases Testing
- [ ] **Empty States**
  - [ ] Student with no enrollments
  - [ ] Week with no schedules
  - [ ] Search with no results
  
- [ ] **Data Issues**
  - [ ] Missing room info
  - [ ] Missing teacher info
  - [ ] Deleted course reference
  
- [ ] **Conflicts**
  - [ ] Overlapping schedules
  - [ ] Same time different classes

### ⏰ 16:00 - 17:00: Mobile Responsive Testing
- [ ] Open DevTools → Device Mode
- [ ] **iPhone SE (375px)**
  - [ ] Schedule table scrolls horizontally
  - [ ] Filters full-width
  - [ ] Buttons touch-friendly
  - [ ] Text readable
  
- [ ] **iPad (768px)**
  - [ ] Layout adapts correctly
  - [ ] Session cards sized properly
  
- [ ] **Desktop (1920px)**
  - [ ] Full features visible
  - [ ] No wasted space

### ⏰ 17:00 - 18:00: Performance Testing
- [ ] Measure page load time
- [ ] Measure filter response time
- [ ] Check console for errors/warnings
- [ ] Monitor network tab
- [ ] Check memory usage
- [ ] Optional: Run Locust load test

---

## 🌙 Evening (19:00 - 21:00)

### ⏰ 19:00 - 20:00: Bug Fixing Session
- [ ] Review all bugs found today
- [ ] Prioritize: Critical → High → Medium → Low
- [ ] Fix critical bugs first
- [ ] Test fixes
- [ ] Commit fixes with clear messages

### ⏰ 20:00 - 20:30: Optimization Round
- [ ] Review slow queries
- [ ] Add indexes if needed
- [ ] Cache frequently accessed data
- [ ] Refactor bottleneck code
- [ ] Re-test performance

### ⏰ 20:30 - 21:00: Documentation & Wrap-up
- [ ] **Create Test Report**
  - [ ] Fill in `TEST_REPORT_2025_10_17.md`
  - [ ] List all passed tests
  - [ ] List all bugs found
  - [ ] Document performance metrics
  - [ ] Add screenshots
  
- [ ] **Update Documentation**
  - [ ] Update BUGS_FOUND.md
  - [ ] Update any technical docs
  - [ ] Add notes for tomorrow
  
- [ ] **Commit & Push**
  - [ ] Commit all changes
  - [ ] Push to Dev-B branch
  - [ ] Create PR if ready

---

## 📋 Bug Tracking

### Critical (P0) - Must Fix Today
- [ ] Bug #__: _____________________________ [Status: _______]

### High (P1) - Should Fix Today
- [ ] Bug #__: _____________________________ [Status: _______]
- [ ] Bug #__: _____________________________ [Status: _______]

### Medium (P2) - Fix This Week
- [ ] Bug #__: _____________________________ [Status: _______]
- [ ] Bug #__: _____________________________ [Status: _______]

### Low (P3) - Fix When Possible
- [ ] Bug #__: _____________________________ [Status: _______]

---

## 📊 Metrics to Track

### Performance
- [ ] Schedule page load: _______ ms (target: < 2000ms)
- [ ] Filter response: _______ ms (target: < 500ms)
- [ ] Week navigation: _______ ms (target: < 300ms)
- [ ] API p95: _______ ms (target: < 500ms)

### Quality
- [ ] Total tests run: _______
- [ ] Tests passed: _______
- [ ] Tests failed: _______
- [ ] Success rate: _______ % (target: > 95%)

### Data
- [ ] Courses: _______ (expected: 9)
- [ ] Classes: _______ (expected: ~36)
- [ ] Students: _______ (expected: 150)
- [ ] Enrollments: _______ (expected: ~200)
- [ ] Schedules: _______ (expected: ~400)

---

## 🎯 Success Criteria

### Must Achieve
- [ ] ✅ All filters work correctly
- [ ] ✅ No critical bugs
- [ ] ✅ Performance meets targets
- [ ] ✅ Mobile responsive works

### Bonus Goals
- [ ] 🌟 Zero bugs found
- [ ] 🌟 All edge cases handled
- [ ] 🌟 Performance exceeds targets
- [ ] 🌟 Code coverage > 80%

---

## 💡 Notes & Observations

### Morning Session
- _______________________________________
- _______________________________________

### Afternoon Session
- _______________________________________
- _______________________________________

### Evening Session
- _______________________________________
- _______________________________________

### Overall Thoughts
- _______________________________________
- _______________________________________

---

## 📞 Quick Reference

**Login Credentials:**
- Teacher: `teacher1@toeic.edu.vn` / `teacher123`
- Student: `student1@toeic.edu.vn` / `student123`

**Important Files:**
- Test Plan: `TEST_PLAN_TOMORROW.md`
- Quick Guide: `QUICK_START_TEST_GUIDE.md`
- Tech Docs: `SCHEDULE_OPTIMIZATION_IMPLEMENTATION.md`

**Commands:**
```bash
# Backup DB
python scripts/backup_db.py

# Seed Data
python scripts/seed_realistic_test_data.py

# Verify Data
python scripts/verify_seeded_data.py

# Run Backend
flask run --debug

# Run Frontend
npm run dev
```

---

**Date**: 2025-10-17  
**Tester**: _________________  
**Start Time**: _____________  
**End Time**: _______________  
**Status**: ⭕ Not Started / 🔄 In Progress / ✅ Completed
