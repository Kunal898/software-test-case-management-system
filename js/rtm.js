/* =============================================
   Requirement Traceability Matrix Module
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) return;
    renderRTM();
});

function renderRTM() {
    renderRTMStats();
    renderRTMTable();
}

function renderRTMStats() {
    const container = document.getElementById('rtmStats');
    if (!container) return;

    const requirements = loadData(StorageKeys.REQUIREMENTS) || [];
    const total = requirements.length;
    const covered = requirements.filter(r => r.status === 'Covered').length;
    const partial = requirements.filter(r => r.status === 'Partially Covered').length;
    const notTested = requirements.filter(r => r.status === 'Not Tested').length;
    const blocked = requirements.filter(r => r.status === 'Blocked').length;
    const coveragePercent = total > 0 ? Math.round(((covered + partial * 0.5) / total) * 100) : 0;

    container.innerHTML = `
        <div class="stat-card"><div class="stat-info"><h3>${total}</h3><p>Total Requirements</p></div><div class="stat-icon primary"><i class="fas fa-clipboard-list"></i></div></div>
        <div class="stat-card"><div class="stat-info"><h3>${covered}</h3><p>Fully Covered</p></div><div class="stat-icon success"><i class="fas fa-check-double"></i></div></div>
        <div class="stat-card"><div class="stat-info"><h3>${partial}</h3><p>Partially Covered</p></div><div class="stat-icon warning"><i class="fas fa-exclamation"></i></div></div>
        <div class="stat-card"><div class="stat-info"><h3>${coveragePercent}%</h3><p>Req. Coverage</p></div><div class="stat-icon info"><i class="fas fa-chart-pie"></i></div></div>
    `;
}

function renderRTMTable() {
    const tbody = document.getElementById('rtmTableBody');
    if (!tbody) return;

    const requirements = loadData(StorageKeys.REQUIREMENTS) || [];
    const testCases = loadData(StorageKeys.TEST_CASES) || [];
    const bugs = loadData(StorageKeys.BUGS) || [];

    if (requirements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><i class="fas fa-project-diagram"></i><h5>No Requirements</h5><p>Add requirements to build your traceability matrix.</p></div></td></tr>';
        return;
    }

    tbody.innerHTML = requirements.map(req => {
        const linkedTCs = testCases.filter(tc => req.testCaseIds && req.testCaseIds.includes(tc.id));
        const tcStatuses = linkedTCs.map(tc => tc.status);
        const relatedBugs = bugs.filter(b => linkedTCs.some(tc => b.relatedTestCase === tc.id));

        // Auto-calculate status
        let calcStatus = req.status;
        if (linkedTCs.length === 0) {
            calcStatus = 'Not Tested';
        } else if (linkedTCs.every(tc => tc.status === 'Passed')) {
            calcStatus = 'Covered';
        } else if (linkedTCs.some(tc => tc.status === 'Blocked')) {
            calcStatus = 'Blocked';
        } else if (linkedTCs.some(tc => tc.status === 'Passed')) {
            calcStatus = 'Partially Covered';
        }

        return `
        <tr>
            <td><strong style="color:var(--primary);">${escapeHTML(req.id)}</strong></td>
            <td>${escapeHTML(req.description)}</td>
            <td>${linkedTCs.map(tc => `<span style="display:inline-block;background:var(--primary-bg);color:var(--primary);padding:2px 6px;border-radius:4px;font-size:11px;margin:2px;">${escapeHTML(tc.id)}</span>`).join(' ') || '<span style="color:var(--text-muted);font-size:12px;">None</span>'}</td>
            <td>${linkedTCs.map(tc => getStatusBadge(tc.status)).join(' ') || '<span style="color:var(--text-muted);font-size:12px;">N/A</span>'}</td>
            <td>${relatedBugs.map(b => `<span style="display:inline-block;background:var(--danger-bg);color:var(--danger);padding:2px 6px;border-radius:4px;font-size:11px;margin:2px;">${escapeHTML(b.id)}</span>`).join(' ') || '<span style="color:var(--text-muted);font-size:12px;">None</span>'}</td>
            <td>${getStatusBadge(calcStatus)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon edit" onclick="editRequirement('${req.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete" onclick="deleteRequirement('${req.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function openReqModal(reqId) {
    const modal = new bootstrap.Modal(document.getElementById('reqModal'));
    const title = document.getElementById('reqModalTitle');
    resetForm('reqForm');

    const testCases = loadData(StorageKeys.TEST_CASES) || [];
    const tcList = document.getElementById('reqTestCasesList');
    let selectedIds = [];

    if (reqId) {
        const req = getById(StorageKeys.REQUIREMENTS, reqId);
        if (!req) return;
        title.textContent = 'Edit Requirement';
        document.getElementById('reqId').value = req.id;
        document.getElementById('reqDescription').value = req.description;
        document.getElementById('reqStatus').value = req.status || 'Not Tested';
        selectedIds = req.testCaseIds || [];
    } else {
        title.textContent = 'Add Requirement';
        document.getElementById('reqId').value = '';
    }

    tcList.innerHTML = testCases.map(tc => `
        <div class="form-check mb-2">
            <input class="form-check-input" type="checkbox" value="${tc.id}" id="rtc_${tc.id}" ${selectedIds.includes(tc.id) ? 'checked' : ''}>
            <label class="form-check-label" for="rtc_${tc.id}" style="font-size:13px;"><strong>${escapeHTML(tc.id)}</strong> - ${escapeHTML(tc.title)}</label>
        </div>
    `).join('');

    modal.show();
}

function saveRequirement() {
    const errors = validateForm('reqForm');
    if (errors.length > 0) {
        showToast(errors[0], 'danger');
        return;
    }

    const id = document.getElementById('reqId').value;
    const selectedTCs = [];
    document.querySelectorAll('#reqTestCasesList .form-check-input:checked').forEach(cb => selectedTCs.push(cb.value));

    const reqData = {
        description: document.getElementById('reqDescription').value.trim(),
        testCaseIds: selectedTCs,
        status: document.getElementById('reqStatus').value
    };

    if (id) {
        updateData(StorageKeys.REQUIREMENTS, id, reqData);
        showToast('Requirement updated', 'success');
    } else {
        reqData.id = generateID('REQ');
        addRecord(StorageKeys.REQUIREMENTS, reqData);
        showToast('Requirement added', 'success');
    }

    bootstrap.Modal.getInstance(document.getElementById('reqModal')).hide();
    renderRTM();
}

function editRequirement(id) {
    openReqModal(id);
}

function deleteRequirement(id) {
    showConfirm('Delete Requirement', 'Are you sure you want to delete this requirement?', () => {
        deleteData(StorageKeys.REQUIREMENTS, id);
        showToast('Requirement deleted', 'success');
        renderRTM();
    });
}

function exportRTMCSV() {
    const requirements = loadData(StorageKeys.REQUIREMENTS) || [];
    const testCases = loadData(StorageKeys.TEST_CASES) || [];
    const bugs = loadData(StorageKeys.BUGS) || [];

    const exportData = requirements.map(req => {
        const linkedTCs = testCases.filter(tc => req.testCaseIds && req.testCaseIds.includes(tc.id));
        const relatedBugs = bugs.filter(b => linkedTCs.some(tc => b.relatedTestCase === tc.id));
        return {
            'Req ID': req.id,
            'Description': req.description,
            'Test Case IDs': linkedTCs.map(tc => tc.id).join(', '),
            'Test Status': linkedTCs.map(tc => `${tc.id}:${tc.status}`).join(', '),
            'Bug IDs': relatedBugs.map(b => b.id).join(', '),
            'Req Status': req.status
        };
    });
    exportToCSV(exportData, 'rtm_export');
}
