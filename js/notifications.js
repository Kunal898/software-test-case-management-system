/* =============================================
   Notifications Module
   ============================================= */

/**
 * Load and display notifications
 */
function loadNotifications() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const notifications = loadData(StorageKeys.NOTIFICATIONS) || [];
    const userNotifs = notifications.filter(n => 
        n.targetUser === 'all' || n.targetUser === currentUser.username || n.targetUser === currentUser.id
    );

    const unreadCount = userNotifs.filter(n => !n.read).length;
    const countEl = document.getElementById('notificationCount');
    if (countEl) {
        countEl.textContent = unreadCount;
        countEl.style.display = unreadCount > 0 ? 'flex' : 'none';
    }

    const listEl = document.getElementById('notificationList');
    if (!listEl) return;

    if (userNotifs.length === 0) {
        listEl.innerHTML = `
            <div class="notification-empty">
                <i class="fas fa-bell-slash"></i>
                <p>No notifications</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = userNotifs.slice(0, 20).map(n => {
        const iconMap = {
            'info': { icon: 'fa-info-circle', bg: 'var(--primary-bg)', color: 'var(--primary)' },
            'success': { icon: 'fa-check-circle', bg: 'var(--success-bg)', color: 'var(--success)' },
            'warning': { icon: 'fa-exclamation-triangle', bg: 'var(--warning-bg)', color: 'var(--warning)' },
            'danger': { icon: 'fa-exclamation-circle', bg: 'var(--danger-bg)', color: 'var(--danger)' },
            'bug': { icon: 'fa-bug', bg: 'var(--danger-bg)', color: 'var(--danger)' },
            'test': { icon: 'fa-flask', bg: 'var(--info-bg)', color: 'var(--info)' },
            'project': { icon: 'fa-folder', bg: 'var(--purple-bg)', color: 'var(--purple)' }
        };
        const style = iconMap[n.type] || iconMap['info'];

        return `
            <div class="notification-item ${n.read ? '' : 'unread'}" data-id="${escapeHTML(n.id)}">
                <div class="notif-icon" style="background:${style.bg};color:${style.color};">
                    <i class="fas ${style.icon}"></i>
                </div>
                <div class="notif-content">
                    <p>${escapeHTML(n.message)}</p>
                    <span class="notif-time">${timeAgo(n.date)}</span>
                </div>
            </div>
        `;
    }).join('');

    // Mark as read on click
    listEl.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;
            markNotificationRead(id);
            item.classList.remove('unread');
            loadNotifications();
        });
    });
}

/**
 * Mark notification as read
 */
function markNotificationRead(id) {
    const notifications = loadData(StorageKeys.NOTIFICATIONS) || [];
    const notif = notifications.find(n => n.id === id);
    if (notif) {
        notif.read = true;
        saveData(StorageKeys.NOTIFICATIONS, notifications);
    }
}

/**
 * Mark all notifications as read
 */
function markAllNotificationsRead() {
    const notifications = loadData(StorageKeys.NOTIFICATIONS) || [];
    notifications.forEach(n => n.read = true);
    saveData(StorageKeys.NOTIFICATIONS, notifications);
    loadNotifications();
    showToast('All notifications marked as read', 'info');
}

/**
 * Toggle notification dropdown
 */
function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
        if (dropdown.classList.contains('show')) {
            loadNotifications();
        }
    }
}

/**
 * Close notification dropdown on outside click
 */
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notificationDropdown');
    const btn = document.getElementById('notificationBtn');
    if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});
