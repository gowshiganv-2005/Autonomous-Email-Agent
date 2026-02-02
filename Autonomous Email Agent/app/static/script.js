document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const generateBtn = document.getElementById('generate-btn');
    const sendBtn = document.getElementById('send-btn');
    const promptInput = document.getElementById('prompt');
    const toneInput = document.getElementById('tone');
    const subjectInput = document.getElementById('email-subject');
    const bodyArea = document.getElementById('email-body');
    const loader = document.getElementById('loader');
    const btnText = document.getElementById('btn-text');
    const recipientInput = document.getElementById('recipient-input');
    const addRecipientBtn = document.getElementById('add-recipient');
    const recipientChips = document.getElementById('recipient-chips');
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const fileListDisplay = document.getElementById('file-list');
    const excelBtn = document.getElementById('excel-btn');
    const excelInput = document.getElementById('excel-input');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    const toastIcon = document.getElementById('toast-icon');

    let recipients = [];
    let attachedFiles = [];

    // --- Notifications ---
    function showToast(message, type = 'success') {
        toastMsg.textContent = message;
        toastIcon.className = 'toast-icon ' + (type === 'success' ? 'toast-success' : 'toast-error');
        toastIcon.innerHTML = type === 'success' ? '<i class="fas fa-check" style="color:white;font-size:0.8rem;"></i>' : '<i class="fas fa-times" style="color:white;font-size:0.8rem;"></i>';

        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3500);
    }

    // --- File Handling ---
    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    ['dragover', 'drop'].forEach(evt => {
        dropZone.addEventListener(evt, e => e.preventDefault());
    });

    dropZone.addEventListener('drop', e => handleFiles(e.dataTransfer.files));

    function handleFiles(files) {
        for (let file of files) {
            if (!attachedFiles.find(f => f.name === file.name)) {
                attachedFiles.push(file);
            }
        }
        renderFileList();
        showToast(`${files.length} file(s) added`);
    }

    function renderFileList() {
        fileListDisplay.innerHTML = attachedFiles.map((file, index) => `
            <div class="file-pill">
                <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px;">
                    <i class="fas fa-file-invoice" style="margin-right:8px;color:var(--primary);"></i> ${file.name}
                </span>
                <i class="fas fa-times" onclick="removeFile(${index})" style="color:var(--danger);cursor:pointer;"></i>
            </div>
        `).join('');
    }

    window.removeFile = (index) => {
        attachedFiles.splice(index, 1);
        renderFileList();
    };

    // --- Recipient Management ---
    addRecipientBtn.addEventListener('click', () => {
        const email = recipientInput.value.trim();
        if (email && /^\S+@\S+\.\S+$/.test(email) && !recipients.includes(email)) {
            recipients.push(email);
            renderChips();
            recipientInput.value = '';
            validateSendStatus();
        } else if (email) {
            showToast('Invalid email address', 'error');
        }
    });

    recipientInput.addEventListener('keypress', e => e.key === 'Enter' && addRecipientBtn.click());

    function renderChips() {
        recipientChips.innerHTML = recipients.map((email, index) => `
            <div class="mail-chip">
                <span>${email}</span>
                <i class="fas fa-close" onclick="removeRecipient(${index})"></i>
            </div>
        `).join('');
    }

    window.removeRecipient = (index) => {
        recipients.splice(index, 1);
        renderChips();
        validateSendStatus();
    };

    // --- Excel Extraction ---
    excelBtn.addEventListener('click', () => excelInput.click());

    excelInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        showToast('Extracting emails from Excel...');
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/extract-emails', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (response.ok) {
                const newEmails = data.emails.filter(email => !recipients.includes(email));
                if (newEmails.length > 0) {
                    recipients.push(...newEmails);
                    renderChips();
                    validateSendStatus();
                    showToast(`Extracted ${newEmails.length} new recipients!`);
                } else {
                    showToast('No new unique emails found in file.', 'error');
                }
            } else {
                showToast(data.detail || 'Extraction failed', 'error');
            }
        } catch (err) {
            showToast('Connection failed', 'error');
        } finally {
            excelInput.value = ''; // Reset input
        }
    });

    function validateSendStatus() {
        const hasBody = bodyArea.innerText.trim().length > 0;
        const hasSubject = subjectInput.value.trim().length > 0;
        const hasRecipients = recipients.length > 0;
        sendBtn.disabled = !(hasBody && hasSubject && hasRecipients);
    }

    // --- AI Generation ---
    generateBtn.addEventListener('click', async () => {
        const prompt = promptInput.value.trim();
        if (!prompt) return showToast('Please enter a goal first', 'error');

        generateBtn.disabled = true;
        loader.classList.remove('hidden');
        btnText.textContent = 'Mapping AI...';

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, tone: toneInput.value })
            });

            const data = await response.json();
            if (response.ok) {
                subjectInput.value = data.subject || '';
                bodyArea.innerText = data.body || '';
                showToast('Campaign drafted by AI');
                validateSendStatus();
            }
        } catch (err) {
            showToast('AI Generation failed', 'error');
        } finally {
            generateBtn.disabled = false;
            loader.classList.add('hidden');
            btnText.textContent = 'Craft Content';
        }
    });

    // --- Sending ---
    sendBtn.addEventListener('click', async () => {
        const subject = subjectInput.value.trim();
        const body = bodyArea.innerText.trim();

        sendBtn.disabled = true;
        const originalText = sendBtn.innerHTML;
        sendBtn.innerHTML = '<div class="loader"></div> <span>Blasting...</span>';

        const formData = new FormData();
        formData.append('subject', subject);
        formData.append('body', body);
        formData.append('recipients', JSON.stringify(recipients));
        attachedFiles.forEach(f => formData.append('attachments', f));

        try {
            const response = await fetch('/api/send', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                showToast(`Campaign blasted to ${recipients.length} recipients!`);
                // Clear state? User choice.
            } else {
                const err = await response.json();
                showToast(err.detail || 'Failed to send', 'error');
            }
        } catch (error) {
            showToast('Connection failed', 'error');
        } finally {
            sendBtn.disabled = false;
            sendBtn.innerHTML = originalText;
            validateSendStatus();
        }
    });

    [subjectInput, bodyArea].forEach(el => el.addEventListener('input', validateSendStatus));
});
