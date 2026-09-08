(function () {
    'use strict';

    const STATUSES = ['Draft','Waiting HOD Signature','Waiting Purchasing Signature','Waiting AM Signature','Waiting Submission to Purchasing','Waiting Item','Partially Received','Received','Closed','Rejected','Cancelled'];
    const LOCATIONS = ['Engineering','HOD','Purchasing','AM','Purchasing - Final','Other'];
    const WAITING_APPROVAL = new Set(['Waiting HOD Signature','Waiting Purchasing Signature','Waiting AM Signature','Waiting Submission to Purchasing']);
    const CLOSED = new Set(['Closed','Rejected','Cancelled']);
    const state = { records: [], active: null, unsubscribe: null };
    const el = id => document.getElementById(id);
    const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
    const today = () => new Date().toISOString().slice(0, 10);
    const user = () => JSON.parse(localStorage.getItem('currentUser') || 'null');
    const timestampToDate = value => value?.toDate ? value.toDate() : value ? new Date(value) : null;
    const formatDate = value => {
        const date = timestampToDate(value);
        return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '—';
    };
    const formatDateTime = value => {
        const date = timestampToDate(value);
        return date && !Number.isNaN(date.getTime()) ? date.toLocaleString('id-ID', { dateStyle:'medium', timeStyle:'short' }) : '—';
    };
    const daysBetween = (start, end) => {
        if (!start) return 0;
        const a = new Date(`${start}T00:00:00`);
        const b = end ? new Date(`${end}T00:00:00`) : new Date();
        return Math.max(0, Math.floor((b - a) / 86400000));
    };
    const aging = pr => pr.submitted_to_purchasing_date
        ? `${daysBetween(pr.submitted_to_purchasing_date, pr.received_date)} hari (item)`
        : `${daysBetween(pr.created_date)} hari (dokumen)`;
    const optionList = (items, selected='') => items.map(x => `<option value="${esc(x)}" ${x === selected ? 'selected' : ''}>${esc(x)}</option>`).join('');

    function api() {
        return {
            db: window.firebaseDB,
            collection: window.firestoreCollection,
            getDocs: window.firestoreGetDocs,
            onSnapshot: window.firestoreOnSnapshot,
            doc: window.firestoreDoc,
            getDoc: window.firestoreGetDoc,
            setDoc: window.firestoreSetDoc,
            updateDoc: window.firestoreUpdateDoc,
            addDoc: window.firestoreAddDoc,
            transaction: window.firestoreRunTransaction,
            serverTimestamp: window.firestoreServerTimestamp
        };
    }

    function renderShell() {
        el('pr-app').innerHTML = `
            <div id="pr-message"></div>
            <div id="pr-list-view">
                <div class="pr-page-header"><div><h1>Purchase Request</h1><p>PR control log & hardcopy tracking</p></div><button id="pr-create-btn" class="btn btn-primary">+ Create PR</button></div>
                <div class="pr-grid">
                    <div class="pr-summary">Total Open<strong id="pr-total-open">0</strong></div>
                    <div class="pr-summary">Waiting Approval<strong id="pr-total-approval">0</strong></div>
                    <div class="pr-summary">Waiting Item<strong id="pr-total-waiting">0</strong></div>
                    <div class="pr-summary">Received<strong id="pr-total-received">0</strong></div>
                </div>
                <div class="pr-panel">
                    <div class="pr-toolbar">
                        <div class="form-group"><label>Search PR Number</label><input id="pr-filter-search" placeholder="PR-2026-0001"></div>
                        <div class="form-group"><label>Status</label><select id="pr-filter-status"><option value="">All Status</option>${optionList(STATUSES)}</select></div>
                        <div class="form-group"><label>Date</label><input id="pr-filter-date" type="date"></div>
                        <div class="form-group"><label>Priority</label><select id="pr-filter-priority"><option value="">All Priority</option><option>Normal</option><option>Urgent</option></select></div>
                        <button id="pr-filter-reset" class="pr-secondary">Reset</button>
                    </div>
                    <div class="pr-table-wrap"><table class="pr-table"><thead><tr><th>PR Number</th><th>Date</th><th>Purpose</th><th>Status</th><th>Document Location</th><th>Aging</th><th>Last Update</th><th>Action</th></tr></thead><tbody id="pr-list-body"></tbody></table></div>
                </div>
            </div>
            <div id="pr-form-view" class="pr-hidden"></div>
            <div id="pr-detail-view" class="pr-hidden"></div>`;
        el('pr-create-btn').addEventListener('click', showCreate);
        ['pr-filter-search','pr-filter-status','pr-filter-date','pr-filter-priority'].forEach(id => el(id).addEventListener('input', renderList));
        el('pr-filter-reset').addEventListener('click', () => { ['pr-filter-search','pr-filter-status','pr-filter-date','pr-filter-priority'].forEach(id => el(id).value = ''); renderList(); });
    }

    function showMessage(message, error=false) {
        const box = el('pr-message');
        box.innerHTML = message ? `<div class="pr-message ${error ? 'error' : ''}">${esc(message)}</div>` : '';
    }

    function switchView(view) {
        ['list','form','detail'].forEach(name => el(`pr-${name}-view`).classList.toggle('pr-hidden', name !== view));
        showMessage('');
    }

    function renderList() {
        const search = el('pr-filter-search')?.value.trim().toLowerCase() || '';
        const status = el('pr-filter-status')?.value || '';
        const date = el('pr-filter-date')?.value || '';
        const priority = el('pr-filter-priority')?.value || '';
        const filtered = state.records.filter(pr => (!search || pr.pr_number.toLowerCase().includes(search)) && (!status || pr.status === status) && (!date || pr.created_date === date) && (!priority || pr.priority === priority));
        const openCount = state.records.filter(pr => !CLOSED.has(pr.status)).length;
        const approvalCount = state.records.filter(pr => WAITING_APPROVAL.has(pr.status)).length;
        const waitingCount = state.records.filter(pr => ['Waiting Item','Partially Received'].includes(pr.status)).length;
        const receivedCount = state.records.filter(pr => ['Received','Closed'].includes(pr.status)).length;
        el('pr-total-open').textContent = openCount;
        el('pr-total-approval').textContent = approvalCount;
        el('pr-total-waiting').textContent = waitingCount;
        el('pr-total-received').textContent = receivedCount;
        const dashboardValues = {
            'dashboard-pr-total': state.records.length,
            'dashboard-pr-approval': approvalCount,
            'dashboard-pr-waiting': waitingCount,
            'dashboard-pr-received': receivedCount
        };
        Object.entries(dashboardValues).forEach(([id, value]) => {
            const target = el(id);
            if (target) target.textContent = value;
        });
        el('pr-list-body').innerHTML = filtered.length ? filtered.map(pr => `<tr>
            <td><strong>${esc(pr.pr_number)}</strong><br><span class="pr-badge ${pr.priority === 'Urgent' ? 'urgent' : ''}">${esc(pr.priority)}</span></td>
            <td>${formatDate(pr.created_date)}</td><td>${esc(pr.purpose)}</td><td><span class="pr-badge">${esc(pr.status)}</span></td>
            <td>${esc(pr.document_location || 'Engineering')}</td><td>${aging(pr)}</td><td>${formatDateTime(pr.updated_at)}</td>
            <td><button class="pr-secondary" data-pr-view="${esc(pr.pr_number)}">View</button></td></tr>`).join('') : '<tr><td class="pr-empty" colspan="8">No purchase request found.</td></tr>';
        document.querySelectorAll('[data-pr-view]').forEach(btn => btn.addEventListener('click', () => showDetail(btn.dataset.prView)));
    }

    function itemRow(index, item={}) {
        return `<div class="pr-item-row" data-item-row>
            <div><label>Item Name *</label><input data-field="item_name" value="${esc(item.item_name || '')}" required></div>
            <div><label>Specification</label><input data-field="specification" value="${esc(item.specification || '')}"></div>
            <div><label>Qty *</label><input data-field="qty" type="number" min="0.01" step="0.01" value="${esc(item.qty || 1)}" required></div>
            <div><label>Unit *</label><input data-field="unit" value="${esc(item.unit || 'PCS')}" required></div>
            <div><label>Est. Price</label><input data-field="estimated_price" type="number" min="0" step="0.01" value="${esc(item.estimated_price || '')}"></div>
            <button type="button" class="pr-danger" data-remove-item title="Remove item">×</button></div>`;
    }

    async function suggestedNumber() {
        const year = new Date().getFullYear();
        const prefix = `PR-${year}-`;
        const max = state.records.filter(pr => pr.pr_number.startsWith(prefix)).reduce((n, pr) => Math.max(n, Number(pr.pr_number.slice(prefix.length)) || 0), 0);
        return `${prefix}${String(max + 1).padStart(4, '0')}`;
    }

    async function showCreate() {
        switchView('form');
        el('pr-form-view').innerHTML = `<div class="pr-page-header"><div><h1>Create Purchase Request</h1><p>Initial status: Draft</p></div><button id="pr-form-back" class="pr-secondary">Back</button></div>
        <form id="pr-form" class="pr-panel">
            <div class="pr-form-grid">
                <div class="form-group"><label>PR Number *</label><input id="pr-number" required value="${await suggestedNumber()}"></div>
                <div class="form-group"><label>Request Date *</label><input id="pr-date" type="date" required value="${today()}"></div>
                <div class="form-group"><label>Requester *</label><input id="pr-requester" required value="${esc(user()?.email || '')}"></div>
                <div class="form-group"><label>Department *</label><input id="pr-department" required value="Engineering"></div>
                <div class="form-group pr-wide"><label>Purpose / Justification *</label><textarea id="pr-purpose" rows="3" required></textarea></div>
                <div class="form-group"><label>Priority</label><select id="pr-priority"><option>Normal</option><option>Urgent</option></select></div>
                <div class="form-group"><label>Attachment (photo/PDF)</label><input id="pr-attachment" type="file" accept="image/*,.pdf"></div>
                <div class="form-group pr-wide"><label>Remark</label><textarea id="pr-remark" rows="2"></textarea></div>
            </div>
            <h3>Items</h3><div id="pr-items">${itemRow(0)}</div>
            <div class="pr-actions"><button type="button" id="pr-add-item" class="pr-secondary">+ Add Item</button><button type="submit" id="pr-save-btn" class="btn btn-primary">Save PR</button></div>
        </form>`;
        el('pr-form-back').addEventListener('click', () => switchView('list'));
        el('pr-add-item').addEventListener('click', () => el('pr-items').insertAdjacentHTML('beforeend', itemRow(Date.now())));
        el('pr-items').addEventListener('click', handleItemAction);
        el('pr-form').addEventListener('submit', savePR);
    }

    function handleItemAction(event) {
        const removeButton = event.target.closest('[data-remove-item]');
        if (!removeButton || !event.currentTarget.contains(removeButton)) return;
        event.preventDefault();
        event.stopPropagation();
        const itemRows = event.currentTarget.querySelectorAll(':scope > [data-item-row]');
        if (itemRows.length <= 1) return showMessage('A PR must contain at least one item.', true);
        removeButton.closest('[data-item-row]')?.remove();
    }

    function collectItems(form) {
        const itemContainer = form.querySelector('#pr-items');
        if (!itemContainer) return [];
        return [...itemContainer.querySelectorAll(':scope > [data-item-row]')].map((row, index) => {
            const get = name => row.querySelector(`[data-field="${name}"]`)?.value.trim() || '';
            return { id:`item-${Date.now()}-${index}`, item_name:get('item_name'), specification:get('specification'), qty:Number(get('qty')), unit:get('unit'), estimated_price:get('estimated_price') === '' ? null : Number(get('estimated_price')), received_qty:0, item_remark:'' };
        });
    }

    async function uploadAttachment(prNumber, file) {
        if (!file) return null;
        if (!window.firebaseStorage || !window.firebaseStorageRef) throw new Error('Firebase Storage is not available.');
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `purchase_requests/${prNumber}/${Date.now()}-${safeName}`;
        const reference = window.firebaseStorageRef(window.firebaseStorage, path);
        await window.firebaseUploadBytes(reference, file);
        return { name:file.name, type:file.type, size:file.size, path, url:await window.firebaseGetDownloadURL(reference) };
    }

    async function savePR(event) {
        event.preventDefault();
        event.stopPropagation();
        const form = event.currentTarget;
        const prNumber = el('pr-number').value.trim().toUpperCase();
        if (!/^PR-\d{4}-\d{4,}$/.test(prNumber)) return showMessage('PR Number must use format PR-YYYY-XXXX.', true);
        const items = collectItems(form);
        if (!items.length) return showMessage('A PR must contain at least one item.', true);
        if (items.some(item => !item.item_name || !item.unit || !(item.qty > 0))) return showMessage('Complete all required item fields.', true);
        const a = api();
        const reference = a.doc(a.db, 'purchase_requests', prNumber);
        const nowIso = new Date().toISOString();
        const record = { pr_id:prNumber, pr_number:prNumber, created_date:el('pr-date').value, requester:el('pr-requester').value.trim(), department:el('pr-department').value.trim() || 'Engineering', purpose:el('pr-purpose').value.trim(), priority:el('pr-priority').value, status:'Draft', document_location:'Engineering', hod_signed_date:null, purchasing_signed_date:null, am_signed_date:null, submitted_to_purchasing_date:null, received_date:null, remark:el('pr-remark').value.trim(), attachment:null, items, created_by:user()?.email || null, created_at:nowIso, updated_at:nowIso };
        const attachmentFile = el('pr-attachment').files[0];
        let attachmentWarning = '';
        try {
            const exists = await a.getDoc(reference);
            if (exists.exists()) throw new Error('PR Number already exists. Use a unique number.');
            if (attachmentFile) {
                try {
                    record.attachment = await uploadAttachment(prNumber, attachmentFile);
                } catch (uploadError) {
                    console.error('PR attachment upload failed:', uploadError);
                    record.attachment = {
                        name: attachmentFile.name,
                        type: attachmentFile.type,
                        size: attachmentFile.size,
                        path: null,
                        url: null,
                        status: 'upload_failed'
                    };
                    attachmentWarning = ' Attachment failed to upload, but the PR was saved.';
                }
            }
            await a.transaction(a.db, async transaction => {
                const fresh = await transaction.get(reference);
                if (fresh.exists()) throw new Error('PR Number already exists. Use a unique number.');
                transaction.set(reference, record);
            });
            await addHistory(prNumber, 'PR Created', record.remark);
            if (attachmentWarning) await addHistory(prNumber, 'Attachment upload failed', attachmentFile.name);
            switchView('list'); showMessage(`${prNumber} successfully created.${attachmentWarning}`, Boolean(attachmentWarning));
        } catch (error) { console.error(error); showMessage(error.message || 'Unable to save PR.', true); }
    }

    async function addHistory(prNumber, action, remark='') {
        const a = api();
        await a.addDoc(a.collection(a.db, 'purchase_requests', prNumber, 'history'), { timestamp:new Date().toISOString(), action, remark:remark || '', updated_by:user()?.email || null });
    }

    async function showDetail(prNumber) {
        state.active = state.records.find(pr => pr.pr_number === prNumber);
        if (!state.active) return;
        switchView('detail');
        const pr = state.active;
        const history = await loadHistory(prNumber);
        el('pr-detail-view').innerHTML = `<div class="pr-page-header"><div><h1>${esc(pr.pr_number)}</h1><p>Purchase Request Detail</p></div><div class="pr-actions pr-no-print"><label class="pr-print-option">Print Content<select id="pr-print-scope"><option value="basic">Header + Items</option><option value="complete">Complete + History</option></select></label><button id="pr-print-btn" class="btn btn-primary">Print PR</button><button id="pr-detail-back" class="pr-secondary">Back</button></div></div>
        <div class="pr-detail-grid">
            <div><div class="pr-panel"><h3>PR Header</h3><div class="pr-kv">
                <div><small>Request Date</small>${formatDate(pr.created_date)}</div><div><small>Requester</small>${esc(pr.requester)}</div>
                <div><small>Department</small>${esc(pr.department)}</div><div><small>Priority</small>${esc(pr.priority)}</div>
                <div><small>Status</small><span class="pr-badge">${esc(pr.status)}</span></div><div><small>Document Location</small>${esc(pr.document_location)}</div>
                <div><small>Document Aging</small>${daysBetween(pr.created_date, pr.submitted_to_purchasing_date || null)} hari</div><div><small>Waiting Item Aging</small>${pr.submitted_to_purchasing_date ? daysBetween(pr.submitted_to_purchasing_date, pr.received_date) + ' hari' : '—'}</div>
                <div class="pr-wide"><small>Purpose</small>${esc(pr.purpose)}</div><div class="pr-wide"><small>Remark</small>${esc(pr.remark || '—')}</div>
            </div></div>
            <div class="pr-panel"><h3>Items</h3><div class="pr-table-wrap"><table class="pr-table"><thead><tr><th>Item</th><th>Specification</th><th>Requested</th><th>Received</th><th>Remark</th></tr></thead><tbody>${(pr.items || []).map((item,i) => `<tr><td>${esc(item.item_name)}</td><td>${esc(item.specification || '—')}</td><td>${item.qty} ${esc(item.unit)}</td><td><input data-received="${i}" type="number" min="0" max="${item.qty}" step="0.01" value="${Number(item.received_qty || 0)}" style="width:80px"><span class="pr-print-value">${Number(item.received_qty || 0)} ${esc(item.unit)}</span></td><td><input data-item-remark="${i}" value="${esc(item.item_remark || '')}"><span class="pr-print-value">${esc(item.item_remark || '—')}</span></td></tr>`).join('')}</tbody></table></div><button id="pr-save-receipts" class="btn btn-primary pr-no-print">Save Received Qty</button></div></div>
            <div><div class="pr-panel pr-no-print"><h3>Manual Tracking Update</h3><div class="form-group"><label>Status</label><select id="pr-update-status">${optionList(STATUSES, pr.status)}</select></div><div class="form-group"><label>Document Location</label><select id="pr-update-location">${optionList(LOCATIONS, pr.document_location)}</select></div><div class="form-group"><label>Update Remark</label><textarea id="pr-update-remark" rows="2"></textarea></div><button id="pr-update-btn" class="btn btn-primary">Update Tracking</button></div>
            <div class="pr-panel pr-optional-print"><h3>Approval Milestones</h3><div class="pr-kv"><div><small>HOD Signed</small>${formatDate(pr.hod_signed_date)}</div><div><small>Purchasing Signed</small>${formatDate(pr.purchasing_signed_date)}</div><div><small>AM Signed</small>${formatDate(pr.am_signed_date)}</div><div><small>Submitted</small>${formatDate(pr.submitted_to_purchasing_date)}</div><div><small>Received</small>${formatDate(pr.received_date)}</div></div></div>
            <div class="pr-panel pr-optional-print"><h3>Attachment</h3>${pr.attachment?.url ? `<a href="${esc(pr.attachment.url)}" target="_blank" rel="noopener">${esc(pr.attachment.name)}</a>` : pr.attachment?.status === 'upload_failed' ? `<span class="pr-message error">Upload failed: ${esc(pr.attachment.name)}</span>` : '<span class="pr-muted">No attachment</span>'}</div>
            <div class="pr-panel pr-optional-print"><h3>Tracking History</h3><ul class="pr-history">${history.length ? history.map(h => `<li><strong>${esc(h.action)}</strong><br><span class="pr-muted">${formatDateTime(h.timestamp)} · ${esc(h.updated_by || 'Unknown')}</span>${h.remark ? `<br>${esc(h.remark)}` : ''}</li>`).join('') : '<li>No history yet.</li>'}</ul></div></div>
        </div>`;
        el('pr-detail-back').addEventListener('click', () => switchView('list'));
        el('pr-print-btn').addEventListener('click', () => printPR(pr.pr_number));
        el('pr-update-btn').addEventListener('click', updateTracking);
        el('pr-save-receipts').addEventListener('click', updateReceipts);
    }

    function printPR(prNumber) {
        const previousTitle = document.title;
        const scope = el('pr-print-scope')?.value || 'basic';
        document.title = `${prNumber} - Purchase Request`;
        document.body.classList.add('pr-printing');
        document.body.classList.toggle('pr-print-basic', scope === 'basic');
        const cleanup = () => {
            document.body.classList.remove('pr-printing', 'pr-print-basic');
            document.title = previousTitle;
            window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup);
        window.print();
        window.setTimeout(cleanup, 1000);
    }

    async function loadHistory(prNumber) {
        const a = api();
        const snapshot = await a.getDocs(a.collection(a.db, 'purchase_requests', prNumber, 'history'));
        return snapshot.docs.map(doc => ({ id:doc.id, ...doc.data() })).sort((x,y) => new Date(y.timestamp) - new Date(x.timestamp));
    }

    function milestonePatch(status, pr) {
        const patch = {};
        if (status === 'Waiting Purchasing Signature' && !pr.hod_signed_date) patch.hod_signed_date = today();
        if (status === 'Waiting AM Signature' && !pr.purchasing_signed_date) patch.purchasing_signed_date = today();
        if (status === 'Waiting Submission to Purchasing' && !pr.am_signed_date) patch.am_signed_date = today();
        if (['Waiting Item','Partially Received','Received'].includes(status) && !pr.submitted_to_purchasing_date) patch.submitted_to_purchasing_date = today();
        if (status === 'Received' && !pr.received_date) patch.received_date = today();
        return patch;
    }

    async function updateTracking() {
        const a = api(), pr = state.active;
        const status = el('pr-update-status').value, location = el('pr-update-location').value, remark = el('pr-update-remark').value.trim();
        const changes = [];
        if (status !== pr.status) changes.push(`Status changed: ${pr.status} → ${status}`);
        if (location !== pr.document_location) changes.push(`Document moved: ${pr.document_location} → ${location}`);
        if (!changes.length && !remark) return showMessage('No tracking changes to save.', true);
        const patch = { status, document_location:location, updated_at:new Date().toISOString(), ...milestonePatch(status, pr) };
        try { await a.updateDoc(a.doc(a.db, 'purchase_requests', pr.pr_number), patch); await addHistory(pr.pr_number, changes.join('; ') || 'Remark updated', remark); showMessage('Tracking updated.'); await showDetail(pr.pr_number); } catch (error) { showMessage(error.message, true); }
    }

    async function updateReceipts() {
        const a = api(), pr = state.active;
        const items = (pr.items || []).map((item, i) => ({ ...item, received_qty:Number(document.querySelector(`[data-received="${i}"]`).value || 0), item_remark:document.querySelector(`[data-item-remark="${i}"]`).value.trim() }));
        if (items.some(item => item.received_qty < 0 || item.received_qty > item.qty)) return showMessage('Received quantity must be between 0 and requested quantity.', true);
        const totalReceived = items.reduce((n,item) => n + item.received_qty, 0);
        const allReceived = items.every(item => item.received_qty >= item.qty);
        const status = allReceived ? 'Received' : totalReceived > 0 ? 'Partially Received' : pr.status;
        const patch = { items, status, updated_at:new Date().toISOString(), ...milestonePatch(status, pr) };
        try { await a.updateDoc(a.doc(a.db, 'purchase_requests', pr.pr_number), patch); await addHistory(pr.pr_number, `Item receipt updated — ${status}`, ''); showMessage('Received quantities saved.'); await showDetail(pr.pr_number); } catch (error) { showMessage(error.message, true); }
    }

    function subscribe() {
        const a = api();
        state.unsubscribe = a.onSnapshot(a.collection(a.db, 'purchase_requests'), snapshot => {
            state.records = snapshot.docs.map(doc => ({ id:doc.id, ...doc.data() })).sort((x,y) => String(y.created_at).localeCompare(String(x.created_at)));
            renderList();
            if (state.active) state.active = state.records.find(pr => pr.pr_number === state.active.pr_number) || null;
        }, error => showMessage(`Unable to load Purchase Requests: ${error.message}`, true));
    }

    function init() {
        if (!el('pr-app') || !window.firebaseDB) return;
        renderShell(); subscribe();
    }
    if (window.firebaseDB) init(); else window.addEventListener('firebaseReady', init, { once:true });
})();
