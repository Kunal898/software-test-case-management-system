/* =============================================
   Dashboard Module
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) return;
    renderDashboard();
});

function renderDashboard() {
    const user = getCurrentUser();
    const welcomeMsg = document.getElementById('welcomeMsg');
    if (welcomeMsg && user) {
        welcomeMsg.textContent = `Welcome back, ${user.name}!`;
    }

    renderStatCards();
    renderCharts();
    renderQualityMetrics();
    renderRecentActivity();
}

function renderStatCards() {
    const counts = getCounts();
    const container = document.getElementById('dashboardStats');
    if (!container) return;

    const stats = [
        { label: 'Total Projects', value: counts.totalProjects, icon: 'fa-folder-open', color: 'primary' },
        { label: 'Total Test Cases', value: counts.totalTestCases, icon: 'fa-list-check', color: 'info' },
        { label: 'Passed Tests', value: counts.passedTests, icon: 'fa-check-circle', color: 'success' },
        { label: 'Failed Tests', value: counts.failedTests, icon: 'fa-times-circle', color: 'danger' },
        { label: 'Blocked Tests', value: counts.blockedTests, icon: 'fa-ban', color: 'warning' },
        { label: 'Not Executed', value: counts.notExecuted, icon: 'fa-clock', color: 'purple' },
        { label: 'Open Bugs', value: counts.openBugs, icon: 'fa-bug', color: 'orange' },
        { label: 'Critical Bugs', value: counts.criticalBugs, icon: 'fa-exclamation-triangle', color: 'danger' }
    ];

    container.innerHTML = stats.map(s => `
        <div class="stat-card slide-up">
            <div class="stat-info">
                <h3>${s.value}</h3>
                <p>${escapeHTML(s.label)}</p>
            </div>
            <div class="stat-icon ${s.color}">
                <i class="fas ${s.icon}"></i>
            </div>
        </div>
    `).join('');
}

let chartInstances = {};

function renderCharts() {
    const counts = getCounts();
    const testCases = loadData(StorageKeys.TEST_CASES) || [];
    const projects = loadData(StorageKeys.PROJECTS) || [];

    // Destroy existing charts
    Object.values(chartInstances).forEach(c => c.destroy());
    chartInstances = {};

    // Test Case Status Doughnut
    const tcCtx = document.getElementById('testStatusChart');
    if (tcCtx) {
        chartInstances.testStatus = new Chart(tcCtx, {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Failed', 'Blocked', 'Not Executed'],
                datasets: [{
                    data: [counts.passedTests, counts.failedTests, counts.blockedTests, counts.notExecuted],
                    backgroundColor: ['#16A34A', '#DC2626', '#F59E0B', '#0EA5E9'],
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '65%',
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10 } }
                }
            }
        });
    }

    // Bug Status Chart
    const bugCtx = document.getElementById('bugStatusChart');
    if (bugCtx) {
        chartInstances.bugStatus = new Chart(bugCtx, {
            type: 'doughnut',
            data: {
                labels: ['Open', 'Assigned', 'In Progress', 'Fixed', 'Retest', 'Closed', 'Rejected', 'Reopened'],
                datasets: [{
                    data: [counts.bugsOpen, counts.bugsAssigned, counts.bugsInProgress, counts.bugsFixed, counts.bugsRetest, counts.bugsClosed, counts.bugsRejected, counts.bugsReopened],
                    backgroundColor: ['#7C3AED', '#F59E0B', '#EA580C', '#16A34A', '#0EA5E9', '#16A34A', '#64748B', '#DC2626'],
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '65%',
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10 } }
                }
            }
        });
    }

    // Bug Severity Bar Chart
    const sevCtx = document.getElementById('bugSeverityChart');
    if (sevCtx) {
        chartInstances.bugSeverity = new Chart(sevCtx, {
            type: 'bar',
            data: {
                labels: ['Critical', 'Major', 'Minor', 'Trivial'],
                datasets: [{
                    label: 'Bugs by Severity',
                    data: [counts.severityCritical, counts.severityMajor, counts.severityMinor, counts.severityTrivial],
                    backgroundColor: ['#DC2626', '#EA580C', '#F59E0B', '#0D9488'],
                    borderRadius: 6,
                    barThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } },
                    x: { grid: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }

    // Testing Progress by Project
    const progCtx = document.getElementById('testProgressChart');
    if (progCtx) {
        const projectNames = projects.map(p => p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name);
        const passedByProject = projects.map(p => testCases.filter(tc => tc.project === p.id && tc.status === 'Passed').length);
        const failedByProject = projects.map(p => testCases.filter(tc => tc.project === p.id && tc.status === 'Failed').length);
        const otherByProject = projects.map(p => testCases.filter(tc => tc.project === p.id && tc.status !== 'Passed' && tc.status !== 'Failed').length);

        chartInstances.testProgress = new Chart(progCtx, {
            type: 'bar',
            data: {
                labels: projectNames,
                datasets: [
                    { label: 'Passed', data: passedByProject, backgroundColor: '#16A34A', borderRadius: 4 },
                    { label: 'Failed', data: failedByProject, backgroundColor: '#DC2626', borderRadius: 4 },
                    { label: 'Other', data: otherByProject, backgroundColor: '#94A3B8', borderRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: { stacked: true, grid: { display: false } },
                    y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } }
                },
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10 } }
                }
            }
        });
    }
}

function renderQualityMetrics() {
    const container = document.getElementById('qualityMetrics');
    if (!container) return;

    const counts = getCounts();
    const tc = counts.totalTestCases;
    const executed = counts.passedTests + counts.failedTests + counts.blockedTests;
    const passRate = executed > 0 ? ((counts.passedTests / executed) * 100).toFixed(1) : '0.0';
    const failRate = executed > 0 ? ((counts.failedTests / executed) * 100).toFixed(1) : '0.0';
    const blockRate = executed > 0 ? ((counts.blockedTests / executed) * 100).toFixed(1) : '0.0';
    const coverage = tc > 0 ? ((executed / tc) * 100).toFixed(1) : '0.0';
    const defectDensity = tc > 0 ? (counts.totalBugs / tc).toFixed(2) : '0.00';
    const closedDefects = (loadData(StorageKeys.BUGS) || []).filter(b => b.status === 'Closed').length;

    const metrics = [
        { label: 'Total Test Cases', value: tc },
        { label: 'Executed', value: executed },
        { label: 'Pass Rate', value: passRate + '%' },
        { label: 'Fail Rate', value: failRate + '%' },
        { label: 'Block Rate', value: blockRate + '%' },
        { label: 'Test Coverage', value: coverage + '%' },
        { label: 'Defect Density', value: defectDensity },
        { label: 'Open Defects', value: counts.openBugs },
        { label: 'Closed Defects', value: closedDefects },
        { label: 'Critical Defects', value: counts.criticalBugs }
    ];

    container.innerHTML = metrics.map(m => `
        <div class="metric-item">
            <span class="metric-value">${m.value}</span>
            <span class="metric-label">${escapeHTML(m.label)}</span>
        </div>
    `).join('');
}

function renderRecentActivity() {
    const container = document.getElementById('recentActivity');
    if (!container) return;

    const activities = loadData(StorageKeys.ACTIVITY_LOG) || [];
    
    if (activities.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-history"></i><p>No recent activity</p></div>';
        return;
    }

    const iconMap = {
        'logged in': { icon: 'fa-sign-in-alt', bg: 'var(--primary-bg)', color: 'var(--primary)' },
        'logged out': { icon: 'fa-sign-out-alt', bg: 'var(--gray-lightest)', color: 'var(--gray)' },
        'created': { icon: 'fa-plus-circle', bg: 'var(--success-bg)', color: 'var(--success)' },
        'updated': { icon: 'fa-edit', bg: 'var(--warning-bg)', color: 'var(--warning)' },
        'deleted': { icon: 'fa-trash', bg: 'var(--danger-bg)', color: 'var(--danger)' },
        'executed': { icon: 'fa-play', bg: 'var(--info-bg)', color: 'var(--info)' },
        'reported': { icon: 'fa-bug', bg: 'var(--danger-bg)', color: 'var(--danger)' },
        'closed': { icon: 'fa-check-circle', bg: 'var(--success-bg)', color: 'var(--success)' },
        'assigned': { icon: 'fa-user-plus', bg: 'var(--purple-bg)', color: 'var(--purple)' }
    };

    container.innerHTML = activities.slice(0, 10).map(a => {
        let style = iconMap['created'];
        for (const key in iconMap) {
            if (a.action.toLowerCase().includes(key)) { style = iconMap[key]; break; }
        }
        return `
            <div class="activity-item">
                <div class="activity-icon" style="background:${style.bg};color:${style.color};">
                    <i class="fas ${style.icon}"></i>
                </div>
                <div class="activity-content">
                    <p><strong>${escapeHTML(a.user)}</strong> ${escapeHTML(a.action)} <span style="color:var(--text-secondary);">— ${escapeHTML(a.details)}</span></p>
                    <span class="activity-time">${timeAgo(a.date)}</span>
                </div>
            </div>
        `;
    }).join('');
}
