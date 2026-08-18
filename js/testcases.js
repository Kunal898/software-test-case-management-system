/* =============================================
   Test Cases Module
   ============================================= */

let tcCurrentPage = 1;
const TC_PER_PAGE = 10;

document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) return;
    populateTcSelects();
    renderTestCases();
});

function populateTcSelects() {
    const projects = loadData(StorageKeys.PROJECTS) || [];
    const users = loadData(StorageKeys.USERS) || [];

    // Project filter
    const filterSelect = document.getElementById('tcProjectFilter');
    if (filterSelect) {
        projects.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            filterSelect.appendChild(opt);
        });
    }

    // Project in form
    const formSelect = document.getElementById('tcProject');
    if (formSelect) {
        formSelect.innerHTML = '<option value="">Select Project</option>';
        projects.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            formSelect.appendChild(opt);
        });
    }

    // Assigned to in form
    const assignSelect = document.getElementById('tcAssignedTo');
    if (assignSelect) {
        assignSelect.innerHTML = '<option value="">Unassigned</option>';
        users.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.name;
            opt.textContent = `${u.name} (${u.role})`;
            assignSelect.appendChild(opt);
        });
    }
}

function getFilteredTestCases() {
    let testCases = loadData(StorageKeys.TEST_CASES) || [];
    const search = (document.getElementById('tcSearch')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('tcStatusFilter')?.value || '';
    const priorityFilter = document.getElementById('tcPriorityFilter')?.value || '';
    const projectFilter = document.getElementById('tcProjectFilter')?.value || '';
    const typeFilter = document.getElementById('tcTypeFilter')?.value || '';

    if (search) {
        testCases = testCases.filter(tc =>
            tc.id.toLowerCase().includes(search) ||
            tc.title.toLowerCase().includes(search) ||
            (tc.module && tc.module.toLowerCase().includes(search)) ||
            (tc.assignedTo && tc.assignedTo.toLowerCase().includes(search))
        );
    }
    if (statusFilter) testCases = testCases.filter(tc => tc.status === statusFilter);
    if (priorityFilter) testCases = testCases.filter(tc => tc.priority === priorityFilter);
    if (projectFilter) testCases = testCases.filter(tc => tc.project === projectFilter);
    if (typeFilter) testCases = testCases.filter(tc => tc.testType === typeFilter);

    return testCases;
}

function renderTestCases() {
    const tbody = document.getElementById('tcTableBody');
    if (!tbody) return;

    const filtered = getFilteredTestCases();
    const paginationData = paginate(filtered, tcCurrentPage, TC_PER_PAGE);
    const projects = loadData(StorageKeys.PROJECTS) || [];
    const projectMap = {};
    projects.forEach(p => projectMap[p.id] = p.name);

    if (paginationData.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state"><i class="fas fa-list-check"></i><h5>No Test Cases Found</h5><p>Create a new test case to get started.</p></div></td></tr>`;
        document.getElementById('tcPagination').innerHTML = '';
        return;
    }

    tbody.innerHTML = paginationData.data.map(tc => `
        <tr>
            <td><strong style="color:var(--primary);">${escapeHTML(tc.id)}</strong></td>
            <td style="max-width:200px;"><span title="${escapeHTML(tc.title)}">${escapeHTML(truncateText(tc.title, 40))}</span></td>
            <td>${escapeHTML(projectMap[tc.project] || tc.project)}</td>
            <td>${escapeHTML(tc.module || '')}</td>
            <td>${getPriorityBadge(tc.priority)}</td>
            <td><span style="font-size:12px;color:var(--text-secondary);">${escapeHTML(tc.testType || '')}</span></td>
            <td>${escapeHTML(tc.assignedTo || 'Unassigned')}</td>
            <td>${getStatusBadge(tc.status)}</td>
            <td style="font-size:12px;color:var(--text-muted);">${formatDate(tc.updatedDate || tc.createdDate)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon view" onclick="viewTestCase('${tc.id}')" title="View"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon edit" onclick="editTestCase('${tc.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon execute" onclick="window.location.href='test-execution.html?tc=${tc.id}'" title="Execute"><i class="fas fa-play"></i></button>
                    <button class="btn-icon duplicate" onclick="duplicateTestCase('${tc.id}')" title="Duplicate"><i class="fas fa-copy"></i></button>
                    <button class="btn-icon delete" onclick="deleteTestCase('${tc.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');

    renderPagination(paginationData, 'tcPagination', (page) => {
        tcCurrentPage = page;
        renderTestCases();
    });
}

function openTestCaseModal(tcId) {
    const modal = new bootstrap.Modal(document.getElementById('tcModal'));
    const title = document.getElementById('tcModalTitle');
    resetForm('tcForm');
    populateTcSelects();

    if (tcId) {
        const tc = getById(StorageKeys.TEST_CASES, tcId);
        if (!tc) return;
        title.textContent = 'Edit Test Case';
        document.getElementById('tcId').value = tc.id;
        document.getElementById('tcProject').value = tc.project || '';
        document.getElementById('tcModule').value = tc.module || '';
        document.getElementById('tcTitle').value = tc.title || '';
        document.getElementById('tcDescription').value = tc.description || '';
        document.getElementById('tcPreconditions').value = tc.preconditions || '';
        document.getElementById('tcSteps').value = tc.testSteps || '';
        document.getElementById('tcTestData').value = tc.testData || '';
        document.getElementById('tcExpected').value = tc.expectedResult || '';
        document.getElementById('tcActual').value = tc.actualResult || '';
        document.getElementById('tcPriority').value = tc.priority || 'Medium';
        document.getElementById('tcSeverity').value = tc.severity || 'Major';
        document.getElementById('tcType').value = tc.testType || 'Functional';
        document.getElementById('tcStatus').value = tc.status || 'Not Executed';
        document.getElementById('tcAssignedTo').value = tc.assignedTo || '';
    } else {
        title.textContent = 'New Test Case';
        document.getElementById('tcId').value = '';
    }
    modal.show();
}

function saveTestCase() {
    const errors = validateForm('tcForm');
    if (errors.length > 0) {
        showToast(errors[0], 'danger');
        return;
    }

    const id = document.getElementById('tcId').value;
    const currentUser = getCurrentUser();
    const tcData = {
        project: document.getElementById('tcProject').value,
        module: document.getElementById('tcModule').value.trim(),
        title: document.getElementById('tcTitle').value.trim(),
        description: document.getElementById('tcDescription').value.trim(),
        preconditions: document.getElementById('tcPreconditions').value.trim(),
        testSteps: document.getElementById('tcSteps').value.trim(),
        testData: document.getElementById('tcTestData').value.trim(),
        expectedResult: document.getElementById('tcExpected').value.trim(),
        actualResult: document.getElementById('tcActual').value.trim(),
        priority: document.getElementById('tcPriority').value,
        severity: document.getElementById('tcSeverity').value,
        testType: document.getElementById('tcType').value,
        status: document.getElementById('tcStatus').value,
        assignedTo: document.getElementById('tcAssignedTo').value,
        updatedDate: new Date().toISOString()
    };

    if (id) {
        updateData(StorageKeys.TEST_CASES, id, tcData);
        addActivity('Test case updated', 'Test Cases', `${id} - ${tcData.title}`);
        showToast('Test case updated successfully', 'success');
    } else {
        tcData.id = generateID('TC');
        tcData.createdBy = currentUser ? currentUser.name : 'Unknown';
        tcData.createdDate = new Date().toISOString();
        addRecord(StorageKeys.TEST_CASES, tcData);
        addActivity('Test case created', 'Test Cases', `${tcData.id} - ${tcData.title}`);
        if (tcData.assignedTo) {
            addNotification(`${tcData.id} has been assigned to you.`, 'test', tcData.assignedTo);
        }
        showToast('Test case created successfully', 'success');
    }

    bootstrap.Modal.getInstance(document.getElementById('tcModal')).hide();
    renderTestCases();
}

function editTestCase(id) {
    openTestCaseModal(id);
}

function deleteTestCase(id) {
    const tc = getById(StorageKeys.TEST_CASES, id);
    if (!tc) return;
    showConfirm('Delete Test Case', `Are you sure you want to delete "${tc.id} - ${tc.title}"?`, () => {
        deleteData(StorageKeys.TEST_CASES, id);
        addActivity('Test case deleted', 'Test Cases', `${tc.id} - ${tc.title}`);
        showToast('Test case deleted successfully', 'success');
        renderTestCases();
    });
}

function duplicateTestCase(id) {
    const tc = getById(StorageKeys.TEST_CASES, id);
    if (!tc) return;
    const currentUser = getCurrentUser();
    const newTc = { ...tc };
    newTc.id = generateID('TC');
    newTc.title = `[Copy] ${tc.title}`;
    newTc.status = 'Not Executed';
    newTc.actualResult = '';
    newTc.createdBy = currentUser ? currentUser.name : 'Unknown';
    newTc.createdDate = new Date().toISOString();
    newTc.updatedDate = new Date().toISOString();
    addRecord(StorageKeys.TEST_CASES, newTc);
    addActivity('Test case duplicated', 'Test Cases', `${tc.id} duplicated as ${newTc.id}`);
    showToast(`Test case duplicated as ${newTc.id}`, 'success');
    renderTestCases();
}

function viewTestCase(id) {
    const tc = getById(StorageKeys.TEST_CASES, id);
    if (!tc) return;

    const projects = loadData(StorageKeys.PROJECTS) || [];
    const project = projects.find(p => p.id === tc.project);
    const projectName = project ? project.name : tc.project;

    const steps = (tc.testSteps || '').split('\n').filter(s => s.trim());

    const body = document.getElementById('viewTcBody');
    body.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item"><label>Test Case ID</label><span style="font-weight:700;color:var(--primary);">${escapeHTML(tc.id)}</span></div>
            <div class="detail-item"><label>Status</label>${getStatusBadge(tc.status)}</div>
            <div class="detail-item detail-full"><label>Title</label><span style="font-size:17px;font-weight:600;">${escapeHTML(tc.title)}</span></div>
            <div class="detail-item"><label>Project</label><span>${escapeHTML(projectName)}</span></div>
            <div class="detail-item"><label>Module</label><span>${escapeHTML(tc.module || 'N/A')}</span></div>
            <div class="detail-item detail-full"><label>Description</label><p>${escapeHTML(tc.description || 'N/A')}</p></div>
            <div class="detail-item detail-full"><label>Preconditions</label><p>${escapeHTML(tc.preconditions || 'N/A')}</p></div>
            <div class="detail-item detail-full">
                <label>Test Steps</label>
                <ol class="steps-list">${steps.map(s => `<li>${escapeHTML(s.replace(/^\d+\.\s*/, ''))}</li>`).join('')}</ol>
            </div>
            <div class="detail-item detail-full"><label>Test Data</label><p>${escapeHTML(tc.testData || 'N/A')}</p></div>
            <div class="detail-item"><label>Expected Result</label><p>${escapeHTML(tc.expectedResult || 'N/A')}</p></div>
            <div class="detail-item"><label>Actual Result</label><p>${escapeHTML(tc.actualResult || 'N/A')}</p></div>
            <div class="detail-item"><label>Priority</label>${getPriorityBadge(tc.priority)}</div>
            <div class="detail-item"><label>Severity</label>${getStatusBadge(tc.severity || 'N/A')}</div>
            <div class="detail-item"><label>Test Type</label><span>${escapeHTML(tc.testType || 'N/A')}</span></div>
            <div class="detail-item"><label>Assigned To</label><span>${escapeHTML(tc.assignedTo || 'Unassigned')}</span></div>
            <div class="detail-item"><label>Created By</label><span>${escapeHTML(tc.createdBy || 'N/A')}</span></div>
            <div class="detail-item"><label>Created Date</label><span>${formatDate(tc.createdDate)}</span></div>
        </div>
    `;
    new bootstrap.Modal(document.getElementById('viewTcModal')).show();
}

function exportTestCasesCSV() {
    const testCases = loadData(StorageKeys.TEST_CASES) || [];
    const projects = loadData(StorageKeys.PROJECTS) || [];
    const projectMap = {};
    projects.forEach(p => projectMap[p.id] = p.name);

    const exportData = testCases.map(tc => ({
        'Test ID': tc.id,
        'Title': tc.title,
        'Project': projectMap[tc.project] || tc.project,
        'Module': tc.module,
        'Priority': tc.priority,
        'Severity': tc.severity,
        'Type': tc.testType,
        'Status': tc.status,
        'Assigned To': tc.assignedTo,
        'Created By': tc.createdBy,
        'Created Date': formatDate(tc.createdDate),
        'Expected Result': tc.expectedResult,
        'Actual Result': tc.actualResult
    }));
    exportToCSV(exportData, 'test_cases_export');
}
