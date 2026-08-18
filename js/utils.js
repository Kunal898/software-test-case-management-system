/* =============================================
   Utility Functions
   ============================================= */

/**
 * Escape HTML to prevent XSS
 */
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
}

/**
 * Format date to readable string
 */
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Format date with time
 */
function formatDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
function timeAgo(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + 'm ago';
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + 'h ago';
    const days = Math.floor(hours / 24);
    if (days < 7) return days + 'd ago';
    return formatDate(dateStr);
}

/**
 * Get status badge HTML
 */
function getStatusBadge(status) {
    if (!status) return '';
    const cssClass = status.toLowerCase().replace(/\s+/g, '-');
    return `<span class="badge-status badge-${escapeHTML(cssClass)}">${escapeHTML(status)}</span>`;
}

/**
 * Get priority badge HTML
 */
function getPriorityBadge(priority) {
    return getStatusBadge(priority);
}

/**
 * Show toast notification
 */
function showToast(message, type) {
    type = type || 'success';
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = {
        success: 'fa-check-circle',
        danger: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${escapeHTML(message)}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
        <div class="toast-progress"></div>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }
    }, 3000);
}

/**
 * Show confirmation dialog
 */
function showConfirm(title, message, onConfirm) {
    const existing = document.querySelector('.confirm-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
        <div class="confirm-dialog">
            <div class="confirm-icon">
                <i class="fas fa-trash-alt"></i>
            </div>
            <h5>${escapeHTML(title)}</h5>
            <p>${escapeHTML(message)}</p>
            <div class="confirm-actions">
                <button class="btn btn-outline-secondary" id="confirmCancel">Cancel</button>
                <button class="btn btn-danger" id="confirmOk">Delete</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('confirmCancel').onclick = () => overlay.remove();
    document.getElementById('confirmOk').onclick = () => {
        overlay.remove();
        if (typeof onConfirm === 'function') onConfirm();
    };
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

/**
 * Export data as CSV
 */
function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        showToast('No data to export', 'warning');
        return;
    }
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.map(h => `"${h}"`).join(','));

    data.forEach(row => {
        const values = headers.map(h => {
            let val = row[h];
            if (val === null || val === undefined) val = '';
            if (Array.isArray(val)) val = val.join('; ');
            if (typeof val === 'object') val = JSON.stringify(val);
            return `"${String(val).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');
    downloadFile(csvContent, filename + '.csv', 'text/csv');
}

/**
 * Export data as JSON
 */
function exportToJSON(data, filename) {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, filename + '.json', 'application/json');
}

/**
 * Download file helper
 */
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`${filename} exported successfully`, 'success');
}

/**
 * Import JSON file
 */
function importJSONFile(inputElement, callback) {
    const file = inputElement.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
        showToast('Please select a JSON file', 'danger');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (typeof callback === 'function') callback(data);
        } catch (err) {
            showToast('Invalid JSON file', 'danger');
        }
    };
    reader.readAsText(file);
    inputElement.value = '';
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate required fields in a form
 * Returns array of errors
 */
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return ['Form not found'];
    
    const errors = [];
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        field.classList.remove('is-invalid');
        const feedback = field.parentElement.querySelector('.invalid-feedback');
        
        if (!field.value || field.value.trim() === '') {
            field.classList.add('is-invalid');
            const label = form.querySelector(`label[for="${field.id}"]`);
            const fieldName = label ? label.textContent.replace('*', '').trim() : field.id;
            errors.push(`${fieldName} is required`);
            if (feedback) feedback.textContent = `${fieldName} is required`;
        } else if (field.type === 'email' && !isValidEmail(field.value)) {
            field.classList.add('is-invalid');
            errors.push('Invalid email format');
            if (feedback) feedback.textContent = 'Invalid email format';
        } else if (field.minLength && field.value.length < field.minLength) {
            field.classList.add('is-invalid');
            errors.push(`Minimum ${field.minLength} characters required`);
            if (feedback) feedback.textContent = `Minimum ${field.minLength} characters required`;
        }
    });
    
    return errors;
}

/**
 * Clear form validation states
 */
function clearValidation(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

/**
 * Reset form
 */
function resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
        clearValidation(formId);
    }
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Truncate text
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    maxLength = maxLength || 50;
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

/**
 * Pagination helper
 */
function paginate(data, page, perPage) {
    page = page || 1;
    perPage = perPage || 10;
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return {
        data: data.slice(start, end),
        totalPages: Math.ceil(data.length / perPage),
        totalItems: data.length,
        currentPage: page,
        perPage: perPage,
        startItem: data.length > 0 ? start + 1 : 0,
        endItem: Math.min(end, data.length)
    };
}

/**
 * Render pagination controls
 */
function renderPagination(paginationData, containerId, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { totalPages, currentPage, totalItems, startItem, endItem } = paginationData;

    if (totalPages <= 1) {
        container.innerHTML = `<span>Showing ${totalItems} item(s)</span><div></div>`;
        return;
    }

    let pagesHtml = '';
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);

    pagesHtml += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage - 1}">&laquo;</a></li>`;

    for (let i = startPage; i <= endPage; i++) {
        pagesHtml += `<li class="page-item ${i === currentPage ? 'active' : ''}">
            <a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }

    pagesHtml += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage + 1}">&raquo;</a></li>`;

    container.innerHTML = `
        <span>Showing ${startItem} to ${endItem} of ${totalItems}</span>
        <nav><ul class="pagination pagination-sm mb-0">${pagesHtml}</ul></nav>
    `;

    container.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(link.dataset.page);
            if (page >= 1 && page <= totalPages && page !== currentPage) {
                onPageChange(page);
            }
        });
    });
}

/**
 * Populate a select element with options
 */
function populateSelect(selectId, options, selectedValue, placeholder) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '';
    if (placeholder) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = placeholder;
        select.appendChild(opt);
    }
    options.forEach(o => {
        const opt = document.createElement('option');
        if (typeof o === 'object') {
            opt.value = o.value;
            opt.textContent = o.label;
        } else {
            opt.value = o;
            opt.textContent = o;
        }
        if (opt.value === selectedValue) opt.selected = true;
        select.appendChild(opt);
    });
}

/**
 * Debounce function for search inputs
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Get initials from name
 */
function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

/**
 * Print content
 */
function printContent(elementId) {
    const content = document.getElementById(elementId);
    if (!content) return;
    const win = window.open('', '_blank');
    win.document.write(`
        <html><head><title>Report</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
        <style>body{padding:20px;font-family:Inter,sans-serif;} table{width:100%;} .badge-status{padding:2px 8px;border-radius:4px;font-size:11px;}</style>
        </head><body>${content.innerHTML}</body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
}
