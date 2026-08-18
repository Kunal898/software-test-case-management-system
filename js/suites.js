/* =============================================
   Test Suites Module
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) return;
    renderSuites();
});

function renderSuites() {
    const container = document.getElementById('suiteCards');
    if (!container) return;

    const suites = loadData(StorageKeys.TEST_SUITES) || [];
    const testCases = loadData(StorageKeys.TEST_CASES) || [];
    const projects = loadData(StorageKeys.PROJECTS) || [];
    const projectMap = {};
    projects.forEach(p => projectMap[p.id] = p.name);

    if (suites.length === 0) {
        container.innerHTML = '<div class="col-12"><div class="empty-state"><i class="fas fa-layer-group"></i><h5>No Test Suites</h5><p>Create a test suite to organize your test cases.</p></div></div>';
        return;
    }

    container.innerHTML = suites.map(suite => {
        const suiteTCs = testCases.filter(tc => suite.testCaseIds && suite.testCaseIds.includes(tc.id));
        const total = suiteTCs.length;
        const passed = suiteTCs.filter(tc => tc.status === 'Passed').length;
        const failed = suiteTCs.filter(tc => tc.status === 'Failed').length;
        const blocked = suiteTCs.filter(tc => tc.status === 'Blocked').length;
        const notExec = suiteTCs.filter(tc => tc.status === 'Not Executed').length;
        const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

        const passW = total > 0 ? (passed / total * 100) : 0;
        const failW = total > 0 ? (failed / total * 100) : 0;
        const blockW = total > 0 ? (blocked / total * 100) : 0;
        const neW = total > 0 ? (notExec / total * 100) : 0;

        return `
        <div class="col-md-6 col-lg-4">
            <div class="project-card slide-up">
                <div class="project-header">
                    <div>
                        <h5>${escapeHTML(suite.name)}</h5>
                        <span style="font-size:11px;color:var(--text-muted);">${escapeHTML(suite.id)} • ${escapeHTML(projectMap[suite.project] || suite.project)}</span>
                    </div>
                    ${getStatusBadge(suite.status || 'Active')}
                </div>
                <p class="project-desc">${escapeHTML(suite.description || 'No description')}</p>
                <div class="project-meta">
                    <span><i class="fas fa-list"></i> ${total} Tests</span>
                    <span><i class="fas fa-check"></i> ${passed} Passed</span>
                    <span><i class="fas fa-times"></i> ${failed} Failed</span>
                </div>
                <div style="margin-bottom:12px;">
                    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
                        <span style="color:var(--text-secondary);">Pass Rate</span>
                        <span style="font-weight:600;color:${passRate >= 80 ? 'var(--success)' : passRate >= 50 ? 'var(--warning)' : 'var(--danger)'};">${passRate}%</span>
                    </div>
                    <div class="suite-progress" style="display:flex;gap:2px;height:8px;border-radius:4px;overflow:hidden;background:var(--gray-lightest);">
                        <div style="width:${passW}%;background:var(--success);border-radius:4px;"></div>
                        <div style="width:${failW}%;background:var(--danger);border-radius:4px;"></div>
                        <div style="width:${blockW}%;background:var(--warning);border-radius:4px;"></div>
                        <div style="width:${neW}%;background:var(--info);border-radius:4px;"></div>
                    </div>
                    <div style="display:flex;gap:12px;margin-top:4px;font-size:10px;color:var(--text-muted);">
                        <span>🟢 Passed</span><span>🔴 Failed</span><span>🟡 Blocked</span><span>🔵 Not Exec</span>
                    </div>
                </div>
                <div class="project-footer">
                    <span style="font-size:12px;color:var(--text-muted);"><i class="fas fa-user"></i> ${escapeHTML(suite.createdBy || 'Unknown')}</span>
                    <div class="action-btns">
                        <button class="btn-icon view" onclick="viewSuite('${suite.id}')" title="View"><i class="fas fa-eye"></i></button>
                        <button class="btn-icon edit" onclick="editSuite('${suite.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon execute" onclick="executeSuite('${suite.id}')" title="Execute All"><i class="fas fa-play"></i></button>
                        <button class="btn-icon delete" onclick="deleteSuite('${suite.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

function openSuiteModal(suiteId) {
    const modal = new bootstrap.Modal(document.getElementById('suiteModal'));
    const title = document.getElementById('suiteModalTitle');
    resetForm('suiteForm');

    // Populate project select
    const projects = loadData(StorageKeys.PROJECTS) || [];
    const projectSelect = document.getElementById('suiteProject');
    projectSelect.innerHTML = '<option value="">Select Project</option>';
    projects.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        projectSelect.appendChild(opt);
    });

    // Populate test cases checkboxes
    const testCases = loadData(StorageKeys.TEST_CASES) || [];
    const tcList = document.getElementById('suiteTestCasesList');
    let selectedIds = [];

    if (suiteId) {
        const suite = getById(StorageKeys.TEST_SUITES, suiteId);
        if (!suite) return;
        title.textContent = 'Edit Test Suite';
        document.getElementById('suiteId').value = suite.id;
        document.getElementById('suiteName').value = suite.name;
        document.getElementById('suiteProject').value = suite.project || '';
        document.getElementById('suiteDesc').value = suite.description || '';
        selectedIds = suite.testCaseIds || [];
    } else {
        title.textContent = 'New Test Suite';
        document.getElementById('suiteId').value = '';
    }

    tcList.innerHTML = testCases.length > 0 ? testCases.map(tc => `
        <div class="form-check mb-2">
            <input class="form-check-input" type="checkbox" value="${tc.id}" id="stc_${tc.id}" ${selectedIds.includes(tc.id) ? 'checked' : ''}>
            <label class="form-check-label" for="stc_${tc.id}" style="font-size:13px;">
                <strong>${escapeHTML(tc.id)}</strong> - ${escapeHTML(tc.title)} 
                <span style="color:var(--text-muted);font-size:11px;">[${escapeHTML(tc.status)}]</span>
            </label>
        </div>
    `).join('') : '<p style="color:var(--text-muted);font-size:13px;">No test cases available. Create test cases first.</p>';

    modal.show();
}

function saveSuite() {
    const errors = validateForm('suiteForm');
    if (errors.length > 0) {
        showToast(errors[0], 'danger');
        return;
    }

    const id = document.getElementById('suiteId').value;
    const selectedTCs = [];
    document.querySelectorAll('#suiteTestCasesList .form-check-input:checked').forEach(cb => {
        selectedTCs.push(cb.value);
    });

    const currentUser = getCurrentUser();
    const suiteData = {
        name: document.getElementById('suiteName').value.trim(),
        project: document.getElementById('suiteProject').value,
        description: document.getElementById('suiteDesc').value.trim(),
        testCaseIds: selectedTCs,
        status: 'Active'
    };

    if (id) {
        updateData(StorageKeys.TEST_SUITES, id, suiteData);
        addActivity('Test suite updated', 'Test Suites', `${suiteData.name} updated`);
        showToast('Test suite updated successfully', 'success');
    } else {
        suiteData.id = generateID('TS');
        suiteData.createdBy = currentUser ? currentUser.name : 'Unknown';
        suiteData.createdDate = new Date().toISOString();
        addRecord(StorageKeys.TEST_SUITES, suiteData);
        addActivity('Test Suite created', 'Test Suites', `${suiteData.id} - ${suiteData.name}`);
        showToast('Test suite created successfully', 'success');
    }

    bootstrap.Modal.getInstance(document.getElementById('suiteModal')).hide();
    renderSuites();
}

function editSuite(id) {
    openSuiteModal(id);
}

function deleteSuite(id) {
    const suite = getById(StorageKeys.TEST_SUITES, id);
    if (!suite) return;
    showConfirm('Delete Test Suite', `Are you sure you want to delete "${suite.name}"?`, () => {
        deleteData(StorageKeys.TEST_SUITES, id);
        addActivity('Test suite deleted', 'Test Suites', `${suite.name}`);
        showToast('Test suite deleted successfully', 'success');
        renderSuites();
    });
}

function viewSuite(id) {
    const suite = getById(StorageKeys.TEST_SUITES, id);
    if (!suite) return;

    const testCases = loadData(StorageKeys.TEST_CASES) || [];
    const suiteTCs = testCases.filter(tc => suite.testCaseIds && suite.testCaseIds.includes(tc.id));
    const projects = loadData(StorageKeys.PROJECTS) || [];
    const project = projects.find(p => p.id === suite.project);

    const body = document.getElementById('viewSuiteBody');
    body.innerHTML = `
        <div class="detail-grid mb-4">
            <div class="detail-item"><label>Suite ID</label><span style="font-weight:700;color:var(--primary);">${escapeHTML(suite.id)}</span></div>
            <div class="detail-item"><label>Status</label>${getStatusBadge(suite.status || 'Active')}</div>
            <div class="detail-item detail-full"><label>Suite Name</label><span style="font-size:17px;font-weight:600;">${escapeHTML(suite.name)}</span></div>
            <div class="detail-item"><label>Project</label><span>${escapeHTML(project ? project.name : suite.project)}</span></div>
            <div class="detail-item"><label>Created By</label><span>${escapeHTML(suite.createdBy || 'Unknown')}</span></div>
            <div class="detail-item detail-full"><label>Description</label><p>${escapeHTML(suite.description || 'N/A')}</p></div>
        </div>
        <h6 style="font-weight:600;margin-bottom:12px;"><i class="fas fa-list" style="color:var(--primary);margin-right:8px;"></i>Test Cases (${suiteTCs.length})</h6>
        <div class="table-responsive">
            <table class="table">
                <thead><tr><th>ID</th><th>Title</th><th>Priority</th><th>Status</th></tr></thead>
                <tbody>
                    ${suiteTCs.map(tc => `
                        <tr>
                            <td><strong style="color:var(--primary);">${escapeHTML(tc.id)}</strong></td>
                            <td>${escapeHTML(tc.title)}</td>
                            <td>${getPriorityBadge(tc.priority)}</td>
                            <td>${getStatusBadge(tc.status)}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">No test cases in this suite</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
    new bootstrap.Modal(document.getElementById('viewSuiteModal')).show();
}

function executeSuite(id) {
    const suite = getById(StorageKeys.TEST_SUITES, id);
    if (!suite || !suite.testCaseIds || suite.testCaseIds.length === 0) {
        showToast('No test cases in this suite to execute', 'warning');
        return;
    }
    // Navigate to execution page with suite context
    window.location.href = `test-execution.html?tc=${suite.testCaseIds[0]}`;
}
