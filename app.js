/**
 * TagaDetect - Application Controller with Dedicated Class Pages
 * - Dedicated Class Page with 3 visualization tabs:
 *   1. Activities & Submissions (with automated AI reviews upon passing)
 *   2. Class Materials (documents, lecture slides, lab manuals, syllabi)
 *   3. People (Instructors and Enrolled Students roster)
 * - Strict role enforcement: Only students join classes; only professors create & grade
 */

class TagaApp {
  constructor() {
    this.currentUser = TagaStore.get(STORAGE_KEYS.CURRENT_USER);
    this.currentTheme = TagaStore.get(STORAGE_KEYS.THEME, 'dark');
    this.currentPage = 'home';
    this.selectedClassId = null;
    this.currentClassTab = 'activities'; // 'activities', 'materials', 'people'
    this.lastDetectionResult = null;

    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.bindGlobalEvents();
    this.renderHeaderUser();
    this.renderPage(this.currentPage);
  }

  /* ---------------- Theme & Global Bindings ---------------- */
  applyTheme(theme) {
    this.currentTheme = theme;
    TagaStore.set(STORAGE_KEYS.THEME, theme);
    document.documentElement.setAttribute('data-theme', theme);
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.innerHTML = theme === 'dark' ? 'â˜€ï¸' : 'ðŸŒ™';
      themeBtn.title = `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`;
    }
  }

  toggleTheme() {
    const nextTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
    this.showToast(`Switched to ${nextTheme.charAt(0).toUpperCase() + nextTheme.slice(1)} Mode`);
  }

  bindGlobalEvents() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    const roleSelect = document.getElementById('quick-role-select');
    if (roleSelect) {
      roleSelect.value = this.currentUser ? this.currentUser.id : 'usr_student_1';
      roleSelect.addEventListener('change', (e) => {
        const users = TagaStore.get(STORAGE_KEYS.USERS, []);
        const user = users.find(u => u.id === e.target.value);
        if (user) {
          this.switchUser(user);
        }
      });
    }

    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop')) {
        this.closeAllModals();
      }
    });

    document.querySelectorAll('.modal-close-btn, .btn-modal-close').forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });
  }

  switchUser(user) {
    this.currentUser = user;
    TagaStore.set(STORAGE_KEYS.CURRENT_USER, user);
    this.selectedClassId = null;
    this.renderHeaderUser();
    this.showToast(`Switched view to ${user.name} (${user.role.toUpperCase()})`);
    this.renderPage('home');
  }

  renderHeaderUser() {
    const userAvatar = document.getElementById('header-user-avatar');
    const teachingNav = document.getElementById('nav-teaching');
    const adminNav = document.getElementById('nav-admin');
    const homeNav = document.getElementById('nav-home');

    if (this.currentUser) {
      if (userAvatar) userAvatar.src = this.currentUser.avatar;

      if (homeNav) {
        if (this.currentUser.role === 'student') {
          homeNav.textContent = 'Enrolled Classes';
        } else if (this.currentUser.role === 'professor') {
          homeNav.textContent = 'Classes Handled';
        } else {
          homeNav.textContent = 'All Classes';
        }
      }

      if (teachingNav) {
        teachingNav.style.display = (this.currentUser.role === 'professor' || this.currentUser.role === 'admin') ? 'inline-flex' : 'none';
      }
      if (adminNav) {
        adminNav.style.display = (this.currentUser.role === 'admin') ? 'inline-flex' : 'none';
      }
    }

    this.updateAdminBadge();
  }

  updateAdminBadge() {
    const users = TagaStore.get(STORAGE_KEYS.USERS, []);
    const pending = users.filter(u => u.role === 'professor' && u.status === 'pending');
    const badge = document.getElementById('admin-pending-badge');
    if (badge) {
      if (pending.length > 0) {
        badge.textContent = pending.length;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  /* ---------------- Navigation ---------------- */
  navigate(pageId, extraData = null) {
    this.currentPage = pageId;
    if (extraData && extraData.classId) {
      this.selectedClassId = extraData.classId;
    }

    document.querySelectorAll('.nav-item').forEach(el => {
      if (el.dataset.page === pageId) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    this.renderPage(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderPage(pageId) {
    const content = document.getElementById('main-content');

    // If a class is actively selected and on home/classes, show the dedicated Class Page!
    if (this.selectedClassId && (pageId === 'home' || pageId === 'classes')) {
      content.innerHTML = this.renderDedicatedClassPage();
      return;
    }

    switch (pageId) {
      case 'home':
        content.innerHTML = this.renderRoleBasedHomePage();
        break;

      case 'detector':
        content.innerHTML = this.renderCleanDetectorPage();
        this.bindDetectorEvents();
        break;

      case 'classes':
        if (this.currentUser && this.currentUser.role === 'student') {
          this.showToast('Students access classes via Enrolled Classes', 'info');
          content.innerHTML = this.renderRoleBasedHomePage();
        } else {
          content.innerHTML = this.renderCleanTeachingPage();
        }
        break;

      case 'admin':
        if (this.currentUser && this.currentUser.role !== 'admin') {
          this.showToast('Admin approvals require Administrator role', 'warning');
          content.innerHTML = this.renderRoleBasedHomePage();
        } else {
          content.innerHTML = this.renderCleanAdminPage();
        }
        break;

      case 'about':
        content.innerHTML = this.renderCleanAboutPage();
        break;

      case 'settings':
        content.innerHTML = this.renderCleanSettingsPage();
        break;

      case 'login':
        content.innerHTML = this.renderCleanLoginPage();
        this.bindAuthEvents('login');
        break;

      case 'signup':
        content.innerHTML = this.renderCleanSignupPage();
        this.bindAuthEvents('signup');
        break;

      default:
        content.innerHTML = this.renderRoleBasedHomePage();
    }
  }

  /* ---------------- UI: Role-Based Home & Classes Grid ---------------- */
  renderRoleBasedHomePage() {
    const role = this.currentUser ? this.currentUser.role : 'student';
    const isStudent = role === 'student';
    const isProf = role === 'professor';
    const isAdmin = role === 'admin';
    const isPendingProf = isProf && this.currentUser.status === 'pending';

    const classes = TagaStore.get(STORAGE_KEYS.CLASSES, []);
    const activities = TagaStore.get(STORAGE_KEYS.ACTIVITIES, []);
    const materials = TagaStore.get(STORAGE_KEYS.MATERIALS, []);
    const currentUserId = this.currentUser ? this.currentUser.id : 'usr_student_1';

    let visibleClasses = [];
    if (isStudent) {
      visibleClasses = classes.filter(cls => cls.studentIds && cls.studentIds.includes(currentUserId));
    } else if (isProf) {
      visibleClasses = classes.filter(cls => cls.professorId === currentUserId);
    } else {
      visibleClasses = classes;
    }

    return `
      <div>
        ${isPendingProf ? `
          <div class="card" style="border: 1px solid var(--accent-rose); background: rgba(244, 63, 94, 0.08); margin-bottom: 32px; padding: 20px 24px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
              <div style="display: flex; align-items: center; gap: 14px;">
                <span style="font-size: 28px;">â³</span>
                <div>
                  <h3 style="font-size: 16px; font-weight: 700; color: var(--accent-rose);">Professor Account Pending Administrative Verification</h3>
                  <p style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">
                    Your account is in the Admin Approval Queue. Once approved, you can create new classes and grade student submissions.
                  </p>
                </div>
              </div>
              <button class="btn btn-secondary" style="font-size: 12px; padding: 6px 14px; white-space: nowrap;" onclick="window.tagaApp.switchUser(TagaStore.get(STORAGE_KEYS.USERS)[7])">
                Switch to Admin to Approve
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Hero Section -->
        <section class="hero-clean">
          <div>
            <div class="hero-tag">
              <span>âœ¦</span> ${isStudent ? 'STUDENT PORTAL' : (isProf ? 'PROFESSOR PORTAL' : 'ADMINISTRATOR PORTAL')}
            </div>
            <h1 class="hero-title">
              ${isStudent 
                ? 'Join classes, explore materials, and pass activities.'
                : (isProf 
                    ? 'Create classes, upload materials, and grade activities.' 
                    : 'Oversee institutional integrity, faculty approvals, and classes.')}
            </h1>
            <p class="hero-subtitle">
              ${isStudent
                ? 'Only students can join class sections with codes. Your passed activities are reviewed automatically upon submission with shared transparency.'
                : (isProf
                    ? 'Professors are the exclusive creators of classes. Share your unique class codes with students, upload course materials, and grade with AI insights.'
                    : 'Manage faculty registrations, verify credentials, and review user feedback.')}
            </p>
            <div class="hero-cta-group">
              ${isStudent ? `
                <button class="btn btn-primary" onclick="window.tagaApp.openEnrollModal()">
                  + Join Class with Code
                </button>
                <button class="btn btn-secondary" onclick="window.tagaApp.navigate('detector')">
                  Open AI Detector
                </button>
              ` : ''}

              ${isProf ? `
                <button class="btn btn-primary" onclick="window.tagaApp.openCreateClassModal()" ${isPendingProf ? 'disabled title="Account pending approval"' : ''}>
                  + Create New Class Section
                </button>
                <button class="btn btn-secondary" onclick="window.tagaApp.navigate('detector')">
                  Open AI Detector
                </button>
              ` : ''}

              ${isAdmin ? `
                <button class="btn btn-primary" onclick="window.tagaApp.navigate('admin')">
                  Inspect Pending Approvals Queue
                </button>
              ` : ''}
            </div>
          </div>

          <div class="hero-preview-wrapper">
            <div class="hero-float-card">
              <div class="hero-stat-badge">
                <span style="font-size: 13px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">
                  ${isStudent ? 'Enrolled Classes' : 'Classes Handled'}
                </span>
                <span class="badge ${isStudent ? 'badge-human' : 'badge-ai'}">
                  ${isStudent ? 'Student Active' : 'Faculty Active'}
                </span>
              </div>
              <div class="hero-stat-num">${visibleClasses.length}</div>
              <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
                ${isStudent ? 'Select any class below to view its dedicated page, activities, materials, and people.' : 'Select a class below to manage its materials, activities, and students.'}
              </div>
            </div>

            <div class="hero-float-card" style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <strong style="font-size: 14px; color: var(--text-main);">Dedicated Class Pages</strong>
                <div style="font-size: 12px; color: var(--text-muted);">
                  Visualize activities, materials, and people inside each class
                </div>
              </div>
              <span class="badge badge-ai" style="font-size: 12px; padding: 4px 10px;">Full Portal</span>
            </div>
          </div>
        </section>

        <!-- Classes Section Header -->
        <div class="section-header-clean">
          <div>
            <h2>${isStudent ? 'My Enrolled Classes' : (isProf ? 'Classes Handled by You' : 'All Institutional Classes')}</h2>
            <p>Click on any class to open its dedicated page with activities, materials, and class members</p>
          </div>
          <div>
            ${isStudent ? `
              <button class="btn btn-primary" style="padding: 8px 18px; font-size: 13px;" onclick="window.tagaApp.openEnrollModal()">
                + Join Class
              </button>
            ` : ''}

            ${isProf ? `
              <button class="btn btn-primary" style="padding: 8px 18px; font-size: 13px;" onclick="window.tagaApp.openCreateClassModal()" ${isPendingProf ? 'disabled' : ''}>
                + Create Class
              </button>
            ` : ''}
          </div>
        </div>

        <!-- 3-Column Classes Grid -->
        ${visibleClasses.length === 0 ? `
          <div class="card" style="text-align: center; padding: 48px;">
            <div style="font-size: 38px; margin-bottom: 12px;">${isStudent ? 'ðŸŽ’' : 'ðŸ“š'}</div>
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">
              ${isStudent ? 'No Enrolled Classes Found' : 'No Classes Handled Yet'}
            </h3>
            <p style="color: var(--text-muted); font-size: 14px; max-width: 480px; margin: 0 auto 20px;">
              ${isStudent 
                ? 'Click "+ Join Class" and enter the 6-character code (such as AUT-305 or NET-310) given by your professor to enroll.'
                : 'Click "+ Create Class" to establish a new subject section and generate a class code for your students.'}
            </p>
            ${isStudent ? `
              <button class="btn btn-primary" onclick="window.tagaApp.openEnrollModal()">+ Join a Class Section</button>
            ` : `
              <button class="btn btn-primary" onclick="window.tagaApp.openCreateClassModal()" ${isPendingProf ? 'disabled' : ''}>+ Create Class</button>
            `}
          </div>
        ` : `
          <div class="classes-clean-grid">
            ${visibleClasses.map(cls => {
              const classActivities = activities.filter(a => a.classId === cls.id);
              const classMaterials = materials.filter(m => m.classId === cls.id);
              const studentCount = cls.studentIds ? cls.studentIds.length : 0;

              return `
                <div class="clean-class-card" onclick="window.tagaApp.openDedicatedClassPage('${cls.id}')">
                  <div>
                    <div class="clean-card-tag-row">
                      <span class="clean-subject-badge">Code: ${cls.code}</span>
                      <span class="clean-section-tag">${cls.section}</span>
                    </div>

                    <h3 class="clean-class-title">${cls.subjectName}</h3>

                    <div class="clean-class-instructor">
                      <img src="${cls.professorAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}" class="clean-instructor-img" />
                      <div>
                        <div class="clean-instructor-name">${cls.professorName}</div>
                        <div class="clean-instructor-sub">${cls.room} â€¢ ${cls.schedule}</div>
                      </div>
                    </div>
                  </div>

                  <div class="clean-card-bottom">
                    <span class="clean-activity-pill">
                      <span>ðŸ“</span> ${classActivities.length} Activities â€¢ <span>ðŸ“</span> ${classMaterials.length} Materials
                    </span>
                    <span class="clean-arrow-btn">Open Class Page â†’</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  }

  /* ---------------- UI: DEDICATED CLASS PAGE (Activities, Materials, People) ---------------- */
  openDedicatedClassPage(classId) {
    this.selectedClassId = classId;
    this.currentClassTab = 'activities';
    this.renderPage(this.currentPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  switchClassTab(tab) {
    this.currentClassTab = tab;
    this.renderPage(this.currentPage);
  }

  renderDedicatedClassPage() {
    const classes = TagaStore.get(STORAGE_KEYS.CLASSES, []);
    const cls = classes.find(c => c.id === this.selectedClassId);
    if (!cls) {
      this.selectedClassId = null;
      return this.renderRoleBasedHomePage();
    }

    const activities = TagaStore.get(STORAGE_KEYS.ACTIVITIES, []).filter(a => a.classId === cls.id);
    const materials = TagaStore.get(STORAGE_KEYS.MATERIALS, []).filter(m => m.classId === cls.id);
    const submissions = TagaStore.get(STORAGE_KEYS.SUBMISSIONS, []);
    const users = TagaStore.get(STORAGE_KEYS.USERS, []);

    const enrolledStudents = (cls.studentIds || []).map(sid => users.find(u => u.id === sid)).filter(Boolean);
    const instructor = users.find(u => u.id === cls.professorId) || {
      name: cls.professorName,
      email: 'instructor@tagadetect.edu',
      department: 'College of Computer Studies',
      avatar: cls.professorAvatar
    };

    const isStudent = this.currentUser && this.currentUser.role === 'student';
    const isProf = this.currentUser && (this.currentUser.role === 'professor' || this.currentUser.role === 'admin');
    const currentUserId = this.currentUser ? this.currentUser.id : 'usr_student_1';

    return `
      <div>
        <!-- Dedicated Class Header Card -->
        <div class="class-page-header">
          <div class="class-page-top-bar">
            <a class="class-back-btn" onclick="window.tagaApp.selectedClassId = null; window.tagaApp.renderPage(window.tagaApp.currentPage);">
              <span>â†</span> Back to All Classes
            </a>

            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="badge badge-ai" style="font-size: 13px; padding: 6px 14px; cursor: pointer;" onclick="window.tagaApp.copyCode('${cls.code}')" title="Click to copy Class Code">
                Class Code: <strong>${cls.code}</strong> ðŸ“‹
              </span>
              ${isProf ? `
                <button class="btn btn-primary" style="padding: 7px 16px; font-size: 13px;" onclick="window.tagaApp.openCreateActivityModal('${cls.id}')">
                  + Publish Activity
                </button>
                <button class="btn btn-secondary" style="padding: 7px 16px; font-size: 13px;" onclick="window.tagaApp.openCreateMaterialModal('${cls.id}')">
                  + Add Material
                </button>
              ` : `
                <span class="badge badge-human">Enrolled Student</span>
              `}
            </div>
          </div>

          <h1 class="class-page-title">${cls.subjectName}</h1>
          <div class="class-page-section-text">${cls.section}</div>

          <div class="class-page-meta-row">
            <span>ðŸ‘¨â€ðŸ« <strong>${cls.professorName}</strong></span>
            <span>ðŸ“ ${cls.room}</span>
            <span>â° ${cls.schedule}</span>
            <span>ðŸ‘¥ ${enrolledStudents.length} Students Enrolled</span>
          </div>
        </div>

        <!-- Class Page Navigation Sub-Tabs -->
        <div class="class-subtabs-nav">
          <button class="class-tab-btn ${this.currentClassTab === 'activities' ? 'active' : ''}" onclick="window.tagaApp.switchClassTab('activities')">
            <span>ðŸ“</span> Activities & Passing (${activities.length})
          </button>
          <button class="class-tab-btn ${this.currentClassTab === 'materials' ? 'active' : ''}" onclick="window.tagaApp.switchClassTab('materials')">
            <span>ðŸ“</span> Class Materials (${materials.length})
          </button>
          <button class="class-tab-btn ${this.currentClassTab === 'people' ? 'active' : ''}" onclick="window.tagaApp.switchClassTab('people')">
            <span>ðŸ‘¥</span> People in Class (${enrolledStudents.length + 1})
          </button>
        </div>

        <!-- Tab 1: Activities & Submissions -->
        ${this.currentClassTab === 'activities' ? `
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h3 style="font-size: 18px; font-weight: 700;">
                ${isStudent ? 'Assigned Activities & Passing of Work' : 'Activities & Student Submissions to Grade'}
              </h3>
              ${isProf ? `
                <button class="btn btn-primary" style="padding: 7px 16px; font-size: 13px;" onclick="window.tagaApp.openCreateActivityModal('${cls.id}')">
                  + Publish New Activity
                </button>
              ` : ''}
            </div>

            ${activities.length === 0 ? `
              <div class="card" style="text-align: center; padding: 40px;">
                <p style="color: var(--text-muted); font-style: italic;">No activities have been published for this class section yet.</p>
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 20px;">
                ${activities.map(act => {
                  const mySubmission = submissions.find(s => s.activityId === act.id && s.studentId === currentUserId);
                  const actSubmissions = submissions.filter(s => s.activityId === act.id);

                  return `
                    <div class="card">
                      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 20px;">
                        <div>
                          <h4 style="font-size: 18px; font-weight: 700; color: var(--text-main);">${act.title}</h4>
                          <p style="font-size: 14px; color: var(--text-muted); margin: 6px 0 12px; line-height: 1.6;">${act.description}</p>
                          <div style="display: flex; gap: 18px; font-size: 12px; color: var(--text-muted); flex-wrap: wrap;">
                            <span>ðŸ“… Due: <strong>${act.dueDate}</strong></span>
                            <span>ðŸ† Max Points: <strong>${act.maxPoints} pts</strong></span>
                            <span>ðŸ“‹ Rubric: ${act.rubric}</span>
                          </div>
                        </div>

                        <!-- Action Button based on Role -->
                        <div style="flex-shrink: 0;">
                          ${isStudent ? `
                            ${mySubmission ? `
                              <div style="text-align: right;">
                                <span class="badge badge-success" style="margin-bottom: 6px;">Passed</span>
                                <div>
                                  <button class="btn btn-secondary" style="padding: 6px 14px; font-size: 12px;" onclick="window.tagaApp.openSubmissionInspectionModal('${mySubmission.id}')">
                                    View Full Review
                                  </button>
                                </div>
                              </div>
                            ` : `
                              <button class="btn btn-primary" onclick="window.tagaApp.openPassActivityModal('${act.id}', '${encodeURIComponent(act.title)}')">
                                Submit Activity âœï¸
                              </button>
                            `}
                          ` : `
                            <span class="badge badge-ai" style="font-size: 13px; padding: 6px 12px;">${actSubmissions.length} Submissions</span>
                          `}
                        </div>
                      </div>

                      <!-- Student: Instant Automated Review Banner -->
                      ${isStudent && mySubmission ? `
                        <div class="review-panel" style="margin-top: 16px;">
                          <div style="display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                              <span style="font-size: 22px;">ðŸ¤–</span>
                              <div>
                                <strong style="font-size: 13px;">Automated Review Generated Upon Submission</strong>
                                <div style="font-size: 12px; color: var(--text-muted);">
                                  Evaluated upon passing: <strong>${mySubmission.aiReview.overallAiScore}% AI Probability</strong> (${mySubmission.aiReview.verdict})
                                </div>
                              </div>
                            </div>
                            <div>
                              ${mySubmission.grade !== undefined 
                                ? `<span class="badge badge-ai" style="font-size: 13px;">Grade: ${mySubmission.grade} / ${act.maxPoints} pts</span>` 
                                : `<span class="badge badge-pending">Pending Professor Grade</span>`
                              }
                            </div>
                          </div>
                          ${mySubmission.professorFeedback ? `
                            <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--border-color); font-size: 13px;">
                              <strong>Instructor Feedback:</strong> <span style="color: var(--text-muted);">${mySubmission.professorFeedback}</span>
                            </div>
                          ` : ''}
                        </div>
                      ` : ''}

                      <!-- Professor: Submissions & Grading Table -->
                      ${isProf ? `
                        <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                          <div style="font-size: 13px; font-weight: 700; color: var(--accent-purple); margin-bottom: 10px;">
                            STUDENT SUBMISSIONS & AUTOMATED REVIEWS (${actSubmissions.length})
                          </div>
                          ${actSubmissions.length === 0 ? `
                            <p style="font-size: 13px; color: var(--text-muted); font-style: italic;">No student has passed work for this activity yet.</p>
                          ` : `
                            <table class="data-table">
                              <thead>
                                <tr>
                                  <th>Student</th>
                                  <th>Submitted At</th>
                                  <th>Word Count</th>
                                  <th>Automated AI Review</th>
                                  <th>Grade</th>
                                  <th>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${actSubmissions.map(sub => {
                                  const aiScore = sub.aiReview ? sub.aiReview.overallAiScore : 0;
                                  return `
                                    <tr>
                                      <td>
                                        <strong>${sub.studentName}</strong>
                                        <div style="font-size: 11px; color: var(--text-muted);">${sub.studentEmail}</div>
                                      </td>
                                      <td style="font-size: 12px;">${new Date(sub.submittedAt).toLocaleDateString()}</td>
                                      <td>${sub.wordCount} words</td>
                                      <td>
                                        <span class="badge ${aiScore >= 70 ? 'badge-ai' : (aiScore >= 40 ? 'badge-mixed' : 'badge-human')}">
                                          ${aiScore}% AI (${sub.aiReview ? sub.aiReview.verdict : ''})
                                        </span>
                                      </td>
                                      <td>
                                        ${sub.grade !== undefined 
                                          ? `<span class="badge badge-success">${sub.grade} / ${act.maxPoints} pts</span>` 
                                          : `<span class="badge badge-pending">Ungraded</span>`
                                        }
                                      </td>
                                      <td>
                                        <button class="btn btn-secondary" style="padding: 4px 12px; font-size: 12px;" onclick="window.tagaApp.openGradeSubmissionModal('${sub.id}', '${encodeURIComponent(act.title)}', ${act.maxPoints})">
                                          Grade ðŸ“
                                        </button>
                                      </td>
                                    </tr>
                                  `;
                                }).join('')}
                              </tbody>
                            </table>
                          `}
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>
        ` : ''}

        <!-- Tab 2: Class Materials -->
        ${this.currentClassTab === 'materials' ? `
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <div>
                <h3 style="font-size: 18px; font-weight: 700;">Class Materials & Documents</h3>
                <p style="font-size: 13px; color: var(--text-muted);">Course syllabi, lecture slides, reference cheat sheets, and laboratory guides</p>
              </div>
              ${isProf ? `
                <button class="btn btn-primary" style="padding: 7px 16px; font-size: 13px;" onclick="window.tagaApp.openCreateMaterialModal('${cls.id}')">
                  + Upload Course Material
                </button>
              ` : ''}
            </div>

            ${materials.length === 0 ? `
              <div class="card" style="text-align: center; padding: 40px;">
                <p style="color: var(--text-muted); font-style: italic;">No materials posted yet for this class section.</p>
              </div>
            ` : `
              <div class="materials-grid">
                ${materials.map(mat => `
                  <div class="material-card">
                    <div>
                      <span class="material-type-tag">${mat.category}</span>
                      <h4 class="material-title">${mat.title}</h4>
                      <p class="material-desc">${mat.description}</p>
                    </div>
                    <div class="material-footer">
                      <div>
                        <span>ðŸ“„ ${mat.type}</span> â€¢ <span>${mat.fileSize}</span>
                      </div>
                      <button class="btn btn-secondary" style="padding: 5px 12px; font-size: 12px;" onclick="window.tagaApp.showToast('Downloaded ${mat.title}')">
                        Download / View ðŸ“¥
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        ` : ''}

        <!-- Tab 3: People in Class -->
        ${this.currentClassTab === 'people' ? `
          <div class="people-section">
            <!-- Teachers Group -->
            <div>
              <div class="people-group-title">
                <span>Teacher & Instructors (1)</span>
              </div>
              <div class="people-cards-grid">
                <div class="person-card">
                  <img src="${instructor.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}" class="person-avatar" />
                  <div class="person-info">
                    <div class="person-name">${instructor.name}</div>
                    <div class="person-sub">${instructor.department}</div>
                    <div class="person-email">${instructor.email}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Classmates / Students Group -->
            <div>
              <div class="people-group-title">
                <span>Enrolled Classmates (${enrolledStudents.length} Students)</span>
                <span style="font-size: 12px; color: var(--text-muted);">Class Section: ${cls.section}</span>
              </div>

              ${enrolledStudents.length === 0 ? `
                <div class="card" style="text-align: center; padding: 32px;">
                  <p style="color: var(--text-muted); font-style: italic;">No students have enrolled in this section yet. Share Class Code <strong>${cls.code}</strong> with your students.</p>
                </div>
              ` : `
                <div class="people-cards-grid">
                  ${enrolledStudents.map(st => `
                    <div class="person-card">
                      <img src="${st.avatar}" class="person-avatar" />
                      <div class="person-info">
                        <div class="person-name">${st.name}</div>
                        <div class="person-sub">${st.department}</div>
                        <div class="person-email">${st.email}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  /* ---------------- UI: Clean AI Detector ---------------- */
  renderCleanDetectorPage() {
    return `
      <div>
        <div style="margin-bottom: 28px;">
          <h2 style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">AI Detector</h2>
          <p style="color: var(--text-muted); font-size: 14px;">Evaluate writing authenticity with token predictability, burstiness variance, and sentence-level highlights.</p>
        </div>

        <div class="detector-clean-layout">
          <div class="clean-editor-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <span style="font-size: 13px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Input Text Passage</span>
              <div style="display: flex; gap: 8px;">
                <span class="sample-chip" id="sample-ai-btn">AI Sample</span>
                <span class="sample-chip" id="sample-human-btn">Human Sample</span>
                <span class="sample-chip" id="sample-mixed-btn">Mixed Sample</span>
              </div>
            </div>

            <textarea 
              id="detector-input-text" 
              class="clean-textarea" 
              placeholder="Paste or type academic text here (minimum 15 characters)..."
            ></textarea>

            <div class="clean-meta-bar">
              <div>
                <span id="char-count">0</span> chars | 
                <span id="word-count">0</span> words | 
                <span id="sentence-count">0</span> sentences
              </div>
              <button class="btn btn-secondary" id="clear-detector-btn" style="padding: 4px 12px; font-size: 12px;">Clear</button>
            </div>

            <div style="display: flex; gap: 12px;">
              <button class="btn btn-primary" id="run-detection-btn" style="flex: 2;">
                <span>âš¡</span> Run AI Detection (Shuffle Prediction)
              </button>
              <button class="btn btn-secondary" id="shuffle-rerun-btn" style="flex: 1;" title="Reshuffle model output">
                <span>ðŸ”€</span> Reshuffle
              </button>
            </div>

            <div style="margin-top: 24px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <h4 style="font-size: 14px; font-weight: 700;">Sentence Classification</h4>
                <div style="display: flex; gap: 8px; font-size: 11px;">
                  <span class="badge badge-ai">High AI</span>
                  <span class="badge badge-mixed">Mixed</span>
                  <span class="badge badge-human">Human</span>
                </div>
              </div>
              <div id="sentence-breakdown-container" class="sentence-breakdown-box">
                <p style="color: var(--text-muted); font-style: italic;">Run an analysis to inspect sentence highlights.</p>
              </div>
            </div>
          </div>

          <div class="clean-editor-card" style="display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <span style="font-size: 13px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Probability Gauge</span>
              <button class="btn btn-secondary" id="open-feedback-btn" style="padding: 5px 12px; font-size: 12px;">
                <span>ðŸ’¬</span> Feedback
              </button>
            </div>

            <div class="gauge-wrapper">
              <svg class="gauge-svg" width="190" height="190" viewBox="0 0 200 200">
                <circle class="gauge-track" cx="100" cy="100" r="75"></circle>
                <circle id="gauge-progress" class="gauge-fill" cx="100" cy="100" r="75" stroke-dasharray="471" stroke-dashoffset="471"></circle>
              </svg>
              <div class="gauge-content">
                <div class="gauge-score" id="gauge-score-text">0%</div>
                <div class="gauge-label">AI PROBABILITY</div>
              </div>
            </div>

            <div id="detector-verdict-box" style="text-align: center; margin-bottom: 20px;">
              <span class="badge badge-human" id="verdict-badge" style="font-size: 13px; padding: 6px 16px;">Awaiting Input</span>
            </div>

            <div class="metric-row">
              <div class="metric-header">
                <span>Token Perplexity (Predictability)</span>
                <strong id="perplexity-val">--</strong>
              </div>
              <div class="metric-bar-bg">
                <div id="perplexity-bar" class="metric-bar-val" style="width: 0%;"></div>
              </div>
            </div>

            <div class="metric-row">
              <div class="metric-header">
                <span>Sentence Burstiness (Syntactic Variance)</span>
                <strong id="burstiness-val">--</strong>
              </div>
              <div class="metric-bar-bg">
                <div id="burstiness-bar" class="metric-bar-val" style="width: 0%; background: linear-gradient(90deg, #10b981, #0fbcf9);"></div>
              </div>
            </div>

            <div class="card-inner-box" style="margin-top: auto; padding: 14px;">
              <div style="font-size: 12px; font-weight: 700; color: var(--accent-purple); margin-bottom: 4px;">USER FEEDBACK MECHANISM</div>
              <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 10px;">
                Help us calibrate the upcoming custom Machine Learning detection engine:
              </p>
              <div style="display: flex; gap: 8px;">
                <button class="btn btn-secondary" id="quick-feedback-accurate" style="flex: 1; padding: 6px; font-size: 11px;">ðŸ‘ Accurate</button>
                <button class="btn btn-secondary" id="quick-feedback-fp" style="flex: 1; padding: 6px; font-size: 11px;">âš ï¸ False +</button>
                <button class="btn btn-secondary" id="quick-feedback-fn" style="flex: 1; padding: 6px; font-size: 11px;">âŒ False -</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindDetectorEvents() {
    const input = document.getElementById('detector-input-text');
    const runBtn = document.getElementById('run-detection-btn');
    const shuffleBtn = document.getElementById('shuffle-rerun-btn');
    const clearBtn = document.getElementById('clear-detector-btn');

    document.getElementById('sample-ai-btn').addEventListener('click', () => {
      input.value = AI_DETECTOR_ENGINE.SAMPLE_TEXTS.ai;
      this.updateInputCounters(input.value);
      this.executeDetection(input.value);
    });

    document.getElementById('sample-human-btn').addEventListener('click', () => {
      input.value = AI_DETECTOR_ENGINE.SAMPLE_TEXTS.human;
      this.updateInputCounters(input.value);
      this.executeDetection(input.value);
    });

    document.getElementById('sample-mixed-btn').addEventListener('click', () => {
      input.value = AI_DETECTOR_ENGINE.SAMPLE_TEXTS.mixed;
      this.updateInputCounters(input.value);
      this.executeDetection(input.value);
    });

    input.addEventListener('input', () => {
      this.updateInputCounters(input.value);
    });

    runBtn.addEventListener('click', () => {
      this.executeDetection(input.value);
    });

    shuffleBtn.addEventListener('click', () => {
      if (!input.value.trim()) {
        input.value = AI_DETECTOR_ENGINE.SAMPLE_TEXTS.mixed;
        this.updateInputCounters(input.value);
      }
      this.executeDetection(input.value);
      this.showToast('Re-shuffled prediction parameters');
    });

    clearBtn.addEventListener('click', () => {
      input.value = '';
      this.updateInputCounters('');
      this.resetDetectorUI();
    });

    document.getElementById('open-feedback-btn').addEventListener('click', () => {
      this.openFeedbackModal();
    });

    document.getElementById('quick-feedback-accurate').addEventListener('click', () => {
      this.recordQuickFeedback('Accurate Prediction', 'highly_accurate');
    });
    document.getElementById('quick-feedback-fp').addEventListener('click', () => {
      this.recordQuickFeedback('False Positive (Human flagged as AI)', 'inaccurate');
    });
    document.getElementById('quick-feedback-fn').addEventListener('click', () => {
      this.recordQuickFeedback('False Negative (AI missed)', 'inaccurate');
    });

    input.value = AI_DETECTOR_ENGINE.SAMPLE_TEXTS.ai;
    this.updateInputCounters(input.value);
    this.executeDetection(input.value);
  }

  updateInputCounters(text) {
    const chars = text.length;
    const words = (text.match(/\b\w+\b/g) || []).length;
    const sentences = AI_DETECTOR_ENGINE.splitSentences(text).length;

    const charEl = document.getElementById('char-count');
    const wordEl = document.getElementById('word-count');
    const sentEl = document.getElementById('sentence-count');

    if (charEl) charEl.textContent = chars;
    if (wordEl) wordEl.textContent = words;
    if (sentEl) sentEl.textContent = sentences;
  }

  async executeDetection(text) {
    if (!text || text.trim().length < 15) {
      this.showToast('Please enter at least 15 characters to analyze', 'error');
      return;
    }

    const analyzeBtn = document.querySelector('[data-action="analyze-detector"]') || document.getElementById('btn-analyze');
    if (analyzeBtn) {
      analyzeBtn.disabled = true;
      analyzeBtn.textContent = 'Analyzing... ⏳';
    }

    try {
      const result = await AI_DETECTOR_ENGINE.predict(text);
      this.lastDetectionResult = result;

      const score = result.overallAiScore;
      const scoreText = document.getElementById('gauge-score-text');
      const gaugeFill = document.getElementById('gauge-progress');
      const verdictBadge = document.getElementById('verdict-badge');
      const perplexityVal = document.getElementById('perplexity-val');
      const perplexityBar = document.getElementById('perplexity-bar');
      const burstinessVal = document.getElementById('burstiness-val');
      const burstinessBar = document.getElementById('burstiness-bar');
      const sentenceContainer = document.getElementById('sentence-breakdown-container');

      if (scoreText) scoreText.textContent = `${score}%`;

      if (gaugeFill) {
        const maxOffset = 471;
        const offset = maxOffset - (maxOffset * (score / 100));
        gaugeFill.style.strokeDashoffset = offset;
        if (score >= 70) {
          gaugeFill.style.stroke = 'var(--accent-purple)';
        } else if (score >= 40) {
          gaugeFill.style.stroke = 'var(--accent-amber)';
        } else {
          gaugeFill.style.stroke = 'var(--accent-emerald)';
        }
      }

      if (verdictBadge) {
        verdictBadge.textContent = result.verdict;
        verdictBadge.className = 'badge ' + (score >= 70 ? 'badge-ai' : (score >= 40 ? 'badge-mixed' : 'badge-human'));
      }

      if (perplexityVal) perplexityVal.textContent = `${result.perplexityScore} / 100`;
      if (perplexityBar) perplexityBar.style.width = `${result.perplexityScore}%`;

      if (burstinessVal) burstinessVal.textContent = `${result.burstinessScore} / 100`;
      if (burstinessBar) burstinessBar.style.width = `${result.burstinessScore}%`;

      if (sentenceContainer) {
        sentenceContainer.innerHTML = result.sentenceBreakdown.map(s => {
          return `<span class="hl-sentence ${s.label}" title="${s.score}% AI">${s.text} </span>`;
        }).join('');
      }

      let modelBadge = document.getElementById('app-detector-engine-badge');
      if (!modelBadge && sentenceContainer) {
        modelBadge = document.createElement('div');
        modelBadge.id = 'app-detector-engine-badge';
        modelBadge.style.cssText = 'margin-top: 12px; font-size: 11px; color: var(--text-muted); padding: 8px 12px; background: var(--card-inner); border-radius: var(--radius-sm); border: 1px solid var(--border-color);';
        sentenceContainer.parentNode.appendChild(modelBadge);
      }
      if (modelBadge) {
        let txt = `Engine: <strong>${result.isRealModel ? 'TagaDetect ML Pipeline (Live)' : 'Heuristic Fallback'}</strong>`;
        if (result.likelySource) txt += ` • Predicted Source: <strong>${result.likelySource}</strong>`;
        modelBadge.innerHTML = txt;
      }
    } catch (err) {
      console.error(err);
      this.showToast('Error during detection: ' + err.message, 'error');
    } finally {
      if (analyzeBtn) {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analyze Passage ⚡';
      }
    }
  }

  resetDetectorUI() {
    const scoreText = document.getElementById('gauge-score-text');
    const gaugeFill = document.getElementById('gauge-progress');
    const verdictBadge = document.getElementById('verdict-badge');
    const sentenceContainer = document.getElementById('sentence-breakdown-container');

    if (scoreText) scoreText.textContent = '0%';
    if (gaugeFill) gaugeFill.style.strokeDashoffset = '471';
    if (verdictBadge) {
      verdictBadge.textContent = 'Awaiting Input';
      verdictBadge.className = 'badge badge-human';
    }
    if (sentenceContainer) {
      sentenceContainer.innerHTML = `<p style="color: var(--text-muted); font-style: italic;">Run an analysis to inspect sentence highlights.</p>`;
    }
  }

  /* ---------------- Feedback Handlers ---------------- */
  openFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    if (!modal) return;
    const scoreDisplay = document.getElementById('feedback-detected-score');
    if (scoreDisplay && this.lastDetectionResult) {
      scoreDisplay.textContent = `${this.lastDetectionResult.overallAiScore}% (${this.lastDetectionResult.verdict})`;
    }
    modal.classList.add('show');
  }

  recordQuickFeedback(feedbackType, accuracyRating) {
    if (!this.lastDetectionResult) {
      this.showToast('Run an analysis first', 'error');
      return;
    }

    const feedbacks = TagaStore.get(STORAGE_KEYS.FEEDBACK, []);
    const newFeedback = {
      id: `fb_${Date.now()}`,
      userId: this.currentUser ? this.currentUser.id : 'usr_guest',
      userName: this.currentUser ? this.currentUser.name : 'Guest User',
      userRole: this.currentUser ? this.currentUser.role : 'student',
      timestamp: new Date().toISOString(),
      detectedScore: this.lastDetectionResult.overallAiScore,
      accuracyRating: accuracyRating,
      feedbackType: feedbackType,
      comment: `Quick feedback logged from AI Detector panel.`,
      status: 'Reviewed'
    };

    feedbacks.unshift(newFeedback);
    TagaStore.set(STORAGE_KEYS.FEEDBACK, feedbacks);
    this.showToast(`Feedback logged: "${feedbackType}". Thank you!`);
  }

  submitDetailedFeedback(rating, type, comment) {
    if (!this.lastDetectionResult) {
      this.showToast('Run an analysis first', 'error');
      return;
    }

    const feedbacks = TagaStore.get(STORAGE_KEYS.FEEDBACK, []);
    const newFeedback = {
      id: `fb_${Date.now()}`,
      userId: this.currentUser ? this.currentUser.id : 'usr_guest',
      userName: this.currentUser ? this.currentUser.name : 'Guest User',
      userRole: this.currentUser ? this.currentUser.role : 'student',
      timestamp: new Date().toISOString(),
      detectedScore: this.lastDetectionResult.overallAiScore,
      accuracyRating: rating,
      feedbackType: type,
      comment: comment || 'No comment provided.',
      status: 'Submitted'
    };

    feedbacks.unshift(newFeedback);
    TagaStore.set(STORAGE_KEYS.FEEDBACK, feedbacks);
    this.closeAllModals();
    this.showToast('Feedback recorded for model refinement!');
  }

  /* ---------------- UI: Teaching Portal (Professors) ---------------- */
  renderCleanTeachingPage() {
    return this.renderRoleBasedHomePage();
  }

  /* ---------------- UI: Clean Admin Approvals ---------------- */
  renderCleanAdminPage() {
    const users = TagaStore.get(STORAGE_KEYS.USERS, []);
    const feedbacks = TagaStore.get(STORAGE_KEYS.FEEDBACK, []);
    const pendingProfessors = users.filter(u => u.role === 'professor' && u.status === 'pending');

    return `
      <div>
        <div style="margin-bottom: 28px;">
          <h2 style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Admin Approvals & Governance</h2>
          <p style="color: var(--text-muted); font-size: 14px;">Approve professor accounts so they can create classes and grade activities.</p>
        </div>

        <div class="card" style="margin-bottom: 32px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 class="card-title">Pending Professor Accounts (${pendingProfessors.length})</h3>
            <span class="badge ${pendingProfessors.length > 0 ? 'badge-pending' : 'badge-success'}">
              ${pendingProfessors.length} Pending
            </span>
          </div>

          ${pendingProfessors.length === 0 ? `
            <p style="color: var(--text-muted); font-style: italic;">All faculty accounts are approved.</p>
          ` : `
            <table class="data-table">
              <thead>
                <tr>
                  <th>Professor</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${pendingProfessors.map(prof => `
                  <tr>
                    <td>
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${prof.avatar}" style="width: 34px; height: 34px; border-radius: 50%;" />
                        <div>
                          <strong>${prof.name}</strong>
                          <div style="font-size: 11px; color: var(--text-muted);">@${prof.username}</div>
                        </div>
                      </div>
                    </td>
                    <td>${prof.email}</td>
                    <td>${prof.department}</td>
                    <td><span class="badge badge-pending">Pending Approval</span></td>
                    <td>
                      <button class="btn btn-primary" style="padding: 6px 14px; font-size: 12px;" onclick="window.tagaApp.approveProfessor('${prof.id}')">
                        âœ“ Approve Account
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>

        <div class="card">
          <h3 class="card-title" style="margin-bottom: 16px;">AI Detector Feedback Stream (${feedbacks.length})</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Feedback Type</th>
                <th>AI %</th>
                <th>Comments</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${feedbacks.map(fb => `
                <tr>
                  <td><strong>${fb.userName}</strong></td>
                  <td><span class="badge badge-human">${fb.userRole}</span></td>
                  <td><strong>${fb.feedbackType}</strong></td>
                  <td><span class="badge badge-ai">${fb.detectedScore}%</span></td>
                  <td style="font-size: 13px; color: var(--text-muted);">${fb.comment}</td>
                  <td style="font-size: 12px;">${new Date(fb.timestamp).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  approveProfessor(userId) {
    const users = TagaStore.get(STORAGE_KEYS.USERS, []);
    const prof = users.find(u => u.id === userId);
    if (prof) {
      prof.status = 'approved';
      TagaStore.set(STORAGE_KEYS.USERS, users);
      this.updateAdminBadge();
      this.showToast(`Professor ${prof.name} approved! Class creation and grading unlocked.`);
      this.renderPage('admin');
    }
  }

  /* ---------------- UI: Clean About & FAQs ---------------- */
  renderCleanAboutPage() {
    return `
      <div>
        <div style="text-align: center; max-width: 680px; margin: 0 auto 36px;">
          <h2 style="font-size: 32px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 8px;">About TagaDetect</h2>
          <p style="color: var(--text-muted); font-size: 15px; line-height: 1.6;">
            A clean academic integrity platform combining multi-metric AI detection with automated submission review pipelines.
          </p>
        </div>

        <h3 style="font-size: 20px; font-weight: 800; margin-bottom: 20px;">The 4 Founders</h3>
        <div class="grid-4" style="margin-bottom: 44px;">
          ${INITIAL_FOUNDERS.map(f => `
            <div class="card" style="text-align: center; padding: 24px;">
              <img src="${f.avatar}" style="width: 76px; height: 76px; border-radius: 50%; object-fit: cover; border: 3px solid var(--accent-purple); margin-bottom: 14px;" />
              <h4 style="font-size: 16px; font-weight: 700;">${f.name}</h4>
              <div style="font-size: 12px; color: var(--accent-purple); font-weight: 600; margin-bottom: 8px;">${f.role}</div>
              <p style="font-size: 12px; color: var(--text-muted); line-height: 1.5;">${f.bio}</p>
            </div>
          `).join('')}
        </div>

        <h3 style="font-size: 20px; font-weight: 800; margin-bottom: 20px;">Technical How-To's</h3>
        <div class="grid-3" style="margin-bottom: 44px;">
          ${TECHNICAL_HOW_TOS.map(guide => `
            <div class="card">
              <span class="badge badge-ai" style="margin-bottom: 12px;">${guide.category}</span>
              <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 14px;">${guide.title}</h4>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                ${guide.steps.map(s => `
                  <div style="font-size: 13px;">
                    <strong>${s.step}. ${s.title}</strong>
                    <div style="color: var(--text-muted); margin-top: 2px;">${s.detail}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="card">
          <h3 class="card-title" style="margin-bottom: 18px;">Frequently Asked Questions</h3>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${FAQS.map(faq => `
              <div class="card-inner-box">
                <strong style="font-size: 15px; color: var(--text-main);">${faq.question}</strong>
                <p style="font-size: 13px; color: var(--text-muted); margin-top: 6px;">${faq.answer}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /* ---------------- UI: Clean Settings ---------------- */
  renderCleanSettingsPage() {
    const user = this.currentUser || INITIAL_USERS[0];

    return `
      <div style="max-width: 760px; margin: 0 auto;">
        <h2 style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 24px;">Platform Settings</h2>

        <div class="card" style="margin-bottom: 24px;">
          <h3 class="card-title" style="margin-bottom: 18px;">Profile Information</h3>
          <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 24px;">
            <img src="${user.avatar}" style="width: 68px; height: 68px; border-radius: 50%; border: 3px solid var(--accent-purple);" />
            <div>
              <strong style="font-size: 17px;">${user.name}</strong>
              <div style="font-size: 13px; color: var(--text-muted);">Role: ${user.role.toUpperCase()} (${user.status})</div>
            </div>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" id="settings-name" class="form-input" value="${user.name}" />
            </div>
            <div class="form-group">
              <label class="form-label">Username</label>
              <input type="text" id="settings-username" class="form-input" value="${user.username}" />
            </div>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" id="settings-email" class="form-input" value="${user.email}" />
            </div>
            <div class="form-group">
              <label class="form-label">Department / Section</label>
              <input type="text" id="settings-dept" class="form-input" value="${user.department || ''}" />
            </div>
          </div>

          <button class="btn btn-primary" onclick="window.tagaApp.saveProfile()">Save Changes</button>
        </div>

        <div class="card">
          <h3 class="card-title" style="margin-bottom: 12px;">Theme & Palette Mode</h3>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 18px;">Switch appearance using your custom palette variables:</p>
          <div style="display: flex; gap: 14px;">
            <button class="btn ${this.currentTheme === 'dark' ? 'btn-primary' : 'btn-secondary'}" onclick="window.tagaApp.applyTheme('dark'); window.tagaApp.renderPage('settings');">
              ðŸŒ™ Dark Mode (Default)
            </button>
            <button class="btn ${this.currentTheme === 'light' ? 'btn-primary' : 'btn-secondary'}" onclick="window.tagaApp.applyTheme('light'); window.tagaApp.renderPage('settings');">
              â˜€ï¸ Light Mode
            </button>
          </div>
        </div>
      </div>
    `;
  }

  saveProfile() {
    const name = document.getElementById('settings-name').value;
    const username = document.getElementById('settings-username').value;
    const email = document.getElementById('settings-email').value;
    const dept = document.getElementById('settings-dept').value;

    if (this.currentUser) {
      this.currentUser.name = name;
      this.currentUser.username = username;
      this.currentUser.email = email;
      this.currentUser.department = dept;

      const users = TagaStore.get(STORAGE_KEYS.USERS, []);
      const idx = users.findIndex(u => u.id === this.currentUser.id);
      if (idx !== -1) {
        users[idx] = this.currentUser;
        TagaStore.set(STORAGE_KEYS.USERS, users);
      }
      TagaStore.set(STORAGE_KEYS.CURRENT_USER, this.currentUser);
      this.renderHeaderUser();
      this.showToast('Profile updated!');
    }
  }

  /* ---------------- UI: Clean Login & Signup ---------------- */
  renderCleanLoginPage() {
    return `
      <div class="card" style="max-width: 440px; margin: 40px auto; padding: 36px;">
        <div style="text-align: center; margin-bottom: 26px;">
          <div class="nav-brand-logo" style="margin: 0 auto 12px; width: 44px; height: 44px; font-size: 22px;">T</div>
          <h2 style="font-size: 22px; font-weight: 800;">Sign in to TagaDetect</h2>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Enter your credentials or use Google OAuth</p>
        </div>

        <button class="btn-google" id="login-google-btn">
          <svg class="google-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Continue with Google
        </button>

        <div style="display: flex; align-items: center; margin: 20px 0; color: var(--text-muted); font-size: 11px;">
          <div style="flex: 1; border-bottom: 1px solid var(--border-color);"></div>
          <span style="padding: 0 10px;">OR WITH EMAIL</span>
          <div style="flex: 1; border-bottom: 1px solid var(--border-color);"></div>
        </div>

        <form id="email-login-form">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" id="login-email" class="form-input" placeholder="alex.rivera@student.tagadetect.edu" required />
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" id="login-password" class="form-input" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" required />
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; margin-top: 6px;">Sign In</button>
        </form>

        <div style="text-align: center; margin-top: 18px; font-size: 12px; color: var(--text-muted);">
          <a onclick="window.tagaApp.openTermsModal()" style="cursor: pointer; text-decoration: underline;">Terms</a> & 
          <a onclick="window.tagaApp.openPrivacyModal()" style="cursor: pointer; text-decoration: underline;">Privacy</a>
          â€¢ Don't have an account? <a onclick="window.tagaApp.navigate('signup')" style="color: var(--accent-purple); cursor: pointer; font-weight: 600;">Sign up</a>
        </div>
      </div>
    `;
  }

  renderCleanSignupPage() {
    return `
      <div class="card" style="max-width: 480px; margin: 30px auto; padding: 36px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div class="nav-brand-logo" style="margin: 0 auto 12px; width: 44px; height: 44px; font-size: 22px;">T</div>
          <h2 style="font-size: 22px; font-weight: 800;">Create Account</h2>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">Join as a Student or Professor</p>
        </div>

        <form id="signup-form">
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Name</label>
              <input type="text" id="signup-name" class="form-input" placeholder="Jane Doe" required />
            </div>
            <div class="form-group">
              <label class="form-label">Username</label>
              <input type="text" id="signup-username" class="form-input" placeholder="janedoe" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" id="signup-email" class="form-input" placeholder="jane@school.edu" required />
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" id="signup-password" class="form-input" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" required />
          </div>

          <div class="form-group">
            <label class="form-label">Account Role</label>
            <div class="grid-2">
              <label class="card-inner-box" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="radio" name="signup-role" value="student" checked style="accent-color: var(--accent-purple);" />
                <div>
                  <strong>Student</strong>
                  <div style="font-size: 11px; color: var(--text-muted);">Joins classes & passes work</div>
                </div>
              </label>
              <label class="card-inner-box" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="radio" name="signup-role" value="professor" style="accent-color: var(--accent-purple);" />
                <div>
                  <strong>Professor</strong>
                  <div style="font-size: 11px; color: var(--text-muted);">Creates classes & grades</div>
                </div>
              </label>
            </div>
            <div id="prof-signup-notice" style="display: none; font-size: 11px; color: var(--accent-rose); margin-top: 8px;">
              â„¹ï¸ Professor accounts require administrator approval before class creation and grading are unlocked.
            </div>
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px;">Create Account</button>
        </form>

        <div style="text-align: center; margin-top: 16px; font-size: 12px; color: var(--text-muted);">
          Already registered? <a onclick="window.tagaApp.navigate('login')" style="color: var(--accent-purple); cursor: pointer; font-weight: 600;">Sign in</a>
        </div>
      </div>
    `;
  }

  bindAuthEvents(type) {
    if (type === 'login') {
      const googleBtn = document.getElementById('login-google-btn');
      if (googleBtn) googleBtn.addEventListener('click', () => this.openGoogleAuthModal());

      const form = document.getElementById('email-login-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const email = document.getElementById('login-email').value;
          const users = TagaStore.get(STORAGE_KEYS.USERS, []);
          const match = users.find(u => u.email.toLowerCase() === email.toLowerCase());

          if (match) {
            this.switchUser(match);
            this.navigate('home');
          } else {
            this.showToast(`Logged in as demo user with ${email}`);
            this.navigate('home');
          }
        });
      }
    } else {
      const roleRadios = document.querySelectorAll('input[name="signup-role"]');
      const notice = document.getElementById('prof-signup-notice');
      roleRadios.forEach(r => {
        r.addEventListener('change', (e) => {
          if (notice) notice.style.display = e.target.value === 'professor' ? 'block' : 'none';
        });
      });

      const form = document.getElementById('signup-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const name = document.getElementById('signup-name').value;
          const username = document.getElementById('signup-username').value;
          const email = document.getElementById('signup-email').value;
          const password = document.getElementById('signup-password').value;
          const role = document.querySelector('input[name="signup-role"]:checked').value;

          const isProf = role === 'professor';
          const newUser = {
            id: `usr_${Date.now()}`,
            name, username, email, password, role,
            status: isProf ? 'pending' : 'active',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            university: 'Polytechnic State University',
            department: isProf ? 'College of Computer Studies' : 'BSCS 3IS1',
            bio: 'Registered on TagaDetect platform.',
            joinedDate: new Date().toISOString().split('T')[0]
          };

          const users = TagaStore.get(STORAGE_KEYS.USERS, []);
          users.push(newUser);
          TagaStore.set(STORAGE_KEYS.USERS, users);

          this.switchUser(newUser);
          if (isProf) {
            this.showToast('Account created! Professor account is pending Administrator approval.', 'warning');
            this.navigate('home');
          } else {
            this.showToast(`Welcome to TagaDetect, ${newUser.name}!`);
            this.navigate('home');
          }
        });
      }
    }
  }

  /* ---------------- Modal Actions with Strict Role Enforcement ---------------- */

  // ONLY students can join classes
  openEnrollModal() {
    if (this.currentUser && this.currentUser.role !== 'student') {
      this.showToast('Only students can join classes. Professors are the ones who create them.', 'warning');
      return;
    }
    this.closeAllModals();
    const modal = document.getElementById('enroll-modal');
    if (modal) modal.classList.add('show');
  }

  submitEnrollClass(code) {
    if (this.currentUser && this.currentUser.role !== 'student') {
      this.showToast('Only students can join classes. Professors create classes and grade activities.', 'error');
      this.closeAllModals();
      return;
    }

    if (!code || !code.trim()) {
      this.showToast('Please enter a valid Class Code', 'error');
      return;
    }

    const classes = TagaStore.get(STORAGE_KEYS.CLASSES, []);
    const targetClass = classes.find(c => c.code.toLowerCase() === code.trim().toLowerCase());

    if (!targetClass) {
      this.showToast(`Class with code "${code}" not found. Try AUT-305, NET-310, or IS-306.`, 'error');
      return;
    }

    const studentId = this.currentUser ? this.currentUser.id : 'usr_student_1';
    if (!targetClass.studentIds) targetClass.studentIds = [];

    if (targetClass.studentIds.includes(studentId)) {
      this.showToast(`You are already enrolled in ${targetClass.subjectName}`, 'error');
      this.closeAllModals();
      return;
    }

    targetClass.studentIds.push(studentId);
    TagaStore.set(STORAGE_KEYS.CLASSES, classes);

    this.closeAllModals();
    this.showToast(`Enrolled in ${targetClass.subjectName} (${targetClass.section})!`);
    this.openDedicatedClassPage(targetClass.id);
  }

  // ONLY professors (and admin) can create classes
  openCreateClassModal() {
    if (this.currentUser && this.currentUser.role === 'student') {
      this.showToast('Only professors can create classes. Students join them with a code.', 'warning');
      return;
    }
    if (this.currentUser && this.currentUser.role === 'professor' && this.currentUser.status === 'pending') {
      this.showToast('Your professor account is pending Administrator approval.', 'error');
      return;
    }
    this.closeAllModals();
    const modal = document.getElementById('create-class-modal');
    if (modal) modal.classList.add('show');
  }

  executeCreateClass(subjectName, section, room, schedule, description) {
    if (!this.currentUser || (this.currentUser.role !== 'professor' && this.currentUser.role !== 'admin')) {
      this.showToast('Only professors can create classes.', 'error');
      return;
    }

    if (this.currentUser.role === 'professor' && this.currentUser.status === 'pending') {
      this.showToast('Your professor account must be approved by an Admin before creating classes.', 'error');
      return;
    }

    if (!subjectName || !section) {
      this.showToast('Subject Name and Section are required', 'error');
      return;
    }

    const prefix = subjectName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'CLS');
    const randomNum = Math.floor(100 + Math.random() * 900);
    const code = `${prefix}-${randomNum}`;

    const classes = TagaStore.get(STORAGE_KEYS.CLASSES, []);
    const newClass = {
      id: `cls_${Date.now()}`,
      subjectName: subjectName.trim(),
      section: section.trim(),
      code: code,
      professorId: this.currentUser.id,
      professorName: this.currentUser.name,
      professorAvatar: this.currentUser.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      room: room || 'Room 101',
      schedule: schedule || 'Mon / Wed 10:00 AM',
      description: description || 'Academic course section.',
      studentIds: []
    };

    classes.push(newClass);
    TagaStore.set(STORAGE_KEYS.CLASSES, classes);

    this.closeAllModals();
    this.showToast(`Class created! Opening your new class page...`);
    this.openDedicatedClassPage(newClass.id);
  }

  // ONLY professors can publish activities
  openCreateActivityModal(classId) {
    if (this.currentUser && this.currentUser.role === 'student') {
      this.showToast('Only professors can publish activities.', 'error');
      return;
    }
    const modal = document.getElementById('create-activity-modal');
    if (!modal) return;
    document.getElementById('activity-class-id').value = classId;
    modal.classList.add('show');
  }

  executeCreateActivity(classId, title, description, dueDate, maxPoints, rubric) {
    if (!title || !description) {
      this.showToast('Please provide a title and description', 'error');
      return;
    }

    const activities = TagaStore.get(STORAGE_KEYS.ACTIVITIES, []);
    const newActivity = {
      id: `act_${Date.now()}`,
      classId: classId,
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate || '2026-11-30',
      maxPoints: parseInt(maxPoints) || 100,
      rubric: rubric || 'Conceptual rigor & clarity',
      createdAt: new Date().toISOString()
    };

    activities.push(newActivity);
    TagaStore.set(STORAGE_KEYS.ACTIVITIES, activities);

    this.closeAllModals();
    this.showToast(`Activity "${newActivity.title}" published!`);
    this.currentClassTab = 'activities';
    this.renderPage(this.currentPage);
  }

  // ONLY professors can upload course materials
  openCreateMaterialModal(classId) {
    if (this.currentUser && this.currentUser.role === 'student') {
      this.showToast('Only professors can upload course materials.', 'error');
      return;
    }
    const modal = document.getElementById('create-material-modal');
    if (!modal) return;
    document.getElementById('material-class-id').value = classId;
    modal.classList.add('show');
  }

  executeCreateMaterial(classId, title, category, type, description) {
    if (!title) {
      this.showToast('Please enter a material title', 'error');
      return;
    }

    const materials = TagaStore.get(STORAGE_KEYS.MATERIALS, []);
    const newMaterial = {
      id: `mat_${Date.now()}`,
      classId: classId,
      title: title.trim(),
      category: category || 'Lecture Slides',
      type: type || 'PDF Document',
      description: description || 'Course learning document for students.',
      postedAt: new Date().toISOString().split('T')[0],
      fileSize: '2.4 MB',
      downloadUrl: '#'
    };

    materials.push(newMaterial);
    TagaStore.set(STORAGE_KEYS.MATERIALS, materials);

    this.closeAllModals();
    this.showToast(`Material "${newMaterial.title}" posted!`);
    this.currentClassTab = 'materials';
    this.renderPage(this.currentPage);
  }

  // Passing of activity: ONLY students submit
  openPassActivityModal(activityId, encodedTitle) {
    if (this.currentUser && this.currentUser.role !== 'student') {
      this.showToast('Only students pass activities. Professors grade them.', 'warning');
      return;
    }

    const title = decodeURIComponent(encodedTitle);
    const modal = document.getElementById('submit-activity-modal');
    if (!modal) return;

    document.getElementById('submit-activity-id').value = activityId;
    document.getElementById('submit-modal-act-title').textContent = title;
    document.getElementById('submission-text-input').value = '';
    document.getElementById('submission-word-count').textContent = '0 words';

    modal.classList.add('show');
  }

  async executePassActivity() {
    if (this.currentUser && this.currentUser.role !== 'student') {
      this.showToast('Only students can pass activities.', 'error');
      return;
    }

    const activityId = document.getElementById('submit-activity-id').value;
    const content = document.getElementById('submission-text-input').value;

    if (!content || content.trim().length < 20) {
      this.showToast('Please write a substantial activity text (at least 20 characters)', 'error');
      return;
    }

    const studentId = this.currentUser.id;
    const studentName = this.currentUser.name;
    const studentEmail = this.currentUser.email;

    // Automated Review generated upon submission!
    const aiReview = await AI_DETECTOR_ENGINE.generateSubmissionReview(content);

    const submissions = TagaStore.get(STORAGE_KEYS.SUBMISSIONS, []);
    const newSubmission = {
      id: `sub_${Date.now()}`,
      activityId: activityId,
      studentId: studentId,
      studentName: studentName,
      studentEmail: studentEmail,
      submittedAt: new Date().toISOString(),
      content: content,
      wordCount: (content.match(/\b\w+\b/g) || []).length,
      aiReview: aiReview,
      grade: undefined,
      professorFeedback: ''
    };

    submissions.push(newSubmission);
    TagaStore.set(STORAGE_KEYS.SUBMISSIONS, submissions);

    this.closeAllModals();
    this.showToast('Activity submitted! Automated AI Review generated instantly.');
    this.currentClassTab = 'activities';
    this.renderPage(this.currentPage);
  }

  // Grading: ONLY professors (and admin) grade activities
  openGradeSubmissionModal(submissionId, encodedActTitle, maxPoints) {
    if (this.currentUser && this.currentUser.role === 'student') {
      this.showToast('Only professors can grade submissions.', 'error');
      return;
    }

    const modal = document.getElementById('grade-submission-modal');
    if (!modal) return;

    const submissions = TagaStore.get(STORAGE_KEYS.SUBMISSIONS, []);
    const sub = submissions.find(s => s.id === submissionId);
    if (!sub) return;

    document.getElementById('grade-submission-id').value = submissionId;
    document.getElementById('grade-modal-act-title').textContent = decodeURIComponent(encodedActTitle);
    document.getElementById('grade-modal-student-name').textContent = sub.studentName;
    document.getElementById('grade-modal-sub-content').textContent = sub.content;
    document.getElementById('grade-input-score').value = sub.grade !== undefined ? sub.grade : '';
    document.getElementById('grade-max-points').textContent = maxPoints;
    document.getElementById('grade-input-feedback').value = sub.professorFeedback || '';

    const reviewBox = document.getElementById('grade-modal-ai-review');
    if (reviewBox && sub.aiReview) {
      const score = sub.aiReview.overallAiScore;
      reviewBox.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <div>
            <strong style="font-size: 13px;">Automated Review Report (Visible to Student & Professor)</strong>
            <div style="font-size: 11px; color: var(--text-muted);">Perplexity: ${sub.aiReview.perplexityScore} | Burstiness: ${sub.aiReview.burstinessScore}</div>
          </div>
          <span class="badge ${score >= 70 ? 'badge-ai' : (score >= 40 ? 'badge-mixed' : 'badge-human')}">
            ${score}% AI (${sub.aiReview.verdict})
          </span>
        </div>
      `;
    }

    modal.classList.add('show');
  }

  executeSaveGrade() {
    if (!this.currentUser || (this.currentUser.role !== 'professor' && this.currentUser.role !== 'admin')) {
      this.showToast('Only professors can assign and save grades.', 'error');
      return;
    }

    const subId = document.getElementById('grade-submission-id').value;
    const grade = document.getElementById('grade-input-score').value;
    const feedback = document.getElementById('grade-input-feedback').value;

    if (grade === '') {
      this.showToast('Please enter a grade score', 'error');
      return;
    }

    const submissions = TagaStore.get(STORAGE_KEYS.SUBMISSIONS, []);
    const sub = submissions.find(s => s.id === subId);
    if (sub) {
      sub.grade = parseFloat(grade);
      sub.professorFeedback = feedback.trim();
      sub.gradedAt = new Date().toISOString();
      sub.gradedBy = this.currentUser.name;

      TagaStore.set(STORAGE_KEYS.SUBMISSIONS, submissions);
      this.closeAllModals();
      this.showToast(`Grade recorded for ${sub.studentName}!`);
      this.currentClassTab = 'activities';
      this.renderPage(this.currentPage);
    }
  }

  openSubmissionInspectionModal(submissionId) {
    const modal = document.getElementById('inspection-modal');
    if (!modal) return;

    const submissions = TagaStore.get(STORAGE_KEYS.SUBMISSIONS, []);
    const sub = submissions.find(s => s.id === submissionId);
    if (!sub) return;

    document.getElementById('inspect-student-name').textContent = sub.studentName;
    document.getElementById('inspect-sub-date').textContent = new Date(sub.submittedAt).toLocaleString();
    document.getElementById('inspect-sub-content').textContent = sub.content;

    const gradeBox = document.getElementById('inspect-grade-box');
    if (gradeBox) {
      if (sub.grade !== undefined) {
        gradeBox.innerHTML = `
          <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid var(--accent-emerald); border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: 16px;">
            <div style="font-size: 14px; font-weight: 700; color: var(--accent-emerald);">Grade: ${sub.grade} pts</div>
            <div style="font-size: 13px; color: var(--text-main); margin-top: 4px;"><strong>Professor Feedback:</strong> ${sub.professorFeedback || 'None'}</div>
          </div>
        `;
      } else {
        gradeBox.innerHTML = `
          <div style="background: var(--card-inner); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 10px 14px; margin-bottom: 14px; font-size: 12px; color: var(--text-muted);">
            â³ Activity awaiting instructor grading.
          </div>
        `;
      }
    }

    const reviewBox = document.getElementById('inspect-ai-review-box');
    if (reviewBox && sub.aiReview) {
      const score = sub.aiReview.overallAiScore;
      reviewBox.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <div>
            <h4 style="font-size: 14px; font-weight: 700;">Automated AI Review (Shared Student & Professor View)</h4>
            <div style="font-size: 11px; color: var(--text-muted);">Perplexity: ${sub.aiReview.perplexityScore} | Burstiness: ${sub.aiReview.burstinessScore}</div>
          </div>
          <span class="badge ${score >= 70 ? 'badge-ai' : (score >= 40 ? 'badge-mixed' : 'badge-human')}">
            ${score}% AI (${sub.aiReview.verdict})
          </span>
        </div>
        <div style="line-height: 1.8; font-size: 13px; margin-top: 8px;">
          ${sub.aiReview.sentenceBreakdown.map(s => `
            <span class="hl-sentence ${s.label}" title="${s.score}% AI">${s.text} </span>
          `).join('')}
        </div>
      `;
    }

    modal.classList.add('show');
  }

  copyCode(code) {
    navigator.clipboard.writeText(code);
    this.showToast(`Class Code "${code}" copied to clipboard!`);
  }

  /* ---------------- Google OAuth ---------------- */
  openGoogleAuthModal() {
    const modal = document.getElementById('google-auth-modal');
    if (modal) modal.classList.add('show');
  }

  executeGoogleLogin(userIndex) {
    const users = TagaStore.get(STORAGE_KEYS.USERS, []);
    const selected = users[userIndex] || users[0];
    this.closeAllModals();
    this.switchUser(selected);
    this.showToast(`Authenticated via Google as ${selected.name}`);
    this.navigate('home');
  }

  executeCustomGoogleLogin(email, name, role) {
    if (!email || !name) {
      this.showToast('Please enter your Google details', 'error');
      return;
    }

    const newUser = {
      id: `usr_google_${Date.now()}`,
      name,
      username: email.split('@')[0],
      email,
      password: 'oauth_token',
      role: role || 'student',
      status: role === 'professor' ? 'pending' : 'active',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      university: 'Polytechnic State University',
      department: 'Computer Science',
      bio: 'Signed in via Google OAuth',
      joinedDate: new Date().toISOString().split('T')[0]
    };

    const users = TagaStore.get(STORAGE_KEYS.USERS, []);
    users.push(newUser);
    TagaStore.set(STORAGE_KEYS.USERS, users);

    this.closeAllModals();
    this.switchUser(newUser);
    this.showToast(`Signed in with Google: ${email}`);
    this.navigate('home');
  }

  openTermsModal() {
    const modal = document.getElementById('terms-modal');
    if (modal) modal.classList.add('show');
  }

  openPrivacyModal() {
    const modal = document.getElementById('privacy-modal');
    if (modal) modal.classList.add('show');
  }

  closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('show'));
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    if (type === 'error') {
      toast.style.borderLeftColor = 'var(--accent-rose)';
    } else if (type === 'warning') {
      toast.style.borderLeftColor = 'var(--accent-amber)';
    }

    toast.innerHTML = `
      <span>${type === 'error' ? 'âš ï¸' : (type === 'warning' ? 'â³' : 'âœ¨')}</span>
      <div style="flex: 1;">${message}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }
}

// Instantiate App
window.addEventListener('DOMContentLoaded', () => {
  window.tagaApp = new TagaApp();
});

