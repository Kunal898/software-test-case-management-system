/* =============================================
   Bug Tracking Module
   ============================================= */

let bugCurrentPage = 1;
const BUG_PER_PAGE = 10;

document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) return;
    populateBugSelects();
    renderBugs();
    checkPrefillBug();
});

function checkPrefillBug() {
    const prefill = sessionStorage.getItem('prefillBug');
    if (prefill) {
        sessionStorage.removeItem('prefillBug');
        try {
            const data = JSON.parse(prefill);
            setTimeout(() => {
                openBugModal();
                if (data.title) document.getElementById('bugTitle').value = data.title;
                if (data.project) document.getElementById('bugProject').value = data.project;
                if (data.module) document.getElementById('bugModule').value = data.module;
                if (data.relatedTestCase) document.getElementById('bugRelatedTC').value = data.relatedTestCase;
                if (data.stepsToReproduce) document.getElementById('bugSteps').value = data.stepsToReproduce;
                if (data.expectedResult) document.getElementById('bugExpected').value = data.expectedResult;
                if (data.actualResult) document.getElementById('bugActual').value = data.actualResult;
                if (data.description) document.getElementById('bugDescription').value = data.description || `Bug reported from failed test case ${data.relatedTestCase}.`;
                else document.getElementById('bugDescription').value = `Bug reported from failed test case ${data.relatedTestCase || ''}.`;
            }, 300);
        } catch (e) { /* ignore */ }
    }
}

function populateBugSelects() {
    const projects = loadData(StorageKeys.PROJECTS) || [];
    const users = loadData(StorageKeys.USERS) || [];
    const testCases = loadData(StorageKeys.TEST_CASES) || [];

    const projectSelect = document.getElementById('bugProject');
    if (projectSelect) {
        projectSelect.innerHTML = '<option value="">Select Project</option>';
        projects.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            projectSelect.appendChild(opt);
        });
    }

    const tcSelect = document.getElementById('bugRelatedTC');
    if (tcSelect) {
        tcSelect.innerHTML = '<option value="">None</option>';
        testCases.forEach(tc => {
            const opt = document.createElement('option');
            opt.value = tc.id;
            opt.textContent = `${tc.id} - ${tc.title}`;
            tcSelect.appendChild(opt);
        });
    }

    const assignSelect = document.getElementById('bugAssignedTo');
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

