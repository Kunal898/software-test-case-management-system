/* =============================================
   Reports Module
   ============================================= */

let reportChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) return;
    populateReportProjectFilter();
    generateReport();
});

function populateReportProjectFilter() {
    const projects = loadData(StorageKeys.PROJECTS) || [];
    const select = document.getElementById('reportProjectFilter');
    if (!select) return;
    projects.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        select.appendChild(opt);
    });
}

function generateReport() {
    const type = document.getElementById('reportType')?.value || 'summary';
    const projectFilter = document.getElementById('reportProjectFilter')?.value || '';
    const output = document.getElementById('reportOutput');
    if (!output) return;

    if (reportChartInstance) { reportChartInstance.destroy(); reportChartInstance = null; }

    let testCases = loadData(StorageKeys.TEST_CASES) || [];
    let bugs = loadData(StorageKeys.BUGS) || [];
    let executions = loadData(StorageKeys.TEST_EXECUTIONS) || [];
    const projects = loadData(StorageKeys.PROJECTS) || [];
    const users = loadData(StorageKeys.USERS) || [];

    if (projectFilter) {
        testCases = testCases.filter(tc => tc.project === projectFilter);
        bugs = bugs.filter(b => b.project === projectFilter);
        const tcIds = testCases.map(tc => tc.id);
        executions = executions.filter(e => tcIds.includes(e.testCaseId));
    }

    switch (type) {
        case 'summary': renderSummaryReport(output, testCases, bugs, executions, projects); break;
        case 'testStatus': renderTestStatusReport(output, testCases); break;
        case 'bugSummary': renderBugSummaryReport(output, bugs); break;
        case 'bugSeverity': renderBugSeverityReport(output, bugs); break;
        case 'bugPriority': renderBugPriorityReport(output, bugs); break;
        case 'testerPerformance': renderTesterPerformance(output, testCases, executions, users); break;
        case 'projectProgress': renderProjectProgress(output, testCases, projects); break;
        case 'failedTests': renderFailedTests(output, testCases); break;
        case 'openBugs': renderOpenBugs(output, bugs); break;
    }
}

