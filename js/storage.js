/* =============================================
   Storage Module - LocalStorage CRUD Operations
   ============================================= */

const StorageKeys = {
    USERS: 'stcms_users',
    PROJECTS: 'stcms_projects',
    TEST_CASES: 'stcms_testCases',
    TEST_SUITES: 'stcms_testSuites',
    TEST_EXECUTIONS: 'stcms_testExecutions',
    BUGS: 'stcms_bugs',
    NOTIFICATIONS: 'stcms_notifications',
    CURRENT_USER: 'stcms_currentUser',
    THEME: 'stcms_theme',
    ACTIVITY_LOG: 'stcms_activityLog',
    REQUIREMENTS: 'stcms_requirements',
    SETTINGS: 'stcms_settings',
    DATA_INITIALIZED: 'stcms_dataInitialized'
};

/**
 * Save data to LocalStorage
 */
function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('Error saving data:', e);
        return false;
    }
}

/**
 * Load data from LocalStorage
 */
function loadData(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Error loading data:', e);
        return null;
    }
}

/**
 * Update a single record by ID
 */
function updateData(key, id, updatedFields) {
    const data = loadData(key) || [];
    const index = data.findIndex(item => item.id === id);
    if (index !== -1) {
        data[index] = { ...data[index], ...updatedFields, updatedDate: new Date().toISOString() };
        saveData(key, data);
        return data[index];
    }
    return null;
}

/**
 * Delete a record by ID
 */
function deleteData(key, id) {
    const data = loadData(key) || [];
    const filtered = data.filter(item => item.id !== id);
    saveData(key, filtered);
    return filtered;
}

/**
 * Get a single record by ID
 */
function getById(key, id) {
    const data = loadData(key) || [];
    return data.find(item => item.id === id) || null;
}

/**
 * Add a new record
 */
function addRecord(key, record) {
    const data = loadData(key) || [];
    data.push(record);
    saveData(key, data);
    return record;
}

/**
 * Generate unique ID with prefix
 */
