/* =============================================
   Projects Module
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) return;
    populateProjectManagerSelect();
    renderProjects();
});

function populateProjectManagerSelect() {
    const users = loadData(StorageKeys.USERS) || [];
    const select = document.getElementById('projectManager');
    if (!select) return;
    const managers = users.filter(u => u.role === 'Admin' || u.role === 'Project Manager');
    select.innerHTML = '<option value="">Select Manager</option>';
    users.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.name;
        opt.textContent = `${u.name} (${u.role})`;
        select.appendChild(opt);
    });
}

function renderProjects() {
    const container = document.getElementById('projectCards');
    if (!container) return;

    let projects = loadData(StorageKeys.PROJECTS) || [];
    const search = (document.getElementById('projectSearch')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('projectStatusFilter')?.value || '';

    if (search) {
        projects = projects.filter(p =>
            p.name.toLowerCase().includes(search) ||
            p.id.toLowerCase().includes(search) ||
            (p.description && p.description.toLowerCase().includes(search))
        );
    }
    if (statusFilter) {
        projects = projects.filter(p => p.status === statusFilter);
    }

    if (projects.length === 0) {
        container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-folder-open"></i><h5>No Projects Found</h5><p>Create a new project to get started with test management.</p></div>`;
        return;
    }

    const testCases = loadData(StorageKeys.TEST_CASES) || [];
    const bugs = loadData(StorageKeys.BUGS) || [];

    container.innerHTML = projects.map(p => {
        const tcCount = testCases.filter(tc => tc.project === p.id).length;
        const bugCount = bugs.filter(b => b.project === p.id).length;
        const passedCount = testCases.filter(tc => tc.project === p.id && tc.status === 'Passed').length;
        const progress = tcCount > 0 ? Math.round((passedCount / tcCount) * 100) : 0;

        return `
        <div class="project-card slide-up">
            <div class="project-header">
                <div>
                    <h5>${escapeHTML(p.name)}</h5>
                    <span style="font-size:11px;color:var(--text-muted);">${escapeHTML(p.id)} • v${escapeHTML(p.version || '1.0')}</span>
                </div>
                ${getStatusBadge(p.status)}
            </div>
            <p class="project-desc">${escapeHTML(p.description)}</p>
            <div class="project-meta">
                <span><i class="fas fa-list"></i> ${tcCount} Tests</span>
                <span><i class="fas fa-bug"></i> ${bugCount} Bugs</span>
                <span><i class="fas fa-calendar"></i> ${formatDate(p.startDate)}</span>
            </div>
            <div style="margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
                    <span style="color:var(--text-secondary);">Progress</span>
                    <span style="font-weight:600;">${progress}%</span>
                </div>
                <div class="progress"><div class="progress-bar bg-success" style="width:${progress}%"></div></div>
            </div>
            <div class="project-footer">
                <span style="font-size:12px;color:var(--text-muted);"><i class="fas fa-user"></i> ${escapeHTML(p.projectManager || 'Unassigned')}</span>
                <div class="action-btns">
                    <button class="btn-icon view" onclick="viewProject('${p.id}')" title="View"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon edit" onclick="editProject('${p.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete" onclick="deleteProject('${p.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        </div>`;
    }).join('');
}

function openProjectModal(projectId) {
    const modal = new bootstrap.Modal(document.getElementById('projectModal'));
    const title = document.getElementById('projectModalTitle');
    resetForm('projectForm');

    if (projectId) {
        const project = getById(StorageKeys.PROJECTS, projectId);
        if (!project) return;
        title.textContent = 'Edit Project';
        document.getElementById('projectId').value = project.id;
        document.getElementById('projectName').value = project.name;
        document.getElementById('projectVersion').value = project.version || '';
        document.getElementById('projectDesc').value = project.description || '';
        document.getElementById('projectStartDate').value = project.startDate || '';
        document.getElementById('projectEndDate').value = project.endDate || '';
        document.getElementById('projectManager').value = project.projectManager || '';
        document.getElementById('projectStatus').value = project.status || 'Planning';
    } else {
        title.textContent = 'Add Project';
        document.getElementById('projectId').value = '';
        document.getElementById('projectStartDate').value = getTodayDate();
    }
    modal.show();
}

function saveProject() {
    const errors = validateForm('projectForm');
    if (errors.length > 0) {
        showToast(errors[0], 'danger');
        return;
    }

    const startDate = document.getElementById('projectStartDate').value;
    const endDate = document.getElementById('projectEndDate').value;
    if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
        showToast('End date must be after start date', 'danger');
        return;
    }

    const id = document.getElementById('projectId').value;
    const projectData = {
        name: document.getElementById('projectName').value.trim(),
        version: document.getElementById('projectVersion').value.trim(),
        description: document.getElementById('projectDesc').value.trim(),
        startDate: startDate,
        endDate: endDate,
        projectManager: document.getElementById('projectManager').value,
        status: document.getElementById('projectStatus').value
    };

    if (id) {
        updateData(StorageKeys.PROJECTS, id, projectData);
        addActivity('Project updated', 'Projects', `${projectData.name} updated`);
        showToast('Project updated successfully', 'success');
    } else {
        projectData.id = generateID('PRJ');
        projectData.createdDate = new Date().toISOString();
        addRecord(StorageKeys.PROJECTS, projectData);
        addActivity('Project created', 'Projects', `${projectData.name} created`);
        addNotification(`New project "${projectData.name}" has been created.`, 'project', 'all');
        showToast('Project created successfully', 'success');
    }

    bootstrap.Modal.getInstance(document.getElementById('projectModal')).hide();
    renderProjects();
}

function editProject(id) {
    populateProjectManagerSelect();
    openProjectModal(id);
}

function deleteProject(id) {
    const project = getById(StorageKeys.PROJECTS, id);
    if (!project) return;
    showConfirm('Delete Project', `Are you sure you want to delete "${project.name}"? This action cannot be undone.`, () => {
        deleteData(StorageKeys.PROJECTS, id);
        addActivity('Project deleted', 'Projects', `${project.name} deleted`);
        showToast('Project deleted successfully', 'success');
        renderProjects();
    });
}

function viewProject(id) {
    const project = getById(StorageKeys.PROJECTS, id);
    if (!project) return;

    const testCases = (loadData(StorageKeys.TEST_CASES) || []).filter(tc => tc.project === id);
    const bugs = (loadData(StorageKeys.BUGS) || []).filter(b => b.project === id);
    const passed = testCases.filter(tc => tc.status === 'Passed').length;
    const failed = testCases.filter(tc => tc.status === 'Failed').length;

    const body = document.getElementById('viewProjectBody');
    body.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item"><label>Project ID</label><span>${escapeHTML(project.id)}</span></div>
            <div class="detail-item"><label>Version</label><span>${escapeHTML(project.version || 'N/A')}</span></div>
            <div class="detail-item detail-full"><label>Project Name</label><span style="font-size:18px;font-weight:600;">${escapeHTML(project.name)}</span></div>
            <div class="detail-item detail-full"><label>Description</label><p>${escapeHTML(project.description)}</p></div>
            <div class="detail-item"><label>Start Date</label><span>${formatDate(project.startDate)}</span></div>
            <div class="detail-item"><label>End Date</label><span>${formatDate(project.endDate)}</span></div>
            <div class="detail-item"><label>Project Manager</label><span>${escapeHTML(project.projectManager || 'Unassigned')}</span></div>
            <div class="detail-item"><label>Status</label>${getStatusBadge(project.status)}</div>
            <div class="detail-item"><label>Total Test Cases</label><span>${testCases.length}</span></div>
            <div class="detail-item"><label>Total Bugs</label><span>${bugs.length}</span></div>
            <div class="detail-item"><label>Passed / Failed</label><span style="color:var(--success);font-weight:600;">${passed}</span> / <span style="color:var(--danger);font-weight:600;">${failed}</span></div>
            <div class="detail-item"><label>Created Date</label><span>${formatDate(project.createdDate)}</span></div>
        </div>
    `;
    new bootstrap.Modal(document.getElementById('viewProjectModal')).show();
}