function renderBugs() {
    const tbody = document.getElementById('bugTableBody');
    if (!tbody) return;

    let bugs = loadData(StorageKeys.BUGS) || [];
    const search = (document.getElementById('bugSearch')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('bugStatusFilter')?.value || '';
    const severityFilter = document.getElementById('bugSeverityFilter')?.value || '';
    const priorityFilter = document.getElementById('bugPriorityFilter')?.value || '';

    if (search) {
        bugs = bugs.filter(b =>
            b.id.toLowerCase().includes(search) ||
            b.title.toLowerCase().includes(search) ||
            (b.module && b.module.toLowerCase().includes(search)) ||
            (b.assignedTo && b.assignedTo.toLowerCase().includes(search))
        );
    }
    if (statusFilter) bugs = bugs.filter(b => b.status === statusFilter);
    if (severityFilter) bugs = bugs.filter(b => b.severity === severityFilter);
    if (priorityFilter) bugs = bugs.filter(b => b.priority === priorityFilter);

    const paginationData = paginate(bugs, bugCurrentPage, BUG_PER_PAGE);
    const projects = loadData(StorageKeys.PROJECTS) || [];
    const projectMap = {};
    projects.forEach(p => projectMap[p.id] = p.name);

    if (paginationData.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9"><div class="empty-state"><i class="fas fa-bug"></i><h5>No Bugs Found</h5><p>No bugs match your search criteria.</p></div></td></tr>';
        document.getElementById('bugPagination').innerHTML = '';
        return;
    }

    tbody.innerHTML = paginationData.data.map(bug => `
        <tr>
            <td><strong style="color:var(--danger);">${escapeHTML(bug.id)}</strong></td>
            <td style="max-width:200px;">${escapeHTML(truncateText(bug.title, 35))}</td>
            <td style="font-size:12px;">${escapeHTML(projectMap[bug.project] || bug.project)}</td>
            <td>${getStatusBadge(bug.severity)}</td>
            <td>${getPriorityBadge(bug.priority)}</td>
            <td>${escapeHTML(bug.assignedTo || 'Unassigned')}</td>
            <td>${getStatusBadge(bug.status)}</td>
            <td style="font-size:12px;color:var(--text-muted);">${formatDate(bug.updatedDate || bug.createdDate)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon view" onclick="viewBug('${bug.id}')" title="View"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon edit" onclick="editBug('${bug.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete" onclick="deleteBug('${bug.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');

    renderPagination(paginationData, 'bugPagination', (page) => {
        bugCurrentPage = page;
        renderBugs();
    });
}

function openBugModal(bugId) {
    const modal = new bootstrap.Modal(document.getElementById('bugModal'));
    const title = document.getElementById('bugModalTitle');
    resetForm('bugForm');
    populateBugSelects();

    if (bugId) {
        const bug = getById(StorageKeys.BUGS, bugId);
        if (!bug) return;
        title.textContent = 'Edit Bug';
        document.getElementById('bugId').value = bug.id;
        document.getElementById('bugTitle').value = bug.title || '';
        document.getElementById('bugProject').value = bug.project || '';
        document.getElementById('bugDescription').value = bug.description || '';
        document.getElementById('bugModule').value = bug.module || '';
        document.getElementById('bugRelatedTC').value = bug.relatedTestCase || '';
        document.getElementById('bugSteps').value = bug.stepsToReproduce || '';
        document.getElementById('bugExpected').value = bug.expectedResult || '';
        document.getElementById('bugActual').value = bug.actualResult || '';
        document.getElementById('bugSeverity').value = bug.severity || 'Major';
        document.getElementById('bugPriority').value = bug.priority || 'Medium';
        document.getElementById('bugEnvironment').value = bug.environment || '';
        document.getElementById('bugBrowser').value = bug.browser || '';
        document.getElementById('bugOS').value = bug.operatingSystem || '';
        document.getElementById('bugAssignedTo').value = bug.assignedTo || '';
        document.getElementById('bugStatus').value = bug.status || 'Open';
        document.getElementById('bugDevComments').value = bug.developerComments || '';
    } else {
        title.textContent = 'Report Bug';
        document.getElementById('bugId').value = '';
    }
    modal.show();
}

function saveBug() {
    const errors = validateForm('bugForm');
    if (errors.length > 0) {
        showToast(errors[0], 'danger');
        return;
    }

    const id = document.getElementById('bugId').value;
    const currentUser = getCurrentUser();
    const bugData = {
        title: document.getElementById('bugTitle').value.trim(),
        project: document.getElementById('bugProject').value,
        description: document.getElementById('bugDescription').value.trim(),
        module: document.getElementById('bugModule').value.trim(),
        relatedTestCase: document.getElementById('bugRelatedTC').value,
        stepsToReproduce: document.getElementById('bugSteps').value.trim(),
        expectedResult: document.getElementById('bugExpected').value.trim(),
        actualResult: document.getElementById('bugActual').value.trim(),
        severity: document.getElementById('bugSeverity').value,
        priority: document.getElementById('bugPriority').value,
        environment: document.getElementById('bugEnvironment').value.trim(),
        browser: document.getElementById('bugBrowser').value.trim(),
        operatingSystem: document.getElementById('bugOS').value.trim(),
        assignedTo: document.getElementById('bugAssignedTo').value,
        status: document.getElementById('bugStatus').value,
        developerComments: document.getElementById('bugDevComments').value.trim(),
        updatedDate: new Date().toISOString()
    };

    if (id) {
        const oldBug = getById(StorageKeys.BUGS, id);
        updateData(StorageKeys.BUGS, id, bugData);
        addActivity('Bug updated', 'Bug Tracking', `${id} - ${bugData.title}`);
        if (oldBug && oldBug.status !== bugData.status) {
            addNotification(`${id} status changed to ${bugData.status}.`, 'bug', 'all');
            addActivity(`Bug status changed to ${bugData.status}`, 'Bug Tracking', `${id}`);
        }
        showToast('Bug updated successfully', 'success');
    } else {
        bugData.id = generateID('BUG');
        bugData.reportedBy = currentUser ? currentUser.name : 'Unknown';
        bugData.createdDate = new Date().toISOString();
        addRecord(StorageKeys.BUGS, bugData);
        addActivity('Bug reported', 'Bug Tracking', `${bugData.id} - ${bugData.title}`);
        addNotification(`New bug ${bugData.id} reported: ${bugData.title}`, 'bug', 'all');
        if (bugData.assignedTo) {
            addNotification(`Bug ${bugData.id} has been assigned to you.`, 'bug', bugData.assignedTo);
        }
        showToast('Bug reported successfully', 'success');
    }

    bootstrap.Modal.getInstance(document.getElementById('bugModal')).hide();
    renderBugs();
}

function editBug(id) {
    openBugModal(id);
}

function deleteBug(id) {
    const bug = getById(StorageKeys.BUGS, id);
    if (!bug) return;
    showConfirm('Delete Bug', `Are you sure you want to delete "${bug.id} - ${bug.title}"?`, () => {
        deleteData(StorageKeys.BUGS, id);
        addActivity('Bug deleted', 'Bug Tracking', `${bug.id} - ${bug.title}`);
        showToast('Bug deleted successfully', 'success');
        renderBugs();
    });
}

function viewBug(id) {
    const bug = getById(StorageKeys.BUGS, id);
    if (!bug) return;

    const projects = loadData(StorageKeys.PROJECTS) || [];
    const project = projects.find(p => p.id === bug.project);

    const statusFlow = ['Open', 'Assigned', 'In Progress', 'Fixed', 'Retest', 'Closed'];
    const statusFlowHTML = statusFlow.map(s =>
        `<span class="flow-item ${s === bug.status ? 'current' : ''}">${s}</span>`
    ).join('<span class="flow-arrow"><i class="fas fa-arrow-right"></i></span>');

    const steps = (bug.stepsToReproduce || '').split('\n').filter(s => s.trim());

    const body = document.getElementById('viewBugBody');
    body.innerHTML = `
        <div style="margin-bottom:20px;">
            <p style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Bug Lifecycle</p>
            <div class="status-flow">${statusFlowHTML}</div>
        </div>
        <div class="detail-grid">
            <div class="detail-item"><label>Bug ID</label><span style="font-weight:700;color:var(--danger);">${escapeHTML(bug.id)}</span></div>
            <div class="detail-item"><label>Status</label>${getStatusBadge(bug.status)}</div>
            <div class="detail-item detail-full"><label>Title</label><span style="font-size:17px;font-weight:600;">${escapeHTML(bug.title)}</span></div>
            <div class="detail-item detail-full"><label>Description</label><p>${escapeHTML(bug.description)}</p></div>
            <div class="detail-item"><label>Project</label><span>${escapeHTML(project ? project.name : bug.project)}</span></div>
            <div class="detail-item"><label>Module</label><span>${escapeHTML(bug.module || 'N/A')}</span></div>
            <div class="detail-item"><label>Related Test Case</label><span style="color:var(--primary);">${escapeHTML(bug.relatedTestCase || 'None')}</span></div>
            <div class="detail-item"><label>Severity</label>${getStatusBadge(bug.severity)}</div>
            <div class="detail-item"><label>Priority</label>${getPriorityBadge(bug.priority)}</div>
            <div class="detail-item"><label>Environment</label><span>${escapeHTML(bug.environment || 'N/A')}</span></div>
            <div class="detail-item"><label>Browser</label><span>${escapeHTML(bug.browser || 'N/A')}</span></div>
            <div class="detail-item"><label>Operating System</label><span>${escapeHTML(bug.operatingSystem || 'N/A')}</span></div>
            <div class="detail-item detail-full">
                <label>Steps to Reproduce</label>
                <ol class="steps-list">${steps.map(s => `<li>${escapeHTML(s.replace(/^\d+\.\s*/, ''))}</li>`).join('')}</ol>
            </div>
            <div class="detail-item"><label>Expected Result</label><p>${escapeHTML(bug.expectedResult || 'N/A')}</p></div>
            <div class="detail-item"><label>Actual Result</label><p>${escapeHTML(bug.actualResult || 'N/A')}</p></div>
            <div class="detail-item"><label>Reported By</label><span>${escapeHTML(bug.reportedBy || 'N/A')}</span></div>
            <div class="detail-item"><label>Assigned To</label><span>${escapeHTML(bug.assignedTo || 'Unassigned')}</span></div>
            <div class="detail-item"><label>Created Date</label><span>${formatDate(bug.createdDate)}</span></div>
            <div class="detail-item"><label>Updated Date</label><span>${formatDate(bug.updatedDate)}</span></div>
            <div class="detail-item detail-full"><label>Developer Comments</label><p>${escapeHTML(bug.developerComments || 'No comments yet')}</p></div>
        </div>
    `;
    new bootstrap.Modal(document.getElementById('viewBugModal')).show();
}

function exportBugsCSV() {
    const bugs = loadData(StorageKeys.BUGS) || [];
    const projects = loadData(StorageKeys.PROJECTS) || [];
    const projectMap = {};
    projects.forEach(p => projectMap[p.id] = p.name);

    const exportData = bugs.map(b => ({
        'Bug ID': b.id,
        'Title': b.title,
        'Project': projectMap[b.project] || b.project,
        'Module': b.module,
        'Severity': b.severity,
        'Priority': b.priority,
        'Status': b.status,
        'Assigned To': b.assignedTo,
        'Reported By': b.reportedBy,
        'Related Test Case': b.relatedTestCase,
        'Created Date': formatDate(b.createdDate),
        'Description': b.description
    }));
    exportToCSV(exportData, 'bugs_export');
}
