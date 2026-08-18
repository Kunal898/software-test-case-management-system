/* =============================================
   Main Application Module
   Initialization, Sample Data, Common Functions
   ============================================= */

/**
 * Initialize the application on every page
 */
function initApp() {
    // Check authentication (except login page)
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage !== 'index.html' && currentPage !== '') {
        if (!checkPageAccess()) return;
        updateUserHeader();
        setupSidebar();
        loadNotifications();
        initTheme();
        initSidebarToggle();
    }
    // Initialize sample data on first launch
    initSampleData();
}

/**
 * Initialize theme from LocalStorage
 */
function initTheme() {
    const theme = loadData(StorageKeys.THEME) || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

/**
 * Toggle dark/light theme
 */
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    saveData(StorageKeys.THEME, newTheme);
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

/**
 * Initialize sidebar toggle for mobile
 */
function initSidebarToggle() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (toggle && sidebar) {
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('show');
            if (overlay) overlay.classList.toggle('show');
        });
    }

    if (overlay && sidebar) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
        });
    }
}

/**
 * Get the common sidebar HTML
 */
function getSidebarHTML() {
    return `
    <div class="sidebar" id="sidebar">
        <div class="sidebar-brand">
            <i class="fas fa-vial"></i>
            <h5>STCMS <span>Test Management</span></h5>
        </div>
        <nav class="sidebar-nav">
            <div class="nav-section">
                <div class="nav-section-title">Main</div>
                <a href="dashboard.html" class="nav-link-sidebar">
                    <i class="fas fa-th-large"></i> Dashboard
                </a>
                <a href="projects.html" class="nav-link-sidebar">
                    <i class="fas fa-folder-open"></i> Projects
                </a>
            </div>
            <div class="nav-section">
                <div class="nav-section-title">Testing</div>
                <a href="test-cases.html" class="nav-link-sidebar">
                    <i class="fas fa-list-check"></i> Test Cases
                </a>
                <a href="test-execution.html" class="nav-link-sidebar">
                    <i class="fas fa-play-circle"></i> Test Execution
                </a>
                <a href="test-suites.html" class="nav-link-sidebar">
                    <i class="fas fa-layer-group"></i> Test Suites
                </a>
                <a href="bugs.html" class="nav-link-sidebar">
                    <i class="fas fa-bug"></i> Bug Tracking
                </a>
            </div>
            <div class="nav-section">
                <div class="nav-section-title">Analytics</div>
                <a href="reports.html" class="nav-link-sidebar">
                    <i class="fas fa-chart-bar"></i> Reports
                </a>
                <a href="rtm.html" class="nav-link-sidebar">
                    <i class="fas fa-project-diagram"></i> RTM
                </a>
            </div>
            <div class="nav-section">
                <div class="nav-section-title">Admin</div>
                <a href="team.html" class="nav-link-sidebar">
                    <i class="fas fa-users"></i> Team
                </a>
                <a href="settings.html" class="nav-link-sidebar">
                    <i class="fas fa-cog"></i> Settings
                </a>
                <a href="help.html" class="nav-link-sidebar">
                    <i class="fas fa-question-circle"></i> Help
                </a>
            </div>
        </nav>
        <div class="sidebar-footer">
            <a href="#" class="nav-link-sidebar" onclick="logoutUser(); return false;">
                <i class="fas fa-sign-out-alt"></i> Logout
            </a>
        </div>
    </div>`;
}

/**
 * Get the common header HTML
 */
function getHeaderHTML(pageTitle) {
    return `
    <header class="top-header">
        <div class="header-left">
            <button class="sidebar-toggle" id="sidebarToggle">
                <i class="fas fa-bars"></i>
            </button>
            <h1 class="page-title">${escapeHTML(pageTitle)}</h1>
        </div>
        <div class="header-right">
            <button class="header-btn theme-toggle" onclick="toggleTheme()" title="Toggle Theme">
                <i class="fas fa-moon" id="themeIcon"></i>
            </button>
            <div style="position:relative;">
                <button class="header-btn" id="notificationBtn" onclick="toggleNotifications()" title="Notifications">
                    <i class="fas fa-bell"></i>
                    <span class="notification-count" id="notificationCount" style="display:none;">0</span>
                </button>
                <div class="notification-dropdown" id="notificationDropdown">
                    <div class="notification-header">
                        <h6>Notifications</h6>
                        <button class="btn btn-sm btn-link" onclick="markAllNotificationsRead()">Mark all read</button>
                    </div>
                    <div class="notification-list" id="notificationList"></div>
                </div>
            </div>
            <div class="user-dropdown" id="userDropdown">
                <div class="user-avatar" id="headerUserAvatar">AU</div>
                <div class="user-info">
                    <span class="user-name" id="headerUserName">Admin User</span>
                    <span class="user-role" id="headerUserRole">Admin</span>
                </div>
            </div>
        </div>
    </header>`;
}

