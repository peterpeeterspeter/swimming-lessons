# Testing Checklist for Swimming-Lessons.com

## ✅ Automated Tests Completed

### Type Checking
- ✅ **TypeScript Compilation** - All packages type-check successfully
- ✅ **Fixed Error** - Fixed metadata type error in `inviteMember.handler.integration-test.ts`
- ✅ **Zero Type Errors** - Clean build across all 136 packages

### Linting
- ✅ **ESLint** - No linting errors found
- ✅ **Code Quality** - All code passes style checks

## 🔄 Tests Requiring Docker (Run When Available)

To run these tests, first start Docker and the development environment:

```bash
# Start Docker Desktop app
# Then run:
yarn dx

# In a separate terminal, run tests:
yarn test
yarn test-e2e
```

### Unit Tests
```bash
# Run all unit tests
TZ=UTC yarn test

# Run specific swim tests
yarn test packages/trpc/server/routers/viewer/swim
```

### E2E Tests
```bash
# Run all E2E tests
yarn test-e2e

# Run swim-specific E2E tests
yarn test-e2e apps/web/playwright/swim.e2e.ts
yarn test-e2e apps/web/playwright/swim-flows.e2e.ts

# Run specific test
yarn e2e apps/web/playwright/swim-flows.e2e.ts --grep "Instructor marks attendance"
```

## 📱 Manual Testing Checklist

### Parent Flows

#### 1. Add Swimmer Profile
- [ ] Navigate to `/parent`
- [ ] Click "+ Add Swimmer" button
- [ ] Fill out form with all required fields
- [ ] Add multiple emergency contacts
- [ ] Verify validation errors for missing fields
- [ ] Submit and verify success toast
- [ ] Verify redirect to `/parent` with new swimmer listed

#### 2. Edit Swimmer Profile
- [ ] Click on a swimmer from parent dashboard
- [ ] Click "Edit" button
- [ ] Modify swimmer details
- [ ] Add/remove emergency contacts
- [ ] Save changes and verify update
- [ ] Verify changes reflected on detail page

#### 3. Delete Swimmer
- [ ] Go to edit swimmer page
- [ ] Click "Delete Swimmer Profile"
- [ ] Verify confirmation dialog
- [ ] Confirm deletion
- [ ] Verify redirect to parent dashboard
- [ ] Verify swimmer no longer listed

#### 4. View Swimmer Details
- [ ] Navigate to swimmer detail page
- [ ] Verify all profile info displays correctly
- [ ] Check attendance history section
- [ ] Check progress notes section
- [ ] Verify emergency contacts display

### Instructor Flows

#### 1. View Today's Lessons
- [ ] Navigate to `/instructor`
- [ ] Verify today's lessons display
- [ ] Check attendance counts show correctly
- [ ] Verify time formatting

#### 2. Mark Attendance
- [ ] Click "Open" on a lesson
- [ ] Verify roster loads with all enrolled swimmers
- [ ] Select attendance status for each swimmer
- [ ] Add optional notes
- [ ] Click "Save Attendance"
- [ ] Verify success toast
- [ ] Verify status persists on refresh

#### 3. Add Progress Notes
- [ ] On attendance page, add notes in textarea
- [ ] Click "Save Notes"
- [ ] Verify success message
- [ ] Check parent can see notes

### Manager Flows

#### 1. View Dashboard
- [ ] Navigate to `/manager`
- [ ] Verify summary cards display:
  - Today's lesson count
  - Total enrolled students
  - Marking completion percentage
  - Attendance rate percentage
- [ ] Verify lesson list shows all today's lessons
- [ ] Check status indicators (complete/incomplete)

#### 2. Access Rosters
- [ ] Click "View Roster →" on any lesson
- [ ] Verify redirects to attendance page
- [ ] Confirm can view but not necessarily edit

### Navigation & UX

#### 1. Role-Based Navigation
- [ ] Navigate to `/swim`
- [ ] Verify correct links show based on user role
- [ ] Test navigation between role dashboards

#### 2. Mobile Experience
- [ ] Test all forms on mobile viewport (< 768px)
- [ ] Verify buttons are easily tappable (48px min)
- [ ] Check responsive layouts work
- [ ] Test attendance interface on mobile

#### 3. Error Handling
- [ ] Trigger validation errors on forms
- [ ] Test with invalid data
- [ ] Verify error messages are clear
- [ ] Check loading states show appropriately

## 🐛 Known Issues / Edge Cases to Test

### Data Validation
- [ ] Test date picker limits (can't select future dates for birthdate)
- [ ] Test empty emergency contact validation
- [ ] Test duplicate swimmer names
- [ ] Test special characters in names

### Concurrency
- [ ] Two instructors marking same lesson attendance
- [ ] Parent editing swimmer while instructor views roster
- [ ] Multiple tabs open with same data

### Performance
- [ ] Large roster (20+ swimmers)
- [ ] Many progress notes (100+)
- [ ] Long medical notes text

## 🔍 Browser Compatibility

Test on:
- [ ] Chrome (Desktop)
- [ ] Safari (Desktop)
- [ ] Firefox (Desktop)
- [ ] Safari (iOS)
- [ ] Chrome (Android)

## 📊 Test Coverage Goals

Current swim-specific code:
- API Routes: 6 routers with comprehensive endpoints
- UI Pages: 8 main pages + sub-pages
- Forms: 2 complex forms with validation
- E2E Tests: 2 test files covering main flows

Target Coverage:
- Unit Tests: 80%+ for business logic
- E2E Tests: Cover all critical user paths
- Manual Tests: All flows tested on mobile + desktop

## 🚀 Pre-Deployment Checklist

Before deploying to staging:
- [ ] All automated tests pass
- [ ] Manual testing complete on all roles
- [ ] Mobile testing complete (iOS + Android)
- [ ] No console errors in browser
- [ ] Performance acceptable (< 2s page loads)
- [ ] Database migrations tested
- [ ] Environment variables configured

## 📝 Testing Notes

### Type Error Fixed
Fixed TypeScript error in `inviteMember.handler.integration-test.ts` line 94:
- Issue: `Record<string, unknown>` not assignable to Prisma's InputJsonValue
- Solution: Added type assertion `as any` for metadata field
- Impact: Zero - test file only, no runtime impact

### Swim-Specific Features Implemented
All features are code-complete and ready for testing:
- ✅ Swimmer CRUD operations
- ✅ Attendance marking
- ✅ Progress notes
- ✅ Role-specific dashboards
- ✅ Form validation
- ✅ Authorization checks

### Next Testing Session
When Docker is available:
1. Start `yarn dx`
2. Run unit tests: `TZ=UTC yarn test`
3. Run E2E tests: `yarn test-e2e apps/web/playwright/swim*.e2e.ts`
4. Fix any test failures
5. Complete manual testing checklist above

## 🎯 Testing Priority

**High Priority (Core Functionality):**
1. Swimmer add/edit/delete (parent)
2. Attendance marking (instructor)
3. Progress note viewing (parent)
4. Dashboard stats (manager)

**Medium Priority (UX):**
1. Form validation
2. Mobile responsiveness
3. Navigation flows
4. Error handling

**Low Priority (Edge Cases):**
1. Concurrent editing
2. Large datasets
3. Browser compatibility
4. Performance optimization

---

**Status:** ✅ Static analysis complete (type-check, lint)
**Next:** Manual testing + E2E tests when Docker available
**Estimated Time:** 1-2 hours for comprehensive testing
