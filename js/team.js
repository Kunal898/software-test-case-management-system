/* =============================================
   Team Management Module
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) return;
    renderTeam();
});

function renderTeam() {
    const tbody = document.getElementById('teamTableBody');
    if (!tbody) return;

    const users = loadData(StorageKeys.USERS) || [];
    const testCases = loadData(StorageKeys.TEST_CASES) || [];
    const bugs = loadData(StorageKeys.BUGS) || [];

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9"><div class="empty-state"><i class="fas fa-users"></i><h5>No Team Members</h5><p>Add team members to get started.</p></div></td></tr>';
        return;
    }

    tbody.innerHTML = users.map(u => {
        const assignedTC = testCases.filter(tc => tc.assignedTo === u.name).length;
        const assignedBugs = bugs.filter(b => b.assignedTo === u.name).length;
        const roleColors = { 'Admin': 'primary', 'Tester': 'success', 'Developer': 'purple', 'Project Manager': 'warning' };
        const roleColor = roleColors[u.role] || 'primary';

        return `
        <tr>
            <td><strong>${escapeHTML(u.id)}</strong></td>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <div class="user-avatar" style="width:32px;height:32px;font-size:12px;background:var(--${roleColor});">${getInitials(u.name)}</div>
                    <span>${escapeHTML(u.name)}</span>
                </div>
            </td>
            <td>${escapeHTML(u.username)}</td>
            <td style="font-size:12px;">${escapeHTML(u.email || '')}</td>
            <td>${getStatusBadge(u.role)}</td>
            <td><span class="badge bg-primary bg-opacity-10 text-primary">${assignedTC}</span></td>
            <td><span class="badge bg-danger bg-opacity-10 text-danger">${assignedBugs}</span></td>
            <td>${getStatusBadge(u.status || 'Active')}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon edit" onclick="editUser('${u.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete" onclick="deleteUser('${u.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function openUserModal(userId) {
    const modal = new bootstrap.Modal(document.getElementById('userModal'));
    const title = document.getElementById('userModalTitle');
    resetForm('userForm');

    if (userId) {
        const user = getById(StorageKeys.USERS, userId);
        if (!user) return;
        title.textContent = 'Edit User';
        document.getElementById('userId').value = user.id;
        document.getElementById('userName').value = user.name;
        document.getElementById('userUsername').value = user.username;
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userPassword').value = user.password || '';
        document.getElementById('userRole').value = user.role;
        document.getElementById('userStatus').value = user.status || 'Active';
    } else {
        title.textContent = 'Add User';
        document.getElementById('userId').value = '';
    }
    modal.show();
}

function saveUser() {
    const errors = validateForm('userForm');
    if (errors.length > 0) {
        showToast(errors[0], 'danger');
        return;
    }

    const id = document.getElementById('userId').value;
    const username = document.getElementById('userUsername').value.trim();
    
    // Check duplicate username
    const users = loadData(StorageKeys.USERS) || [];
    const duplicate = users.find(u => u.username === username && u.id !== id);
    if (duplicate) {
        showToast('Username already exists', 'danger');
        return;
    }

    const userData = {
        name: document.getElementById('userName').value.trim(),
        username: username,
        email: document.getElementById('userEmail').value.trim(),
        password: document.getElementById('userPassword').value,
        role: document.getElementById('userRole').value,
        status: document.getElementById('userStatus').value
    };

    if (id) {
        updateData(StorageKeys.USERS, id, userData);
        addActivity('User updated', 'Team', `${userData.name} updated`);
        showToast('User updated successfully', 'success');
    } else {
        userData.id = generateID('USR');
        userData.createdDate = new Date().toISOString();
        addRecord(StorageKeys.USERS, userData);
        addActivity('User added', 'Team', `${userData.name} (${userData.role}) added`);
        showToast('User added successfully', 'success');
    }

    bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
    renderTeam();
}

function editUser(id) {
    openUserModal(id);
}

function deleteUser(id) {
    const user = getById(StorageKeys.USERS, id);
    if (!user) return;
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === id) {
        showToast('You cannot delete your own account', 'danger');
        return;
    }
    showConfirm('Delete User', `Are you sure you want to delete "${user.name}"?`, () => {
        deleteData(StorageKeys.USERS, id);
        addActivity('User deleted', 'Team', `${user.name} deleted`);
        showToast('User deleted successfully', 'success');
        renderTeam();
    });
}