/**
 * Initialize sample data on first launch
 */
function initSampleData() {
    if (loadData(StorageKeys.DATA_INITIALIZED)) return;

    // --- Users ---
    const users = [
        { id: 'USR001', name: 'Admin User', username: 'admin', password: 'admin123', role: 'Admin', email: 'admin@stcms.com', status: 'Active', createdDate: '2026-01-15T08:00:00Z' },
        { id: 'USR002', name: 'Rahul Sharma', username: 'tester', password: 'tester123', role: 'Tester', email: 'rahul@stcms.com', status: 'Active', createdDate: '2026-01-16T09:00:00Z' },
        { id: 'USR003', name: 'Priya Patel', username: 'developer', password: 'developer123', role: 'Developer', email: 'priya@stcms.com', status: 'Active', createdDate: '2026-01-17T10:00:00Z' },
        { id: 'USR004', name: 'Amit Verma', username: 'amitv', password: 'amitv123', role: 'Project Manager', email: 'amit@stcms.com', status: 'Active', createdDate: '2026-02-01T08:00:00Z' },
        { id: 'USR005', name: 'Sneha Gupta', username: 'snehag', password: 'snehag123', role: 'Tester', email: 'sneha@stcms.com', status: 'Active', createdDate: '2026-02-10T11:00:00Z' }
    ];
    saveData(StorageKeys.USERS, users);

    // --- Projects ---
    const projects = [
        {
            id: 'PRJ001', name: 'E-Commerce Web Application', description: 'Full-stack e-commerce platform with user authentication, product catalog, shopping cart, payment integration, and order management.', version: '2.1.0',
            startDate: '2026-03-01', endDate: '2026-09-30', projectManager: 'Amit Verma', status: 'Active', createdDate: '2026-03-01T08:00:00Z'
        },
        {
            id: 'PRJ002', name: 'Banking Management System', description: 'Online banking system with account management, fund transfers, transaction history, loan management, and security features.', version: '1.5.0',
            startDate: '2026-04-01', endDate: '2026-12-31', projectManager: 'Amit Verma', status: 'Testing', createdDate: '2026-04-01T09:00:00Z'
        },
        {
            id: 'PRJ003', name: 'Student Management Portal', description: 'Academic portal for student registration, course enrollment, grade management, attendance tracking, and faculty dashboard.', version: '3.0.0',
            startDate: '2026-02-15', endDate: '2026-08-15', projectManager: 'Admin User', status: 'Active', createdDate: '2026-02-15T10:00:00Z'
        }
    ];
    saveData(StorageKeys.PROJECTS, projects);

    // --- Test Cases ---
    const testCases = [
        {
            id: 'TC001', project: 'PRJ001', module: 'Authentication', title: 'Verify user login with valid credentials',
            description: 'Test that a registered user can successfully log in using valid username and password.',
            preconditions: 'User must have a registered account. Application login page must be accessible.',
            testSteps: '1. Navigate to login page\n2. Enter valid username\n3. Enter valid password\n4. Click Login button',
            testData: 'Username: testuser@email.com, Password: Test@1234',
            expectedResult: 'User should be successfully logged in and redirected to the dashboard.',
            actualResult: 'User logged in successfully and dashboard loaded.',
            priority: 'High', severity: 'Critical', testType: 'Functional',
            createdBy: 'Admin User', assignedTo: 'Rahul Sharma',
            createdDate: '2026-03-05T10:00:00Z', updatedDate: '2026-03-15T14:00:00Z', status: 'Passed'
        },
        {
            id: 'TC002', project: 'PRJ001', module: 'Authentication', title: 'Verify user login with invalid credentials',
            description: 'Test that login fails with invalid credentials and appropriate error message is displayed.',
            preconditions: 'Login page is accessible.',
            testSteps: '1. Navigate to login page\n2. Enter invalid username\n3. Enter invalid password\n4. Click Login button',
            testData: 'Username: wronguser@email.com, Password: WrongPass',
            expectedResult: 'Error message "Invalid username or password" should be displayed.',
            actualResult: 'Error message displayed correctly.',
            priority: 'High', severity: 'Critical', testType: 'Functional',
            createdBy: 'Admin User', assignedTo: 'Rahul Sharma',
            createdDate: '2026-03-05T10:30:00Z', updatedDate: '2026-03-15T14:30:00Z', status: 'Passed'
        },
        {
            id: 'TC003', project: 'PRJ001', module: 'Shopping Cart', title: 'Add product to shopping cart',
            description: 'Verify that a user can add a product to the shopping cart from the product listing page.',
            preconditions: 'User is logged in. Products are available in the catalog.',
            testSteps: '1. Navigate to product listing page\n2. Select a product\n3. Click "Add to Cart" button\n4. Verify cart count updates',
            testData: 'Product: Wireless Headphones, Quantity: 1',
            expectedResult: 'Product should be added to cart and cart counter should increment by 1.',
            actualResult: 'Product added but cart counter did not update immediately.',
            priority: 'High', severity: 'Major', testType: 'Functional',
            createdBy: 'Admin User', assignedTo: 'Rahul Sharma',
            createdDate: '2026-03-06T09:00:00Z', updatedDate: '2026-03-16T11:00:00Z', status: 'Failed'
        },
        {
            id: 'TC004', project: 'PRJ001', module: 'Payment', title: 'Verify checkout with valid payment details',
            description: 'Test the complete checkout flow with valid credit card payment information.',
            preconditions: 'User has items in cart. Payment gateway is configured.',
            testSteps: '1. Go to checkout\n2. Enter shipping address\n3. Enter payment details\n4. Click Place Order\n5. Verify order confirmation',
            testData: 'Card: 4111111111111111, Expiry: 12/27, CVV: 123',
            expectedResult: 'Order should be placed successfully with confirmation number displayed.',
            actualResult: '',
            priority: 'Critical', severity: 'Critical', testType: 'Integration',
            createdBy: 'Admin User', assignedTo: 'Sneha Gupta',
            createdDate: '2026-03-07T10:00:00Z', updatedDate: '2026-03-07T10:00:00Z', status: 'Not Executed'
        },
        {
            id: 'TC005', project: 'PRJ001', module: 'Search', title: 'Verify product search functionality',
            description: 'Test that the search feature returns relevant results based on product name keywords.',
            preconditions: 'Products exist in the database. Search feature is enabled.',
            testSteps: '1. Navigate to home page\n2. Enter search keyword in search bar\n3. Click search icon or press Enter\n4. Verify search results',
            testData: 'Search keyword: "Laptop"',
            expectedResult: 'All products containing "Laptop" in their name should be displayed.',
            actualResult: 'Search results displayed correctly with relevant products.',
            priority: 'Medium', severity: 'Minor', testType: 'Functional',
            createdBy: 'Rahul Sharma', assignedTo: 'Rahul Sharma',
            createdDate: '2026-03-08T08:00:00Z', updatedDate: '2026-03-17T09:00:00Z', status: 'Passed'
        },
        {
            id: 'TC006', project: 'PRJ002', module: 'Account Management', title: 'Verify new account creation',
            description: 'Test that a new bank account can be created with all required information.',
            preconditions: 'User is an authorized bank employee. Account creation module is accessible.',
            testSteps: '1. Navigate to Account Management\n2. Click Create New Account\n3. Fill in customer details\n4. Select account type\n5. Submit form',
            testData: 'Name: John Doe, Account Type: Savings, Initial Deposit: ₹10000',
            expectedResult: 'New account should be created with a unique account number assigned.',
            actualResult: 'Account created successfully. Account number: ACC-2026-001.',
            priority: 'High', severity: 'Critical', testType: 'Functional',
            createdBy: 'Admin User', assignedTo: 'Sneha Gupta',
            createdDate: '2026-04-05T10:00:00Z', updatedDate: '2026-04-15T12:00:00Z', status: 'Passed'
        },
        {
            id: 'TC007', project: 'PRJ002', module: 'Fund Transfer', title: 'Verify fund transfer between accounts',
            description: 'Test that funds can be transferred between two valid bank accounts.',
            preconditions: 'Both source and destination accounts exist with sufficient balance.',
            testSteps: '1. Navigate to Fund Transfer\n2. Enter source account\n3. Enter destination account\n4. Enter transfer amount\n5. Confirm transfer',
            testData: 'Source: ACC001, Destination: ACC002, Amount: ₹5000',
            expectedResult: 'Transfer should be successful. Source balance should decrease and destination balance should increase by ₹5000.',
            actualResult: 'Transfer blocked due to third-party API timeout.',
            priority: 'Critical', severity: 'Critical', testType: 'Integration',
            createdBy: 'Rahul Sharma', assignedTo: 'Rahul Sharma',
            createdDate: '2026-04-06T11:00:00Z', updatedDate: '2026-04-16T14:00:00Z', status: 'Blocked'
        },
        {
            id: 'TC008', project: 'PRJ002', module: 'Security', title: 'Verify session timeout after inactivity',
            description: 'Test that the user session expires after 15 minutes of inactivity.',
            preconditions: 'User is logged in. Session timeout is configured to 15 minutes.',
            testSteps: '1. Login to the application\n2. Do not perform any action for 15 minutes\n3. Try to navigate to any page\n4. Verify redirect to login',
            testData: 'Timeout: 15 minutes',
            expectedResult: 'User should be automatically logged out and redirected to the login page.',
            actualResult: '',
            priority: 'Medium', severity: 'Major', testType: 'Security',
            createdBy: 'Admin User', assignedTo: 'Rahul Sharma',
            createdDate: '2026-04-07T09:00:00Z', updatedDate: '2026-04-07T09:00:00Z', status: 'Not Executed'
        },
        {
            id: 'TC009', project: 'PRJ003', module: 'Registration', title: 'Verify student registration form',
            description: 'Test that a new student can register with valid details on the portal.',
            preconditions: 'Registration module is accessible. Current semester registration is open.',
            testSteps: '1. Navigate to student registration\n2. Fill in personal details\n3. Upload required documents\n4. Select course and semester\n5. Submit registration',
            testData: 'Name: Jane Smith, Course: B.Tech CS, Semester: 1st',
            expectedResult: 'Student should be registered with a unique enrollment number assigned.',
            actualResult: 'Registration successful. Enrollment: ENR-2026-0045.',
            priority: 'High', severity: 'Critical', testType: 'Functional',
            createdBy: 'Admin User', assignedTo: 'Sneha Gupta',
            createdDate: '2026-02-20T08:00:00Z', updatedDate: '2026-03-01T10:00:00Z', status: 'Passed'
        },
        {
            id: 'TC010', project: 'PRJ003', module: 'Attendance', title: 'Verify attendance marking system',
            description: 'Test that faculty can mark student attendance for a specific class.',
            preconditions: 'Faculty is logged in. Class schedule exists. Students are enrolled.',
            testSteps: '1. Login as faculty\n2. Navigate to Attendance module\n3. Select class and date\n4. Mark attendance for each student\n5. Save attendance record',
            testData: 'Class: CS101, Date: 2026-03-20, Students: 40',
            expectedResult: 'Attendance should be saved successfully and reflected in student records.',
            actualResult: 'Attendance saved. 38 Present, 2 Absent recorded.',
            priority: 'High', severity: 'Major', testType: 'Functional',
            createdBy: 'Rahul Sharma', assignedTo: 'Rahul Sharma',
            createdDate: '2026-02-22T09:00:00Z', updatedDate: '2026-03-05T11:00:00Z', status: 'Passed'
        }
    ];
    saveData(StorageKeys.TEST_CASES, testCases);

    // --- Test Suites ---
    const testSuites = [
        {
            id: 'TS001', name: 'E-Commerce Regression Suite', description: 'Complete regression test suite for the e-commerce platform covering authentication, cart, and payment flows.',
            project: 'PRJ001', testCaseIds: ['TC001', 'TC002', 'TC003', 'TC004', 'TC005'], status: 'Active',
            createdDate: '2026-03-10T08:00:00Z', createdBy: 'Admin User'
        },
        {
            id: 'TS002', name: 'Banking Security Suite', description: 'Security-focused test suite for the banking system including authentication, session management, and transaction security.',
            project: 'PRJ002', testCaseIds: ['TC006', 'TC007', 'TC008'], status: 'Active',
            createdDate: '2026-04-10T09:00:00Z', createdBy: 'Admin User'
        },
        {
            id: 'TS003', name: 'Student Portal Smoke Tests', description: 'Quick smoke tests to validate core functionalities of the student management portal.',
            project: 'PRJ003', testCaseIds: ['TC009', 'TC010'], status: 'Active',
            createdDate: '2026-02-25T10:00:00Z', createdBy: 'Rahul Sharma'
        }
    ];
    saveData(StorageKeys.TEST_SUITES, testSuites);

    // --- Test Executions ---
    const testExecutions = [
        {
            id: 'TE001', testCaseId: 'TC001', testCaseTitle: 'Verify user login with valid credentials',
            status: 'Passed', actualResult: 'User logged in successfully and dashboard loaded.',
            tester: 'Rahul Sharma', executionDate: '2026-03-15T14:00:00Z', comments: 'All validations passed. No issues found.',
            environment: 'Chrome 120 / Windows 11'
        },
        {
            id: 'TE002', testCaseId: 'TC002', testCaseTitle: 'Verify user login with invalid credentials',
            status: 'Passed', actualResult: 'Error message displayed correctly.',
            tester: 'Rahul Sharma', executionDate: '2026-03-15T14:30:00Z', comments: 'Correct error message shown. Edge case handled.',
            environment: 'Chrome 120 / Windows 11'
        },
        {
            id: 'TE003', testCaseId: 'TC003', testCaseTitle: 'Add product to shopping cart',
            status: 'Failed', actualResult: 'Product added but cart counter did not update immediately.',
            tester: 'Rahul Sharma', executionDate: '2026-03-16T11:00:00Z', comments: 'Cart counter updates only after page refresh. Bug reported.',
            environment: 'Firefox 121 / Windows 11'
        },
        {
            id: 'TE004', testCaseId: 'TC006', testCaseTitle: 'Verify new account creation',
            status: 'Passed', actualResult: 'Account created successfully. Account number: ACC-2026-001.',
            tester: 'Sneha Gupta', executionDate: '2026-04-15T12:00:00Z', comments: 'Account creation workflow is smooth.',
            environment: 'Chrome 120 / Ubuntu 22.04'
        },
        {
            id: 'TE005', testCaseId: 'TC007', testCaseTitle: 'Verify fund transfer between accounts',
            status: 'Blocked', actualResult: 'Transfer blocked due to third-party API timeout.',
            tester: 'Rahul Sharma', executionDate: '2026-04-16T14:00:00Z', comments: 'Third-party payment API was down during testing. Need to retest when API is restored.',
            environment: 'Chrome 120 / Windows 11'
        }
    ];
    saveData(StorageKeys.TEST_EXECUTIONS, testExecutions);

    // --- Bugs ---
    const bugs = [
        {
            id: 'BUG001', title: 'Cart counter not updating in real-time', description: 'When adding a product to the shopping cart, the cart item counter in the header does not update until the page is refreshed.',
            project: 'PRJ001', module: 'Shopping Cart', relatedTestCase: 'TC003',
            stepsToReproduce: '1. Login to the application\n2. Navigate to product listing\n3. Click "Add to Cart" on any product\n4. Observe the cart counter in the header',
            expectedResult: 'Cart counter should increment immediately when a product is added.',
            actualResult: 'Cart counter remains the same until page is manually refreshed.',
            severity: 'Major', priority: 'High', environment: 'Web Browser', browser: 'Firefox 121', operatingSystem: 'Windows 11',
            reportedBy: 'Rahul Sharma', assignedTo: 'Priya Patel',
            createdDate: '2026-03-16T11:30:00Z', updatedDate: '2026-03-20T09:00:00Z', status: 'In Progress',
            developerComments: 'Investigating the state management issue. Likely a React state update problem.'
        },
        {
            id: 'BUG002', title: 'Payment gateway timeout on high traffic', description: 'The payment gateway integration throws a timeout error when multiple users try to make payments simultaneously during peak hours.',
            project: 'PRJ001', module: 'Payment', relatedTestCase: 'TC004',
            stepsToReproduce: '1. Simulate 50+ concurrent users\n2. Initiate checkout process for all users\n3. Enter payment details\n4. Submit payment simultaneously',
            expectedResult: 'All payment requests should be processed within 30 seconds.',
            actualResult: 'About 30% of requests timeout after 60 seconds.',
            severity: 'Critical', priority: 'High', environment: 'Production', browser: 'All Browsers', operatingSystem: 'All',
            reportedBy: 'Admin User', assignedTo: 'Priya Patel',
            createdDate: '2026-03-18T15:00:00Z', updatedDate: '2026-03-18T15:00:00Z', status: 'Open',
            developerComments: ''
        },
        {
            id: 'BUG003', title: 'Fund transfer API integration failure', description: 'The third-party fund transfer API frequently times out causing transaction failures and potential data inconsistency.',
            project: 'PRJ002', module: 'Fund Transfer', relatedTestCase: 'TC007',
            stepsToReproduce: '1. Login to banking system\n2. Navigate to Fund Transfer\n3. Enter valid source and destination accounts\n4. Enter transfer amount\n5. Click Transfer',
            expectedResult: 'Fund transfer should complete within 10 seconds with confirmation.',
            actualResult: 'API timeout error after 30 seconds. Transaction status becomes unclear.',
            severity: 'Critical', priority: 'High', environment: 'Staging', browser: 'Chrome 120', operatingSystem: 'Windows 11',
            reportedBy: 'Rahul Sharma', assignedTo: 'Priya Patel',
            createdDate: '2026-04-16T14:30:00Z', updatedDate: '2026-04-18T10:00:00Z', status: 'Assigned',
            developerComments: 'Will implement retry logic and circuit breaker pattern.'
        },
        {
            id: 'BUG004', title: 'Student profile photo upload fails for JPEG files', description: 'When students try to upload JPEG format profile photos, the upload fails with a generic error message. PNG files work correctly.',
            project: 'PRJ003', module: 'Registration', relatedTestCase: '',
            stepsToReproduce: '1. Login as student\n2. Navigate to Profile Settings\n3. Click "Upload Photo"\n4. Select a JPEG file\n5. Click Save',
            expectedResult: 'JPEG photo should be uploaded and displayed in profile.',
            actualResult: 'Error: "File upload failed. Please try again." Only JPEG files are affected.',
            severity: 'Minor', priority: 'Medium', environment: 'Development', browser: 'Chrome 120', operatingSystem: 'macOS',
            reportedBy: 'Sneha Gupta', assignedTo: 'Priya Patel',
            createdDate: '2026-03-02T16:00:00Z', updatedDate: '2026-03-10T14:00:00Z', status: 'Fixed',
            developerComments: 'MIME type validation was incorrectly rejecting JPEG files. Fixed in commit #a1b2c3d.'
        },
        {
            id: 'BUG005', title: 'Login button unresponsive on mobile devices', description: 'The login button on the mobile view of the e-commerce app does not respond to tap events on certain Android devices.',
            project: 'PRJ001', module: 'Authentication', relatedTestCase: 'TC001',
            stepsToReproduce: '1. Open the application on an Android phone\n2. Navigate to login page\n3. Enter valid credentials\n4. Tap the Login button',
            expectedResult: 'Login button should respond to tap and process the login.',
            actualResult: 'Login button does not respond. No visual feedback on tap.',
            severity: 'Major', priority: 'High', environment: 'Mobile', browser: 'Chrome Mobile', operatingSystem: 'Android 13',
            reportedBy: 'Rahul Sharma', assignedTo: 'Priya Patel',
            createdDate: '2026-03-20T08:00:00Z', updatedDate: '2026-03-25T16:00:00Z', status: 'Closed',
            developerComments: 'Fixed touch event handling. Added proper touch-action CSS property. Verified on multiple Android devices.'
        }
    ];
    saveData(StorageKeys.BUGS, bugs);

    // --- Requirements (for RTM) ---
    const requirements = [
        { id: 'REQ001', description: 'User Authentication and Login', testCaseIds: ['TC001', 'TC002'], status: 'Covered' },
        { id: 'REQ002', description: 'Shopping Cart Management', testCaseIds: ['TC003'], status: 'Partially Covered' },
        { id: 'REQ003', description: 'Payment Processing', testCaseIds: ['TC004'], status: 'Not Tested' },
        { id: 'REQ004', description: 'Product Search and Filter', testCaseIds: ['TC005'], status: 'Covered' },
        { id: 'REQ005', description: 'Bank Account Creation', testCaseIds: ['TC006'], status: 'Covered' },
        { id: 'REQ006', description: 'Fund Transfer Operations', testCaseIds: ['TC007'], status: 'Blocked' },
        { id: 'REQ007', description: 'Session Management and Security', testCaseIds: ['TC008'], status: 'Not Tested' },
        { id: 'REQ008', description: 'Student Registration', testCaseIds: ['TC009'], status: 'Covered' },
        { id: 'REQ009', description: 'Attendance Management', testCaseIds: ['TC010'], status: 'Covered' }
    ];
    saveData(StorageKeys.REQUIREMENTS, requirements);

    // --- Notifications ---
    const notifications = [
        { id: 'NTF001', message: 'TC003 has failed. Bug BUG001 has been reported.', type: 'danger', targetUser: 'all', read: false, date: '2026-03-16T11:30:00Z' },
        { id: 'NTF002', message: 'BUG003 has been assigned to Priya Patel.', type: 'bug', targetUser: 'all', read: false, date: '2026-04-16T14:30:00Z' },
        { id: 'NTF003', message: 'Test execution completed for E-Commerce Regression Suite.', type: 'test', targetUser: 'all', read: false, date: '2026-03-15T15:00:00Z' },
        { id: 'NTF004', message: 'BUG005 status changed to Closed.', type: 'success', targetUser: 'all', read: true, date: '2026-03-25T16:00:00Z' },
        { id: 'NTF005', message: 'New project "Student Management Portal" has been created.', type: 'project', targetUser: 'all', read: true, date: '2026-02-15T10:00:00Z' }
    ];
    saveData(StorageKeys.NOTIFICATIONS, notifications);

    // --- Activity Log ---
    const activityLog = [
        { id: 'ACT001', date: '2026-03-25T16:00:00Z', user: 'Priya Patel', action: 'Bug closed', module: 'Bug Tracking', details: 'BUG005 - Login button unresponsive on mobile' },
        { id: 'ACT002', date: '2026-03-20T09:00:00Z', user: 'Priya Patel', action: 'Bug status updated', module: 'Bug Tracking', details: 'BUG001 status changed to In Progress' },
        { id: 'ACT003', date: '2026-03-18T15:00:00Z', user: 'Admin User', action: 'Bug reported', module: 'Bug Tracking', details: 'BUG002 - Payment gateway timeout' },
        { id: 'ACT004', date: '2026-03-16T11:30:00Z', user: 'Rahul Sharma', action: 'Bug reported', module: 'Bug Tracking', details: 'BUG001 - Cart counter not updating' },
        { id: 'ACT005', date: '2026-03-16T11:00:00Z', user: 'Rahul Sharma', action: 'Test executed', module: 'Test Execution', details: 'TC003 - Failed' },
        { id: 'ACT006', date: '2026-03-15T14:30:00Z', user: 'Rahul Sharma', action: 'Test executed', module: 'Test Execution', details: 'TC002 - Passed' },
        { id: 'ACT007', date: '2026-03-15T14:00:00Z', user: 'Rahul Sharma', action: 'Test executed', module: 'Test Execution', details: 'TC001 - Passed' },
        { id: 'ACT008', date: '2026-03-10T08:00:00Z', user: 'Admin User', action: 'Test Suite created', module: 'Test Suites', details: 'TS001 - E-Commerce Regression Suite' },
        { id: 'ACT009', date: '2026-03-05T10:00:00Z', user: 'Admin User', action: 'Test case created', module: 'Test Cases', details: 'TC001 - Verify user login' },
        { id: 'ACT010', date: '2026-03-01T08:00:00Z', user: 'Admin User', action: 'Project created', module: 'Projects', details: 'PRJ001 - E-Commerce Web Application' }
    ];
    saveData(StorageKeys.ACTIVITY_LOG, activityLog);

    saveData(StorageKeys.DATA_INITIALIZED, true);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initApp);
