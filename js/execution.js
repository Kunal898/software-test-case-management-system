/* =============================================
   Test Execution Module
   ============================================= */

let currentExecTC = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) return;
    populateExecProjectFilter();
    populateExecTestCases();
    renderExecHistory();

    // Auto-select test case if passed via URL
    const params = new URLSearchParams(window.location.search);
    const tcId = params.get('tc');
    if (tcId) {
        setTimeout(() => {
            const select = document.getElementById('execTestCaseSelect');
            if (select) {
                select.value = tcId;
                loadTestCaseForExecution();
            }
        }, 100);
    }
});

function populateExecProjectFilter() {
    const projects = loadData(StorageKeys.PROJECTS) || [];
    const select = document.getElementById('execProjectFilter');
    if (!select) return;
    projects.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        select.appendChild(opt);
    });
}

function populateExecTestCases() {
    const projectFilter = document.getElementById('execProjectFilter')?.value || '';
    let testCases = loadData(StorageKeys.TEST_CASES) || [];
    if (projectFilter) {
        testCases = testCases.filter(tc => tc.project === projectFilter);
    }

    const select = document.getElementById('execTestCaseSelect');
    if (!select) return;
    select.innerHTML = '<option value="">-- Select a Test Case --</option>';
    testCases.forEach(tc => {
        const opt = document.createElement('option');
        opt.value = tc.id;
        opt.textContent = `${tc.id} - ${tc.title} [${tc.status}]`;
        select.appendChild(opt);
    });
}

function loadTestCaseForExecution() {
    const tcId = document.getElementById('execTestCaseSelect')?.value;
    const panel = document.getElementById('executionPanel');
    if (!tcId) {
        panel.style.display = 'none';
        currentExecTC = null;
        return;
    }

    const tc = getById(StorageKeys.TEST_CASES, tcId);
    if (!tc) {
        panel.style.display = 'none';
        return;
    }

    currentExecTC = tc;
    panel.style.display = 'block';

    document.getElementById('execTcId').textContent = tc.id;
    document.getElementById('execTcStatus').innerHTML = getStatusBadge(tc.status);
    document.getElementById('execTcTitle').textContent = tc.title;
    document.getElementById('execTcPreconditions').textContent = tc.preconditions || 'None';
    document.getElementById('execTcExpected').textContent = tc.expectedResult || 'N/A';

    // Render steps
    const steps = (tc.testSteps || '').split('\n').filter(s => s.trim());
    document.getElementById('execTcSteps').innerHTML = steps.length > 0
        ? `<ol class="steps-list">${steps.map(s => `<li>${escapeHTML(s.replace(/^\d+\.\s*/, ''))}</li>`).join('')}</ol>`
        : '<p>No steps defined</p>';

    // Reset form
    document.getElementById('execActualResult').value = tc.actualResult || '';
    document.getElementById('execComments').value = '';
    document.getElementById('execStatus').value = '';
    document.getElementById('execEnvironment').value = '';
    document.getElementById('reportBugSection').style.display = 'none';
}

function checkFailedStatus() {
    const status = document.getElementById('execStatus').value;
    document.getElementById('reportBugSection').style.display = status === 'Failed' ? 'block' : 'none';
}

function submitExecution() {
    if (!currentExecTC) {
        showToast('Please select a test case', 'warning');
        return;
    }

    const actualResult = document.getElementById('execActualResult').value.trim();
    const status = document.getElementById('execStatus').value;
    const comments = document.getElementById('execComments').value.trim();
    const environment = document.getElementById('execEnvironment').value.trim();

    if (!actualResult) {
        showToast('Please enter the actual result', 'danger');
        document.getElementById('execActualResult').classList.add('is-invalid');
        return;
    }
    if (!status) {
        showToast('Please select execution status', 'danger');
        return;
    }

    const currentUser = getCurrentUser();

    // Create execution record
    const execution = {
        id: generateID('TE'),
        testCaseId: currentExecTC.id,
        testCaseTitle: currentExecTC.title,
        status: status,
        actualResult: actualResult,
        tester: currentUser ? currentUser.name : 'Unknown',
        executionDate: new Date().toISOString(),
        comments: comments,
        environment: environment
    };
    addRecord(StorageKeys.TEST_EXECUTIONS, execution);

    // Update test case status and actual result
    updateData(StorageKeys.TEST_CASES, currentExecTC.id, {
        status: status,
        actualResult: actualResult
    });

    addActivity('Test executed', 'Test Execution', `${currentExecTC.id} - ${status}`);
    addNotification(`Test execution ${status.toLowerCase()} for ${currentExecTC.id}.`, status === 'Failed' ? 'danger' : 'success', 'all');

    showToast(`Test case ${currentExecTC.id} marked as ${status}`, status === 'Passed' ? 'success' : status === 'Failed' ? 'danger' : 'warning');

    // Update status display
    document.getElementById('execTcStatus').innerHTML = getStatusBadge(status);

    // Show report bug if failed
    if (status === 'Failed') {
        document.getElementById('reportBugSection').style.display = 'block';
    }

    // Refresh
    populateExecTestCases();
    renderExecHistory();
}

function reportBugFromExecution() {
    if (!currentExecTC) return;
    // Navigate to bugs page with pre-filled data
    const bugData = {
        relatedTestCase: currentExecTC.id,
        project: currentExecTC.project,
        module: currentExecTC.module,
        title: `Bug from ${currentExecTC.id}: ${currentExecTC.title}`,
        expectedResult: currentExecTC.expectedResult,
        actualResult: document.getElementById('execActualResult')?.value || currentExecTC.actualResult,
        stepsToReproduce: currentExecTC.testSteps
    };
    sessionStorage.setItem('prefillBug', JSON.stringify(bugData));
    window.location.href = 'bugs.html?from=execution';
}

function renderExecHistory() {
    const tbody = document.getElementById('execHistoryBody');
    if (!tbody) return;

    const executions = loadData(StorageKeys.TEST_EXECUTIONS) || [];
    
    if (executions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><i class="fas fa-play-circle"></i><h5>No Executions Yet</h5><p>Execute a test case to see history here.</p></div></td></tr>';
        return;
    }

    // Sort by date descending
    const sorted = [...executions].sort((a, b) => new Date(b.executionDate) - new Date(a.executionDate));

    tbody.innerHTML = sorted.map(e => `
        <tr>
            <td><strong>${escapeHTML(e.id)}</strong></td>
            <td style="color:var(--primary);font-weight:600;">${escapeHTML(e.testCaseId)}</td>
            <td>${escapeHTML(truncateText(e.testCaseTitle, 30))}</td>
            <td>${getStatusBadge(e.status)}</td>
            <td>${escapeHTML(e.tester || '')}</td>
            <td style="font-size:12px;">${escapeHTML(e.environment || '')}</td>
            <td style="font-size:12px;">${formatDateTime(e.executionDate)}</td>
            <td style="font-size:12px;max-width:150px;">${escapeHTML(truncateText(e.comments, 40))}</td>
        </tr>
    `).join('');
}

function exportExecutionsCSV() {
    const executions = loadData(StorageKeys.TEST_EXECUTIONS) || [];
    const exportData = executions.map(e => ({
        'Execution ID': e.id,
        'Test Case ID': e.testCaseId,
        'Title': e.testCaseTitle,
        'Status': e.status,
        'Actual Result': e.actualResult,
        'Tester': e.tester,
        'Environment': e.environment,
        'Date': formatDateTime(e.executionDate),
        'Comments': e.comments
    }));
    exportToCSV(exportData, 'test_executions_export');
}
