/* =============================================
   Authentication Module
   ============================================= */

/**
 * Demo credentials (academic purpose only)
 * NOT suitable for production security
 */
const DEMO_CREDENTIALS = [
    { username: 'admin', password: 'admin123', name: 'Admin User', role: 'Admin', email: 'admin@stcms.com' },
    { username: 'tester', password: 'tester123', name: 'QA Tester', role: 'Tester', email: 'tester@stcms.com' },
    { username: 'developer', password: 'developer123', name: 'Dev User', role: 'Developer', email: 'developer@stcms.com' }
];

/**
 * Login user
 */
function loginUser(username, password) {
    // Check demo credentials
    const demoCred = DEMO_CREDENTIALS.find(c => c.username === username && c.password === password);
    if (demoCred) {
        const users = loadData(StorageKeys.USERS) || [];
        let user = users.find(u => u.username === username);
        if (!user) {
            user = {
                id: generateID('USR'),
                name: demoCred.name,
                username: demoCred.username,
                role: demoCred.role,
                email: demoCred.email,
                status: 'Active',
                createdDate: new Date().toISOString()
            };
            addRecord(StorageKeys.USERS, user);
        }
        const sessionUser = {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
            email: user.email,
            loginTime: new Date().toISOString()
        };
        saveData(StorageKeys.CURRENT_USER, sessionUser);
        addActivity('User logged in', 'Authentication', `${user.name} (${user.role}) logged in`);
        return { success: true, user: sessionUser };
    }

    // Check custom users added by admin
    const users = loadData(StorageKeys.USERS) || [];
    const customUser = users.find(u => u.username === username && u.password === password);
    if (customUser) {
        const sessionUser = {
            id: customUser.id,
            name: customUser.name,
            username: customUser.username,
            role: customUser.role,
            email: customUser.email,
            loginTime: new Date().toISOString()
        };
        saveData(StorageKeys.CURRENT_USER, sessionUser);
        addActivity('User logged in', 'Authentication', `${customUser.name} (${customUser.role}) logged in`);
        return { success: true, user: sessionUser };
    }

    return { success: false, message: 'Invalid username or password' };
}

/**
 * Logout user
 */
function logoutUser() {
    const currentUser = loadData(StorageKeys.CURRENT_USER);
    if (currentUser) {
        addActivity('User logged out', 'Authentication', `${currentUser.name} logged out`);
    }
    localStorage.removeItem(StorageKeys.CURRENT_USER);
    window.location.href = 'index.html';
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    const user = loadData(StorageKeys.CURRENT_USER);
    return user !== null;
}

/**
 * Get current user
 */
function getCurrentUser() {
    return loadData(StorageKeys.CURRENT_USER);
}

/**
 * Check page access based on role
 */
function checkAccess() {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

/**
 * Check if current user has specific role
 */
function hasRole(role) {
    const user = getCurrentUser();
    if (!user) return false;
    if (user.role === 'Admin') return true; // Admin has all access
    if (Array.isArray(role)) return role.includes(user.role);
    return user.role === role;
}

/**
 * Role-based page access map
 */
const PAGE_ACCESS = {
    'dashboard.html': ['Admin', 'Tester', 'Developer', 'Project Manager'],
    'projects.html': ['Admin', 'Project Manager', 'Tester'],
    'test-cases.html': ['Admin', 'Tester', 'Project Manager'],
    'test-execution.html': ['Admin', 'Tester'],
    'test-suites.html': ['Admin', 'Tester'],
    'bugs.html': ['Admin', 'Tester', 'Developer'],
    'reports.html': ['Admin', 'Tester', 'Developer', 'Project Manager'],
    'team.html': ['Admin'],
    'rtm.html': ['Admin', 'Tester', 'Project Manager'],
    'settings.html': ['Admin', 'Tester', 'Developer', 'Project Manager'],
    'help.html': ['Admin', 'Tester', 'Developer', 'Project Manager']
};

/**
 * Check page-level access
 */
function checkPageAccess() {
    if (!checkAccess()) return false;
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const user = getCurrentUser();
    const allowedRoles = PAGE_ACCESS[page];
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        showToast('You do not have access to this page', 'danger');
        window.location.href = 'dashboard.html';
        return false;
    }
    return true;
}

/**
 * Update header with user info
 */
function updateUserHeader() {
    const user = getCurrentUser();
    if (!user) return;
    
    const userName = document.getElementById('headerUserName');
    const userRole = document.getElementById('headerUserRole');
    const userAvatar = document.getElementById('headerUserAvatar');

    if (userName) userName.textContent = user.name;
    if (userRole) userRole.textContent = user.role;
    if (userAvatar) userAvatar.textContent = getInitials(user.name);
}

/**
 * Setup sidebar navigation active states and role-based visibility
 */
function setupSidebar() {
    const currentPage = window.location.pathname.split('/').pop();
    const user = getCurrentUser();

    document.querySelectorAll('.nav-link-sidebar').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        }

        // Hide inaccessible pages for non-admin users
        if (user && user.role !== 'Admin') {
            const pageAccess = PAGE_ACCESS[href];
            if (pageAccess && !pageAccess.includes(user.role)) {
                link.style.display = 'none';
            }
        }
    });
}