function renderSummaryReport(container, testCases, bugs, executions, projects) {
    const total = testCases.length;
    const passed = testCases.filter(tc => tc.status === 'Passed').length;
    const failed = testCases.filter(tc => tc.status === 'Failed').length;
    const blocked = testCases.filter(tc => tc.status === 'Blocked').length;
    const notExec = testCases.filter(tc => tc.status === 'Not Executed').length;
    const executed = passed + failed + blocked;
    const passRate = executed > 0 ? ((passed / executed) * 100).toFixed(1) : '0.0';

    container.innerHTML = `
        <div class="card mb-4">
            <div class="card-header"><h6><i class="fas fa-clipboard-list" style="color:var(--primary);margin-right:8px;"></i>Test Execution Summary</h6>
            <button class="btn btn-sm btn-outline-primary" onclick="exportReportCSV('summary')"><i class="fas fa-download"></i> CSV</button></div>
            <div class="card-body">
                <div class="row g-3 mb-4">
                    <div class="col-md-6"><canvas id="reportChart"></canvas></div>
                    <div class="col-md-6">
                        <div class="metrics-grid">
                            <div class="metric-item"><span class="metric-value">${total}</span><span class="metric-label">Total Tests</span></div>
                            <div class="metric-item"><span class="metric-value" style="color:var(--success);">${passed}</span><span class="metric-label">Passed</span></div>
                            <div class="metric-item"><span class="metric-value" style="color:var(--danger);">${failed}</span><span class="metric-label">Failed</span></div>
                            <div class="metric-item"><span class="metric-value" style="color:var(--warning);">${blocked}</span><span class="metric-label">Blocked</span></div>
                            <div class="metric-item"><span class="metric-value" style="color:var(--info);">${notExec}</span><span class="metric-label">Not Executed</span></div>
                            <div class="metric-item"><span class="metric-value">${passRate}%</span><span class="metric-label">Pass Rate</span></div>
                            <div class="metric-item"><span class="metric-value">${bugs.length}</span><span class="metric-label">Total Bugs</span></div>
                            <div class="metric-item"><span class="metric-value">${executions.length}</span><span class="metric-label">Total Executions</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    const ctx = document.getElementById('reportChart');
    if (ctx) {
        reportChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Failed', 'Blocked', 'Not Executed'],
                datasets: [{ data: [passed, failed, blocked, notExec], backgroundColor: ['#16A34A', '#DC2626', '#F59E0B', '#0EA5E9'], borderWidth: 0 }]
            },
            options: { responsive: true, cutout: '60%', plugins: { legend: { position: 'bottom' } } }
        });
    }
}

function renderTestStatusReport(container, testCases) {
    container.innerHTML = `
        <div class="card">
            <div class="card-header"><h6>Test Case Status Report</h6><button class="btn btn-sm btn-outline-primary" onclick="exportReportCSV('testStatus')"><i class="fas fa-download"></i> CSV</button></div>
            <div class="table-responsive"><table class="table"><thead><tr><th>Test ID</th><th>Title</th><th>Module</th><th>Priority</th><th>Type</th><th>Status</th><th>Assigned To</th></tr></thead>
            <tbody>${testCases.map(tc => `<tr><td><strong style="color:var(--primary);">${escapeHTML(tc.id)}</strong></td><td>${escapeHTML(tc.title)}</td><td>${escapeHTML(tc.module||'')}</td><td>${getPriorityBadge(tc.priority)}</td><td>${escapeHTML(tc.testType||'')}</td><td>${getStatusBadge(tc.status)}</td><td>${escapeHTML(tc.assignedTo||'')}</td></tr>`).join('')}</tbody></table></div>
        </div>`;
}

function renderBugSummaryReport(container, bugs) {
    const open = bugs.filter(b => ['Open','Assigned','Reopened'].includes(b.status)).length;
    const inProgress = bugs.filter(b => b.status === 'In Progress').length;
    const fixed = bugs.filter(b => b.status === 'Fixed' || b.status === 'Retest').length;
    const closed = bugs.filter(b => b.status === 'Closed').length;

    container.innerHTML = `
        <div class="card mb-4">
            <div class="card-header"><h6>Bug Summary Report</h6><button class="btn btn-sm btn-outline-primary" onclick="exportReportCSV('bugSummary')"><i class="fas fa-download"></i> CSV</button></div>
            <div class="card-body">
                <div class="row g-3 mb-4">
                    <div class="col-md-6"><canvas id="reportChart"></canvas></div>
                    <div class="col-md-6">
                        <div class="metrics-grid">
                            <div class="metric-item"><span class="metric-value">${bugs.length}</span><span class="metric-label">Total Bugs</span></div>
                            <div class="metric-item"><span class="metric-value" style="color:var(--danger);">${open}</span><span class="metric-label">Open</span></div>
                            <div class="metric-item"><span class="metric-value" style="color:var(--warning);">${inProgress}</span><span class="metric-label">In Progress</span></div>
                            <div class="metric-item"><span class="metric-value" style="color:var(--success);">${closed}</span><span class="metric-label">Closed</span></div>
                        </div>
                    </div>
                </div>
                <div class="table-responsive"><table class="table"><thead><tr><th>Bug ID</th><th>Title</th><th>Severity</th><th>Priority</th><th>Status</th><th>Assigned To</th></tr></thead>
                <tbody>${bugs.map(b => `<tr><td><strong style="color:var(--danger);">${escapeHTML(b.id)}</strong></td><td>${escapeHTML(b.title)}</td><td>${getStatusBadge(b.severity)}</td><td>${getPriorityBadge(b.priority)}</td><td>${getStatusBadge(b.status)}</td><td>${escapeHTML(b.assignedTo||'')}</td></tr>`).join('')}</tbody></table></div>
            </div>
        </div>`;
    const ctx = document.getElementById('reportChart');
    if (ctx) {
        reportChartInstance = new Chart(ctx, { type: 'pie', data: { labels: ['Open','In Progress','Fixed/Retest','Closed'], datasets: [{ data: [open,inProgress,fixed,closed], backgroundColor: ['#DC2626','#F59E0B','#0EA5E9','#16A34A'], borderWidth: 0 }] }, options: { responsive: true, plugins: { legend: { position: 'bottom' } } } });
    }
}

function renderBugSeverityReport(container, bugs) {
    const critical = bugs.filter(b => b.severity === 'Critical').length;
    const major = bugs.filter(b => b.severity === 'Major').length;
    const minor = bugs.filter(b => b.severity === 'Minor').length;
    const trivial = bugs.filter(b => b.severity === 'Trivial').length;

    container.innerHTML = `
        <div class="card"><div class="card-header"><h6>Bug Severity Report</h6></div><div class="card-body">
        <div class="row"><div class="col-md-6"><canvas id="reportChart"></canvas></div>
        <div class="col-md-6"><div class="metrics-grid"><div class="metric-item"><span class="metric-value" style="color:var(--danger);">${critical}</span><span class="metric-label">Critical</span></div><div class="metric-item"><span class="metric-value" style="color:var(--orange);">${major}</span><span class="metric-label">Major</span></div><div class="metric-item"><span class="metric-value" style="color:var(--warning);">${minor}</span><span class="metric-label">Minor</span></div><div class="metric-item"><span class="metric-value" style="color:var(--teal);">${trivial}</span><span class="metric-label">Trivial</span></div></div></div></div></div></div>`;
    const ctx = document.getElementById('reportChart');
    if (ctx) reportChartInstance = new Chart(ctx, { type: 'bar', data: { labels: ['Critical','Major','Minor','Trivial'], datasets: [{ data: [critical,major,minor,trivial], backgroundColor: ['#DC2626','#EA580C','#F59E0B','#0D9488'], borderRadius: 6 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } } });
}

function renderBugPriorityReport(container, bugs) {
    const high = bugs.filter(b => b.priority === 'High').length;
    const medium = bugs.filter(b => b.priority === 'Medium').length;
    const low = bugs.filter(b => b.priority === 'Low').length;

    container.innerHTML = `
        <div class="card"><div class="card-header"><h6>Bug Priority Report</h6></div><div class="card-body">
        <div class="row"><div class="col-md-6"><canvas id="reportChart"></canvas></div>
        <div class="col-md-6"><div class="metrics-grid"><div class="metric-item"><span class="metric-value" style="color:var(--danger);">${high}</span><span class="metric-label">High</span></div><div class="metric-item"><span class="metric-value" style="color:var(--warning);">${medium}</span><span class="metric-label">Medium</span></div><div class="metric-item"><span class="metric-value" style="color:var(--info);">${low}</span><span class="metric-label">Low</span></div></div></div></div></div></div>`;
    const ctx = document.getElementById('reportChart');
    if (ctx) reportChartInstance = new Chart(ctx, { type: 'doughnut', data: { labels: ['High','Medium','Low'], datasets: [{ data: [high,medium,low], backgroundColor: ['#DC2626','#F59E0B','#0EA5E9'], borderWidth: 0 }] }, options: { responsive: true, cutout: '60%', plugins: { legend: { position: 'bottom' } } } });
}

function renderTesterPerformance(container, testCases, executions, users) {
    const testers = users.filter(u => u.role === 'Tester' || u.role === 'Admin');
    const testerData = testers.map(t => {
        const assigned = testCases.filter(tc => tc.assignedTo === t.name).length;
        const executed = executions.filter(e => e.tester === t.name).length;
        const passed = executions.filter(e => e.tester === t.name && e.status === 'Passed').length;
        return { name: t.name, role: t.role, assigned, executed, passed, passRate: executed > 0 ? ((passed/executed)*100).toFixed(0) : 0 };
    });

    container.innerHTML = `
        <div class="card"><div class="card-header"><h6>Tester Performance Report</h6><button class="btn btn-sm btn-outline-primary" onclick="exportReportCSV('tester')"><i class="fas fa-download"></i> CSV</button></div>
        <div class="table-responsive"><table class="table"><thead><tr><th>Tester</th><th>Role</th><th>Assigned</th><th>Executed</th><th>Passed</th><th>Pass Rate</th></tr></thead>
        <tbody>${testerData.map(t => `<tr><td><strong>${escapeHTML(t.name)}</strong></td><td>${escapeHTML(t.role)}</td><td>${t.assigned}</td><td>${t.executed}</td><td style="color:var(--success);">${t.passed}</td><td><div class="d-flex align-items-center gap-2"><div class="progress" style="flex:1;"><div class="progress-bar bg-success" style="width:${t.passRate}%"></div></div><span style="font-weight:600;font-size:12px;">${t.passRate}%</span></div></td></tr>`).join('')}</tbody></table></div></div>`;
}

function renderProjectProgress(container, testCases, projects) {
    container.innerHTML = `
        <div class="card"><div class="card-header"><h6>Project Testing Progress</h6></div><div class="card-body"><canvas id="reportChart"></canvas></div></div>`;
    const labels = projects.map(p => p.name.length > 25 ? p.name.substring(0,25)+'...' : p.name);
    const passed = projects.map(p => testCases.filter(tc => tc.project === p.id && tc.status === 'Passed').length);
    const failed = projects.map(p => testCases.filter(tc => tc.project === p.id && tc.status === 'Failed').length);
    const other = projects.map(p => testCases.filter(tc => tc.project === p.id && tc.status !== 'Passed' && tc.status !== 'Failed').length);
    const ctx = document.getElementById('reportChart');
    if (ctx) reportChartInstance = new Chart(ctx, { type: 'bar', data: { labels, datasets: [ { label: 'Passed', data: passed, backgroundColor: '#16A34A' }, { label: 'Failed', data: failed, backgroundColor: '#DC2626' }, { label: 'Other', data: other, backgroundColor: '#94A3B8' } ] }, options: { responsive: true, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }, plugins: { legend: { position: 'bottom' } } } });
}

function renderFailedTests(container, testCases) {
    const failed = testCases.filter(tc => tc.status === 'Failed');
    container.innerHTML = `
        <div class="card"><div class="card-header"><h6>Failed Test Cases (${failed.length})</h6><button class="btn btn-sm btn-outline-primary" onclick="exportReportCSV('failed')"><i class="fas fa-download"></i> CSV</button></div>
        <div class="table-responsive"><table class="table"><thead><tr><th>Test ID</th><th>Title</th><th>Module</th><th>Priority</th><th>Assigned To</th><th>Actual Result</th></tr></thead>
        <tbody>${failed.length > 0 ? failed.map(tc => `<tr><td><strong style="color:var(--primary);">${escapeHTML(tc.id)}</strong></td><td>${escapeHTML(tc.title)}</td><td>${escapeHTML(tc.module||'')}</td><td>${getPriorityBadge(tc.priority)}</td><td>${escapeHTML(tc.assignedTo||'')}</td><td style="font-size:12px;">${escapeHTML(truncateText(tc.actualResult,50))}</td></tr>`).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:32px;">No failed test cases</td></tr>'}</tbody></table></div></div>`;
}

function renderOpenBugs(container, bugs) {
    const open = bugs.filter(b => !['Closed','Rejected'].includes(b.status));
    container.innerHTML = `
        <div class="card"><div class="card-header"><h6>Open Bugs (${open.length})</h6><button class="btn btn-sm btn-outline-primary" onclick="exportReportCSV('openBugs')"><i class="fas fa-download"></i> CSV</button></div>
        <div class="table-responsive"><table class="table"><thead><tr><th>Bug ID</th><th>Title</th><th>Severity</th><th>Priority</th><th>Status</th><th>Assigned To</th><th>Created</th></tr></thead>
        <tbody>${open.length > 0 ? open.map(b => `<tr><td><strong style="color:var(--danger);">${escapeHTML(b.id)}</strong></td><td>${escapeHTML(b.title)}</td><td>${getStatusBadge(b.severity)}</td><td>${getPriorityBadge(b.priority)}</td><td>${getStatusBadge(b.status)}</td><td>${escapeHTML(b.assignedTo||'')}</td><td style="font-size:12px;">${formatDate(b.createdDate)}</td></tr>`).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:32px;">No open bugs</td></tr>'}</tbody></table></div></div>`;
}

function exportReportCSV(type) {
    const projectFilter = document.getElementById('reportProjectFilter')?.value || '';
    let testCases = loadData(StorageKeys.TEST_CASES) || [];
    let bugs = loadData(StorageKeys.BUGS) || [];
    if (projectFilter) {
        testCases = testCases.filter(tc => tc.project === projectFilter);
        bugs = bugs.filter(b => b.project === projectFilter);
    }

    switch (type) {
        case 'summary':
        case 'testStatus':
            exportToCSV(testCases.map(tc => ({ ID: tc.id, Title: tc.title, Module: tc.module, Priority: tc.priority, Type: tc.testType, Status: tc.status, 'Assigned To': tc.assignedTo })), 'test_status_report');
            break;
        case 'bugSummary':
        case 'openBugs':
            exportToCSV(bugs.map(b => ({ ID: b.id, Title: b.title, Severity: b.severity, Priority: b.priority, Status: b.status, 'Assigned To': b.assignedTo, Created: formatDate(b.createdDate) })), 'bug_report');
            break;
        case 'failed':
            exportToCSV(testCases.filter(tc => tc.status === 'Failed').map(tc => ({ ID: tc.id, Title: tc.title, Module: tc.module, Priority: tc.priority, 'Assigned To': tc.assignedTo, 'Actual Result': tc.actualResult })), 'failed_tests_report');
            break;
        case 'tester':
            const users = loadData(StorageKeys.USERS) || [];
            const executions = loadData(StorageKeys.TEST_EXECUTIONS) || [];
            const data = users.filter(u => u.role === 'Tester' || u.role === 'Admin').map(t => ({
                Tester: t.name, Assigned: testCases.filter(tc => tc.assignedTo === t.name).length,
                Executed: executions.filter(e => e.tester === t.name).length,
                Passed: executions.filter(e => e.tester === t.name && e.status === 'Passed').length
            }));
            exportToCSV(data, 'tester_performance_report');
            break;
    }
}

function exportAllJSON() {
    const data = exportAllData();
    exportToJSON(data, 'stcms_complete_backup');
}
