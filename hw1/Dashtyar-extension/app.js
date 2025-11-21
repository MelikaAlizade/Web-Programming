document.addEventListener('DOMContentLoaded', function () {
    let notes = JSON.parse(localStorage.getItem('notes')) || [
        { id: 1, title: 'خوش آمدید', content: 'به دشتیار خوش آمدید! این یک یادداشت نمونه است.' }
    ];

    let quickLinks = JSON.parse(localStorage.getItem('quickLinks')) || [
        { title: 'گوگل', url: 'https://www.google.com', icon: 'fas fa-globe' },
        { title: 'جیمیل', url: 'https://mail.google.com', icon: 'fas fa-envelope' },
        { title: 'تلگرام', url: 'https://web.telegram.org', icon: 'fas fa-paper-plane' },
        { title: 'یوتیوب', url: 'https://www.youtube.com', icon: 'fas fa-play-circle' },
        { title: 'درایو', url: 'https://drive.google.com', icon: 'fas fa-cloud' },
        { title: 'تقویم', url: 'https://calendar.google.com', icon: 'fas fa-calendar' }
    ];

    let noteIdCounter = notes.length > 0 ? Math.max(...notes.map(note => note.id)) + 1 : 2;
    let currentEditingNoteId = null;

    let currentDate = new Date();
    let isGregorian = false;
    let selectedDate = null;
    let currentDailyNoteDate = null;

    function getLocalDate(date = new Date()) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    initializeNotes();
    initializeQuickLinks();
    initializeCalendar();
    initializeModals();
    initializeSearch();

    function initializeNotes() {
        const saveNoteBtn = document.getElementById('save-note');
        const noteTitle = document.getElementById('note-title');
        const noteContent = document.getElementById('note-content');

        if (saveNoteBtn) {
            saveNoteBtn.addEventListener('click', function () {
                const titleValid = validateInput(noteTitle);
                const contentValid = validateInput(noteContent);

                if (titleValid && contentValid) {
                    const newNote = {
                        id: noteIdCounter++,
                        title: noteTitle.value.trim(),
                        content: noteContent.value.trim()
                    };

                    notes.unshift(newNote);
                    saveNotesToStorage();
                    renderNotes();

                    const newNoteElement = document.querySelector(`.note-item[data-id="${newNote.id}"]`);
                    if (newNoteElement) {
                        newNoteElement.classList.add('neon-glow');
                        setTimeout(() => {
                            newNoteElement.classList.remove('neon-glow');
                        }, 2000);
                    }

                    noteTitle.value = '';
                    noteContent.value = '';

                    addNeonEffect('#save-note');
                }
            });
        }

        renderNotes();
    }

    function renderNotes() {
        const notesList = document.getElementById('notes-list');
        if (!notesList) {
            console.error('Notes list element not found!');
            return;
        }

        notesList.innerHTML = '';

        const generalNotes = notes.filter(note => !note.date);

        if (generalNotes.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-notes';
            emptyMessage.textContent = 'هیچ یادداشتی وجود ندارد';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.color = 'var(--muted)';
            emptyMessage.style.padding = '20px';
            notesList.appendChild(emptyMessage);
        } else {
            generalNotes.forEach(note => {
                const noteItem = document.createElement('div');
                noteItem.className = 'note-item';
                noteItem.setAttribute('data-id', note.id);
                noteItem.innerHTML = `
                    <div class="note-title">${note.title}</div>
                    <div class="note-content">${note.content}</div>
                    <div class="note-actions">
                        <button class="note-btn edit-btn" data-id="${note.id}">
                            <i class="fas fa-edit"></i>
                            ویرایش
                        </button>
                        <button class="note-btn delete-btn" data-id="${note.id}">
                            <i class="fas fa-trash"></i>
                            حذف
                        </button>
                    </div>
                `;
                notesList.appendChild(noteItem);
            });
        }
        addAllNoteEventListeners();
    }

    function addAllNoteEventListeners() {
        document.querySelectorAll('.edit-btn').forEach(editBtn => {
            editBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                const noteId = parseInt(this.getAttribute('data-id'));
                openEditModal(noteId);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(deleteBtn => {
            deleteBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                const noteId = parseInt(this.getAttribute('data-id'));
                deleteNote(noteId);
            });
        });
    }

    function saveNotesToStorage() {
        localStorage.setItem('notes', JSON.stringify(notes));
    }

    function deleteNote(noteId) {
        const noteItem = document.querySelector(`.note-item[data-id="${noteId}"]`);
        const existingNoteItem = document.querySelector(`.existing-note-item[data-note-id="${noteId}"]`);

        if (noteItem || existingNoteItem) {
            const elementToRemove = noteItem || existingNoteItem;
            elementToRemove.style.opacity = '0';
            elementToRemove.style.transform = 'translateX(50px) scale(0.8)';

            setTimeout(() => {
                notes = notes.filter(note => note.id !== noteId);
                saveNotesToStorage();
                renderNotes();
                renderCalendar();

                if (currentDailyNoteDate) {
                    renderExistingNotesForDate(currentDailyNoteDate);
                }
            }, 300);
        }
    }

    function openEditModal(noteId) {
        const note = notes.find(n => n.id === noteId);
        const editNoteModal = document.getElementById('edit-note-modal');
        const editNoteTitle = document.getElementById('edit-note-title');
        const editNoteContent = document.getElementById('edit-note-content');

        if (note && editNoteModal && editNoteTitle && editNoteContent) {
            editNoteTitle.value = note.title;
            editNoteContent.value = note.content;
            currentEditingNoteId = noteId;
            editNoteModal.classList.add('active');
            editNoteTitle.focus();
        } else {
            console.error('Could not open edit modal');
        }
    }

    function closeEditModal() {
        const editNoteModal = document.getElementById('edit-note-modal');
        if (editNoteModal) {
            editNoteModal.classList.remove('active');
        }
        currentEditingNoteId = null;
    }

    function updateNote() {
        const editNoteTitle = document.getElementById('edit-note-title');
        const editNoteContent = document.getElementById('edit-note-content');

        if (!editNoteTitle || !editNoteContent) {
            console.error('Edit inputs not found');
            return;
        }

        const title = editNoteTitle.value.trim();
        const content = editNoteContent.value.trim();

        const titleValid = validateInput(editNoteTitle);
        const contentValid = validateInput(editNoteContent);

        if (currentEditingNoteId && titleValid && contentValid) {
            const noteIndex = notes.findIndex(n => n.id === currentEditingNoteId);

            if (noteIndex !== -1) {
                notes[noteIndex].title = title;
                notes[noteIndex].content = content;
                saveNotesToStorage();
                renderNotes();

                const updatedNote = document.querySelector(`.note-item[data-id="${currentEditingNoteId}"]`);
                if (updatedNote) {
                    updatedNote.classList.add('neon-glow');
                    setTimeout(() => {
                        updatedNote.classList.remove('neon-glow');
                    }, 2000);
                }

                closeEditModal();
                if (currentDailyNoteDate) {
                    renderExistingNotesForDate(currentDailyNoteDate);
                }

                addNeonEffect('#update-note');
            }
        }
    }

    function openDailyNoteModal(date) {
        currentDailyNoteDate = date;

        const dailyNoteModal = document.getElementById('daily-note-modal');
        const selectedDateDisplay = document.getElementById('selected-date-display');
        const dailyNoteTitleInput = document.getElementById('daily-note-title-input');
        const dailyNoteContent = document.getElementById('daily-note-content');

        if (dailyNoteModal && selectedDateDisplay && dailyNoteTitleInput && dailyNoteContent) {
            selectedDateDisplay.textContent = formatDateForDisplay(date);

            dailyNoteTitleInput.value = '';
            dailyNoteContent.value = '';
            resetValidation(dailyNoteTitleInput);
            resetValidation(dailyNoteContent);

            renderExistingNotesForDate(date);

            dailyNoteModal.classList.add('active');
            dailyNoteTitleInput.focus();
        }
    }

    function closeDailyNoteModal() {
        const dailyNoteModal = document.getElementById('daily-note-modal');
        if (dailyNoteModal) {
            dailyNoteModal.classList.remove('active');
        }
        currentDailyNoteDate = null;
    }

    function renderExistingNotesForDate(date) {
        const existingNotesList = document.getElementById('existing-notes-list');
        if (!existingNotesList) return;

        const dateStr = getLocalDate(date).toISOString().split('T')[0];
        const dateNotes = notes.filter(note => note.date === dateStr);

        existingNotesList.innerHTML = '';

        if (dateNotes.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-notes-message';
            emptyMessage.textContent = 'هنوز یادداشتی برای این تاریخ ثبت نشده است';
            existingNotesList.appendChild(emptyMessage);
        } else {
            dateNotes.forEach(note => {
                const noteItem = document.createElement('div');
                noteItem.className = 'existing-note-item';
                noteItem.setAttribute('data-note-id', note.id);
                noteItem.innerHTML = `
                    <div class="existing-note-header">
                        <div class="existing-note-title">${note.title}</div>
                        <div class="existing-note-actions">
                            <button class="existing-note-action-btn existing-note-edit-btn" data-id="${note.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="existing-note-action-btn existing-note-delete-btn" data-id="${note.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="existing-note-content">${note.content}</div>
                `;
                existingNotesList.appendChild(noteItem);
            });

            existingNotesList.querySelectorAll('.existing-note-edit-btn').forEach(btn => {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    const noteId = parseInt(this.getAttribute('data-id'));
                    closeDailyNoteModal();
                    openEditModal(noteId);
                });
            });

            existingNotesList.querySelectorAll('.existing-note-delete-btn').forEach(btn => {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    const noteId = parseInt(this.getAttribute('data-id'));
                    deleteNote(noteId);
                });
            });
        }
    }

    function saveDailyNote() {
        const dailyNoteTitleInput = document.getElementById('daily-note-title-input');
        const dailyNoteContent = document.getElementById('daily-note-content');

        if (!dailyNoteTitleInput || !dailyNoteContent || !currentDailyNoteDate) {
            console.error('Daily note inputs not found');
            return;
        }

        const title = dailyNoteTitleInput.value.trim();
        const content = dailyNoteContent.value.trim();

        const titleValid = validateInput(dailyNoteTitleInput);
        const contentValid = validateInput(dailyNoteContent);

        if (titleValid && contentValid) {
            const newNote = {
                id: noteIdCounter++,
                title: title,
                content: content,
                date: getLocalDate(currentDailyNoteDate).toISOString().split('T')[0]
            };

            notes.unshift(newNote);
            saveNotesToStorage();

            renderNotes();
            renderCalendar();
            renderExistingNotesForDate(currentDailyNoteDate);

            dailyNoteTitleInput.value = '';
            dailyNoteContent.value = '';
            dailyNoteTitleInput.focus();

            addNeonEffect('#save-daily-note');

        }
    }

    function validateInput(inputElement) {
        const value = inputElement.value.trim();
        if (value === '') {
            inputElement.style.borderColor = '#ff4444';
            inputElement.style.boxShadow = '0 0 10px rgba(255, 68, 68, 0.6)';
            return false;
        } else {
            resetValidation(inputElement);
            return true;
        }
    }

    function resetValidation(inputElement) {
        inputElement.style.borderColor = '';
        inputElement.style.boxShadow = '';
    }

    // JALALI CALENDAR - generated by AI
    function gregorianToJalali(gy, gm, gd) {
        let g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        let jy = (gy <= 1600) ? 0 : 979;
        gy -= (gy <= 1600) ? 621 : 1600;
        let gy2 = (gm > 2) ? (gy + 1) : gy;
        let days = (365 * gy) + parseInt((gy2 + 3) / 4) - parseInt((gy2 + 99) / 100) + parseInt((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
        jy += 33 * parseInt(days / 12053);
        days %= 12053;
        jy += 4 * parseInt(days / 1461);
        days %= 1461;
        jy += parseInt((days - 1) / 365);
        if (days > 365) days = (days - 1) % 365;
        let jm = (days < 186) ? 1 + parseInt(days / 31) : 7 + parseInt((days - 186) / 30);
        let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
        return [jy, jm, jd];
    }

    // GREGORIAN CALENDAR - generated by AI
    function jalaliToGregorian(jy, jm, jd) {
        jy += 1595;
        let days = -355668 + (365 * jy) + (parseInt(jy / 33) * 8) + parseInt(((jy % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
        let gy = 400 * parseInt(days / 146097);
        days %= 146097;
        if (days > 36524) {
            gy += 100 * parseInt(--days / 36524);
            days %= 36524;
            if (days >= 365) days++;
        }
        gy += 4 * parseInt(days / 1461);
        days %= 1461;
        if (days > 365) {
            gy += parseInt((days - 1) / 365);
            days = (days - 1) % 365;
        }
        let gd = days + 1;
        let sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let gm;
        for (gm = 0; gm < 13; gm++) {
            let v = sal_a[gm];
            if (gd <= v) break;
            gd -= v;
        }
        return [gy, gm, gd];
    }

    function toJalaliDate(gregorianDate) {
        const localDate = getLocalDate(gregorianDate);
        const gy = localDate.getFullYear();
        const gm = localDate.getMonth() + 1;
        const gd = localDate.getDate();
        const [jy, jm, jd] = gregorianToJalali(gy, gm, gd);
        return {
            year: jy,
            month: jm - 1,
            day: jd
        };
    }

    function toGregorianDate(jy, jm, jd) {
        const [gy, gm, gd] = jalaliToGregorian(jy, jm + 1, jd);
        return getLocalDate(new Date(gy, gm - 1, gd));
    }

    function formatDateForDisplay(date) {
        const localDate = getLocalDate(date);
        if (isGregorian) {
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const month = months[localDate.getMonth()];
            const day = localDate.getDate();
            const year = localDate.getFullYear();
            return `${month} ${day}, ${year}`;
        } else {
            const jalaliDate = toJalaliDate(localDate);
            const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
            const month = months[jalaliDate.month];
            const day = jalaliDate.day;
            const year = jalaliDate.year;
            return `${day} ${month} ${year}`;
        }
    }

    function initializeQuickLinks() {
        renderQuickLinks();

        const addQuickLinkBtn = document.getElementById('add-quick-link');
        if (addQuickLinkBtn) {
            addQuickLinkBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                openAddLinkModal();
            });
        }
    }

    function renderQuickLinks() {
        const quickGrid = document.getElementById('quick-grid');
        if (!quickGrid) return;

        const addButton = quickGrid.querySelector('#add-quick-link');
        quickGrid.innerHTML = '';

        quickLinks.forEach((link, index) => {
            const quickItem = document.createElement('div');
            quickItem.className = 'quick-item';
            quickItem.innerHTML = `
                <span class="quick-icon"><i class="${link.icon}"></i></span>
                <span class="quick-text">${link.title}</span>
                <button class="remove-btn">×</button>
            `;

            quickItem.addEventListener('click', function (e) {
                if (!e.target.classList.contains('remove-btn')) {
                    window.open(link.url, '_blank');
                }
            });

            const removeBtn = quickItem.querySelector('.remove-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    quickLinks.splice(index, 1);
                    saveQuickLinksToStorage();
                    renderQuickLinks();
                });
            }

            quickGrid.appendChild(quickItem);
        });

        if (addButton) {
            quickGrid.appendChild(addButton);
            addButton.addEventListener('click', function (e) {
                e.stopPropagation();
                openAddLinkModal();
            });
        }
    }

    function saveQuickLinksToStorage() {
        localStorage.setItem('quickLinks', JSON.stringify(quickLinks));
    }

    function openAddLinkModal() {
        const addLinkModal = document.getElementById('add-link-modal');
        const linkTitle = document.getElementById('link-title');
        const linkUrl = document.getElementById('link-url');

        if (addLinkModal && linkTitle && linkUrl) {
            addLinkModal.classList.add('active');
            linkTitle.value = '';
            linkUrl.value = '';
            resetValidation(linkTitle);
            resetValidation(linkUrl);
            linkTitle.focus();
        }
    }

    function initializeModals() {
        const addLinkModal = document.getElementById('add-link-modal');
        const closeModal = document.getElementById('close-modal');
        const cancelAdd = document.getElementById('cancel-add');
        const saveLink = document.getElementById('save-link');

        function closeAddLinkModal() {
            if (addLinkModal) {
                addLinkModal.classList.remove('active');
            }
        }

        if (closeModal) closeModal.addEventListener('click', closeAddLinkModal);
        if (cancelAdd) cancelAdd.addEventListener('click', closeAddLinkModal);

        if (addLinkModal) {
            addLinkModal.addEventListener('click', function (e) {
                if (e.target === addLinkModal) closeAddLinkModal();
            });
        }

        if (saveLink) {
            saveLink.addEventListener('click', function () {
                const linkTitle = document.getElementById('link-title');
                const linkUrl = document.getElementById('link-url');
                const linkIcon = document.getElementById('link-icon');

                if (linkTitle && linkUrl) {
                    const title = linkTitle.value.trim();
                    const url = linkUrl.value.trim();
                    const iconClass = linkIcon ? linkIcon.value : 'fas fa-globe';

                    const titleValid = validateInput(linkTitle);
                    const urlValid = validateInput(linkUrl);

                    if (titleValid && urlValid) {
                        let finalUrl = url;
                        if (!url.startsWith('http://') && !url.startsWith('https://')) {
                            finalUrl = 'https://' + url;
                        }

                        quickLinks.push({ title: title, url: finalUrl, icon: iconClass });
                        saveQuickLinksToStorage();
                        renderQuickLinks();
                        closeAddLinkModal();
                        addNeonEffect('#save-link');
                    }
                }
            });
        }

        const editNoteModal = document.getElementById('edit-note-modal');
        const closeEditModalBtn = document.getElementById('close-edit-modal');
        const updateNoteBtn = document.getElementById('update-note');

        if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', closeEditModal);
        if (updateNoteBtn) updateNoteBtn.addEventListener('click', updateNote);

        if (editNoteModal) {
            editNoteModal.addEventListener('click', function (e) {
                if (e.target === editNoteModal) closeEditModal();
            });
        }

        const dailyNoteModal = document.getElementById('daily-note-modal');
        const closeDailyModal = document.getElementById('close-daily-modal');
        const cancelDailyNote = document.getElementById('cancel-daily-note');
        const saveDailyNoteBtn = document.getElementById('save-daily-note');

        if (closeDailyModal) closeDailyModal.addEventListener('click', closeDailyNoteModal);
        if (cancelDailyNote) cancelDailyNote.addEventListener('click', closeDailyNoteModal);

        if (dailyNoteModal) {
            dailyNoteModal.addEventListener('click', function (e) {
                if (e.target === dailyNoteModal) closeDailyNoteModal();
            });
        }

        if (saveDailyNoteBtn) {
            saveDailyNoteBtn.addEventListener('click', saveDailyNote);
        }
    }

    function initializeSearch() {
        const searchBtn = document.querySelector('.search-btn');
        const searchInput = document.getElementById('search-input');

        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', function () {
                if (searchInput.value.trim() !== '') {
                    window.open(`https://www.google.com/search?q=${encodeURIComponent(searchInput.value)}`, '_blank');
                    addNeonEffect('.search-btn');
                } else {
                    validateInput(searchInput);
                }
            });

            searchInput.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    searchBtn.click();
                }
            });
        }
    }

    function initializeCalendar() {
        const calPrev = document.getElementById('cal-prev');
        const calNext = document.getElementById('cal-next');
        const todayBtn = document.getElementById('today-btn');
        const toggleGregorianBtn = document.getElementById('toggle-google');

        if (calPrev) calPrev.addEventListener('click', () => navigateMonth(-1));
        if (calNext) calNext.addEventListener('click', () => navigateMonth(1));
        if (todayBtn) todayBtn.addEventListener('click', goToToday);
        if (toggleGregorianBtn) toggleGregorianBtn.addEventListener('click', toggleCalendarType);

        renderCalendar();
    }

    function navigateMonth(direction) {
        if (isGregorian) {
            currentDate.setMonth(currentDate.getMonth() + direction);
        } else {
            const jalaliDate = toJalaliDate(currentDate);
            let newMonth = jalaliDate.month + direction;
            let newYear = jalaliDate.year;

            if (newMonth < 0) {
                newMonth = 11;
                newYear--;
            } else if (newMonth > 11) {
                newMonth = 0;
                newYear++;
            }

            currentDate = toGregorianDate(newYear, newMonth, 1);
        }
        renderCalendar();
        addNeonEffect(direction === -1 ? '#cal-prev' : '#cal-next');
    }

    function goToToday() {
        currentDate = getLocalDate();
        selectedDate = null;
        renderCalendar();
        renderNotes();
        addNeonEffect('#today-btn');
    }

    function toggleCalendarType() {
        isGregorian = !isGregorian;
        renderCalendar();

        const toggleBtn = document.getElementById('toggle-google');
        if (toggleBtn) {
            toggleBtn.textContent = isGregorian ? 'شمسی' : 'میلادی';
            addNeonEffect('#toggle-google');
        }
    }

    function renderCalendar() {
        const calMonth = document.getElementById('cal-month');
        const calYear = document.getElementById('cal-year');
        const calGrid = document.getElementById('calendar-grid');
        const weekDaysContainer = document.querySelector('.week-days');

        if (!calMonth || !calYear || !calGrid || !weekDaysContainer) return;

        let month, year, monthName;

        if (isGregorian) {
            const localDate = getLocalDate(currentDate);
            month = localDate.getMonth();
            year = localDate.getFullYear();
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            monthName = months[month];

            calMonth.textContent = monthName;
            calYear.textContent = year;

            const englishWeekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            weekDaysContainer.innerHTML = '';
            englishWeekDays.forEach(day => {
                const dayElement = document.createElement('div');
                dayElement.className = 'week-day';
                dayElement.textContent = day;
                weekDaysContainer.appendChild(dayElement);
            });
        } else {
            const jalaliDate = toJalaliDate(currentDate);
            month = jalaliDate.month;
            year = jalaliDate.year;
            const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
            monthName = months[month];

            calMonth.textContent = monthName;
            calYear.textContent = year;

            const persianWeekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
            weekDaysContainer.innerHTML = '';
            persianWeekDays.forEach(day => {
                const dayElement = document.createElement('div');
                dayElement.className = 'week-day';
                dayElement.textContent = day;
                weekDaysContainer.appendChild(dayElement);
            });
        }

        calGrid.innerHTML = '';

        let firstDay, daysInMonth;
        if (isGregorian) {
            const firstDayOfMonth = getLocalDate(new Date(year, month, 1));
            firstDay = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
            daysInMonth = new Date(year, month + 1, 0).getDate();
        } else {
            const jalaliDate = toJalaliDate(currentDate);
            const firstDayGregorian = toGregorianDate(jalaliDate.year, jalaliDate.month, 1);
            firstDay = (firstDayGregorian.getDay() + 1) % 7;
            const nextMonth = jalaliDate.month === 11 ? 0 : jalaliDate.month + 1;
            const nextMonthYear = jalaliDate.month === 11 ? jalaliDate.year + 1 : jalaliDate.year;
            const firstDayNextMonth = toGregorianDate(nextMonthYear, nextMonth, 1);
            const lastDayThisMonth = new Date(firstDayNextMonth);
            lastDayThisMonth.setDate(lastDayThisMonth.getDate() - 1);
            const lastDayJalali = toJalaliDate(lastDayThisMonth);
            daysInMonth = lastDayJalali.day;
        }

        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'cal-empty';
            calGrid.appendChild(emptyCell);
        }

        const today = getLocalDate();
        const todayStr = today.toISOString().split('T')[0];

        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'cal-day';

            let cellDate;
            if (isGregorian) {
                cellDate = getLocalDate(new Date(year, month, day));
                dayElement.textContent = day;
            } else {
                const jalaliDate = toJalaliDate(currentDate);
                cellDate = toGregorianDate(jalaliDate.year, jalaliDate.month, day);
                dayElement.textContent = day;
            }

            const cellDateStr = cellDate.toISOString().split('T')[0];
            if (cellDateStr === todayStr) {
                dayElement.classList.add('today');
            }

            const hasNotes = notes.some(note => note.date === cellDateStr);
            if (hasNotes) {
                dayElement.classList.add('has-notes');
            }

            dayElement.addEventListener('click', function () {
                openDailyNoteModal(cellDate);
                addNeonEffect(this);
            });

            calGrid.appendChild(dayElement);
        }
    }

    function addNeonEffect(selector) {
        let elements;
        if (typeof selector === 'string') {
            elements = document.querySelectorAll(selector);
        } else {
            elements = [selector];
        }

        elements.forEach(element => {
            element.classList.add('neon-glow');
            setTimeout(() => {
                element.classList.remove('neon-glow');
            }, 1000);
        });
    }

});