function generateID(prefix) {
    const data = loadData(getKeyForPrefix(prefix)) || [];
    let maxNum = 0;
    data.forEach(item => {
        const num = parseInt(item.id.replace(prefix, ''), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
    });
    return prefix + String(maxNum + 1).padStart(3, '0');
}

function getKeyForPrefix(prefix) {
    const map = {
        'PRJ': StorageKeys.PROJECTS,
        'TC': StorageKeys.TEST_CASES,
        'TS': StorageKeys.TEST_SUITES,
        'TE': StorageKeys.TEST_EXECUTIONS,
        'BUG': StorageKeys.BUGS,
        'USR': StorageKeys.USERS,
        'REQ': StorageKeys.REQUIREMENTS,
        'NTF': StorageKeys.NOTIFICATIONS,
        'ACT': StorageKeys.ACTIVITY_LOG
    };
    return map[prefix] || prefix;
}

/**
 * Get counts for dashboard
 */
function getCounts() {
    const projects = loadData(StorageKeys.PROJECTS) || [];
    const testCases = loadData(StorageKeys.TEST_CASES) || [];
    const bugs = loadData(StorageKeys.BUGS) || [];
    const executions = loadData(StorageKeys.TEST_EXECUTIONS) || [];
    const suites = loadData(StorageKeys.TEST_SUITES) || [];
    const users = loadData(StorageKeys.USERS) || [];

    return {
        totalProjects: projects.length,
        totalTestCases: testCases.length,
        passedTests: testCases.filter(tc => tc.status === 'Passed').length,
        failedTests: testCases.filter(tc => tc.status === 'Failed').length,
        blockedTests: testCases.filter(tc => tc.status === 'Blocked').length,
        notExecuted: testCases.filter(tc => tc.status === 'Not Executed').length,
        openBugs: bugs.filter(b => b.status === 'Open' || b.status === 'Assigned' || b.status === 'Reopened').length,
        criticalBugs: bugs.filter(b => b.severity === 'Critical' && b.status !== 'Closed').length,
        totalBugs: bugs.length,
        totalExecutions: executions.length,
        totalSuites: suites.length,
        totalUsers: users.length,
        // Bug status counts
        bugsOpen: bugs.filter(b => b.status === 'Open').length,
        bugsAssigned: bugs.filter(b => b.status === 'Assigned').length,
        bugsInProgress: bugs.filter(b => b.status === 'In Progress').length,
        bugsFixed: bugs.filter(b => b.status === 'Fixed').length,
        bugsRetest: bugs.filter(b => b.status === 'Retest').length,
        bugsReopened: bugs.filter(b => b.status === 'Reopened').length,
        bugsClosed: bugs.filter(b => b.status === 'Closed').length,
        bugsRejected: bugs.filter(b => b.status === 'Rejected').length,
        // Bug priority counts
        bugsCritical: bugs.filter(b => b.priority === 'High' && b.severity === 'Critical').length,
        bugsHigh: bugs.filter(b => b.priority === 'High').length,
        bugsMedium: bugs.filter(b => b.priority === 'Medium').length,
        bugsLow: bugs.filter(b => b.priority === 'Low').length,
        // Bug severity counts
        severityCritical: bugs.filter(b => b.severity === 'Critical').length,
        severityMajor: bugs.filter(b => b.severity === 'Major').length,
        severityMinor: bugs.filter(b => b.severity === 'Minor').length,
        severityTrivial: bugs.filter(b => b.severity === 'Trivial').length
    };
}

/**
 * Add activity log entry
 */
function addActivity(action, module, details) {
    const currentUser = loadData(StorageKeys.CURRENT_USER);
    const activities = loadData(StorageKeys.ACTIVITY_LOG) || [];
    activities.unshift({
        id: 'ACT' + Date.now(),
        date: new Date().toISOString(),
        user: currentUser ? currentUser.name : 'System',
        action: action,
        module: module,
        details: details || ''
    });
    // Keep only last 200 activities
    if (activities.length > 200) activities.length = 200;
    saveData(StorageKeys.ACTIVITY_LOG, activities);
}

/**
 * Add notification
 */
function addNotification(message, type, targetUser) {
    const notifications = loadData(StorageKeys.NOTIFICATIONS) || [];
    notifications.unshift({
        id: 'NTF' + Date.now(),
        message: message,
        type: type || 'info',
        targetUser: targetUser || 'all',
        read: false,
        date: new Date().toISOString()
    });
    if (notifications.length > 100) notifications.length = 100;
    saveData(StorageKeys.NOTIFICATIONS, notifications);
}

/**
 * Export all data as JSON
 */
function exportAllData() {
    const data = {
        projects: loadData(StorageKeys.PROJECTS) || [],
        testCases: loadData(StorageKeys.TEST_CASES) || [],
        testSuites: loadData(StorageKeys.TEST_SUITES) || [],
        testExecutions: loadData(StorageKeys.TEST_EXECUTIONS) || [],
        bugs: loadData(StorageKeys.BUGS) || [],
        users: loadData(StorageKeys.USERS) || [],
        requirements: loadData(StorageKeys.REQUIREMENTS) || [],
        activityLog: loadData(StorageKeys.ACTIVITY_LOG) || [],
        notifications: loadData(StorageKeys.NOTIFICATIONS) || [],
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    return data;
}

/**
 * Import data from JSON
 */
function importAllData(jsonData) {
    try {
        if (!jsonData || typeof jsonData !== 'object') throw new Error('Invalid data format');
        if (!jsonData.version) throw new Error('Missing version field');
        
        if (jsonData.projects && Array.isArray(jsonData.projects)) saveData(StorageKeys.PROJECTS, jsonData.projects);
        if (jsonData.testCases && Array.isArray(jsonData.testCases)) saveData(StorageKeys.TEST_CASES, jsonData.testCases);
        if (jsonData.testSuites && Array.isArray(jsonData.testSuites)) saveData(StorageKeys.TEST_SUITES, jsonData.testSuites);
        if (jsonData.testExecutions && Array.isArray(jsonData.testExecutions)) saveData(StorageKeys.TEST_EXECUTIONS, jsonData.testExecutions);
        if (jsonData.bugs && Array.isArray(jsonData.bugs)) saveData(StorageKeys.BUGS, jsonData.bugs);
        if (jsonData.requirements && Array.isArray(jsonData.requirements)) saveData(StorageKeys.REQUIREMENTS, jsonData.requirements);
        if (jsonData.activityLog && Array.isArray(jsonData.activityLog)) saveData(StorageKeys.ACTIVITY_LOG, jsonData.activityLog);
        if (jsonData.notifications && Array.isArray(jsonData.notifications)) saveData(StorageKeys.NOTIFICATIONS, jsonData.notifications);
        // Only import users if present and admin
        if (jsonData.users && Array.isArray(jsonData.users)) {
            const currentUser = loadData(StorageKeys.CURRENT_USER);
            if (currentUser && currentUser.role === 'Admin') {
                saveData(StorageKeys.USERS, jsonData.users);
            }
        }
        return true;
    } catch (e) {
        console.error('Import error:', e);
        return false;
    }
}

/**
 * Clear all application data
 */
function clearAllData() {
    Object.values(StorageKeys).forEach(key => {
        localStorage.removeItem(key);
    });
}
