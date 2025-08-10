class AdminDashboard {
  constructor() {
    this.sections = {
      overview: document.getElementById('overview-section'),
      events: document.getElementById('events-section'),
      tickets: document.getElementById('tickets-section'),
      videos: document.getElementById('videos-section'),
      playlists: document.getElementById('playlists-section'),
      scanner: document.getElementById('scanner-section'),
      users: document.getElementById('users-section')
    };

    this.bindNav();
    this.populateOverview();
    this.populateTables();
    this.bindAddEdit();
    this.bindScanner();
    this.ensureAdmin();
  }

  ensureAdmin() {
    if (!window.authManager.isAuthenticated() || !window.authManager.hasRole('admin')) {
      window.location.href = 'signin.html?redirect=' + encodeURIComponent('admin-dashboard.html');
    } else {
      const user = window.authManager.getCurrentUser();
      document.getElementById('adminName').textContent = user.name;
    }
  }

  bindNav() {
    document.querySelectorAll('.nav-link').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('nav-link--active'));
        btn.classList.add('nav-link--active');
        const key = btn.dataset.section;
        this.switchSection(key);
      });
    });
  }

  switchSection(key) {
    // Update header
    const titleMap = {
      overview: 'Overview', events: 'Events', tickets: 'Tickets', videos: 'Videos', playlists: 'Playlists', scanner: 'QR Scanner', users: 'Users'
    };
    document.getElementById('pageTitle').textContent = titleMap[key] || 'Overview';

    const subtitleMap = {
      overview: 'Welcome to your admin dashboard',
      events: 'Manage events, dates and capacity',
      tickets: 'Track and manage ticket sales',
      videos: 'Upload and manage videos',
      playlists: 'Create and manage playlists',
      scanner: 'Scan customer tickets for entry',
      users: 'Manage users and roles'
    };
    document.getElementById('pageSubtitle').textContent = subtitleMap[key] || '';

    Object.keys(this.sections).forEach(k => {
      if (this.sections[k]) this.sections[k].classList.toggle('hidden', k !== key);
    });
  }

  populateOverview() {
    // Aggregate simple stats from EVENTS_DATA and demo users
    const events = EVENTS_DATA ? Object.values(EVENTS_DATA) : [];
    const totalEvents = events.length;
    const ticketsSold = this.getAllDemoTickets().reduce((acc, t) => acc + (t.quantity || 0), 0);
    const revenue = this.getAllDemoTickets().reduce((acc, t) => acc + (t.price || 0) * (t.quantity || 1), 0);
    const totalUsers = 2; // from demo users

    document.getElementById('totalEvents').textContent = totalEvents;
    document.getElementById('totalTickets').textContent = ticketsSold;
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('totalRevenue').textContent = '£' + revenue.toFixed(2);

    // Recent events
    const recentEvents = events.slice(0, 5).map(e => `
      <div class="recent-item">
        <div><strong>${e.title}</strong></div>
        <div style="color: var(--gray-600)">${e.date || ''} — ${e.location || ''}</div>
      </div>
    `).join('');
    document.getElementById('recentEvents').innerHTML = recentEvents || '<div>No events</div>';

    // Recent tickets (from demo)
    const recentTickets = this.getAllDemoTickets().slice(0, 6).map(t => `
      <div class="recent-item">
        <div><strong>${t.eventTitle}</strong> — ${t.ticketType} x${t.quantity}</div>
        <div style="color: var(--gray-600)">£${(t.price || 0).toFixed(2)}</div>
      </div>
    `).join('');
    document.getElementById('recentTickets').innerHTML = recentTickets || '<div>No tickets</div>';
  }

  populateTables() {
    // Events table
    const tbody = document.getElementById('eventsTableBody');
    const events = window.adminStore ? window.adminStore.getEvents() : (EVENTS_DATA ? Object.values(EVENTS_DATA) : []);
    tbody.innerHTML = events.map(e => `
      <tr>
        <td>${e.title}</td>
        <td>${e.date || ''}</td>
        <td>${e.location || ''}</td>
        <td>${(e.ticketsSold || 0)}</td>
        <td>£${(e.revenue || 0).toFixed(2)}</td>
        <td style="white-space: nowrap;">
          <button class="btn-secondary" data-action="edit" data-id="${e.id}">Edit</button>
          <button class="btn-secondary" data-action="delete" data-id="${e.id}">Delete</button>
        </td>
      </tr>
    `).join('');

    // Bind row actions
    tbody.querySelectorAll('button[data-action]')?.forEach(btn => {
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      btn.addEventListener('click', () => {
        if (action === 'edit') this.openEventForm(window.adminStore.getEventById(id));
        if (action === 'delete') {
          if (confirm('Delete this event?')) { window.adminStore.deleteEvent(id); this.populateTables(); }
        }
      });
    });

    // Tickets table (demo)
    const tbodyT = document.getElementById('ticketsTableBody');
    const tickets = this.getAllDemoTickets();
    tbodyT.innerHTML = tickets.map(t => `
      <tr>
        <td>${t.id}</td>
        <td>${t.eventTitle}</td>
        <td>${window.authManager.demoUsers['user@demo.com'].name}</td>
        <td>${t.ticketType}</td>
        <td>${t.quantity}</td>
        <td>${t.status}</td>
        <td><button class="btn-secondary" data-action="view" data-id="${t.id}">View</button></td>
      </tr>
    `).join('');
  }

  getAllDemoTickets() {
    const demoUser = window.authManager.demoUsers['user@demo.com'];
    return demoUser?.tickets || [];
  }

  bindAddEdit() {
    const addBtn = document.getElementById('addNewBtn');
    addBtn.addEventListener('click', () => this.openEventForm());

    // Modal basic wiring
    const closeBtn = document.getElementById('closeModal');
    closeBtn.addEventListener('click', () => document.getElementById('adminModal').classList.remove('show'));
  }

  openEventForm(event = null) {
    const modal = document.getElementById('adminModal');
    document.getElementById('modalTitle').textContent = event ? 'Edit Event' : 'Add Event';
    const e = event || { title:'', date:'', location:'', price:0, image:'', description:'', features:[] };

    const body = document.getElementById('modalBody');
    body.innerHTML = `
      <form id="eventForm" class="admin-form">
        <div class="form-grid">
          <label>Title<input type="text" name="title" value="${e.title}" required></label>
          <label>Date<input type="date" name="date" value="${this.parseDateInput(e.date)}" required></label>
          <label>Location<input type="text" name="location" value="${e.location}"></label>
          <label>Price (£)<input type="number" step="0.01" min="0" name="price" value="${e.price || 0}"></label>
          <label>Image URL<input type="url" name="image" value="${e.image}" placeholder="https://images.unsplash.com/..." required></label>
        </div>
        <label>Description<textarea name="description" rows="4">${e.description || ''}</textarea></label>
        <label>Features (comma-separated)<input type="text" name="features" value="${(e.features||[]).join(', ')}"></label>
        <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:16px;">
          <button type="button" class="btn-secondary" id="cancelForm">Cancel</button>
          <button type="submit" class="btn-primary">${event ? 'Save' : 'Add Event'}</button>
        </div>
      </form>
    `;

    modal.classList.add('show');

    document.getElementById('cancelForm').addEventListener('click', () => modal.classList.remove('show'));
    document.getElementById('eventForm').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const form = ev.target;
      const data = Object.fromEntries(new FormData(form).entries());
      const features = (data.features || '').split(',').map(s => s.trim()).filter(Boolean);
      const normalized = {
        title: data.title,
        date: this.formatDateOutput(data.date),
        location: data.location,
        price: parseFloat(data.price || '0'),
        image: data.image,
        description: data.description,
        features
      };

      if (event) { window.adminStore.updateEvent(event.id, normalized); }
      else { window.adminStore.addEvent(normalized); }

      modal.classList.remove('show');
      this.populateOverview();
      this.populateTables();
    });
  }

  parseDateInput(d) {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return '';
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth()+1).padStart(2,'0');
    const dd = String(dt.getDate()).padStart(2,'0');
    return `${yyyy}-${mm}-${dd}`;
  }

  formatDateOutput(input) {
    // Store as human readable like other pages (e.g., 3 March 2025)
    const dt = new Date(input);
    if (isNaN(dt)) return input;
    return dt.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
  }

  bindScanner() {
    const video = document.getElementById('scannerVideo');
    const startBtn = document.getElementById('startScanBtn');
    const stopBtn = document.getElementById('stopScanBtn');
    const testBtn = document.getElementById('testScanBtn');
    const resultEl = document.getElementById('scanResult');

    if (!video || !window.productionQRScanner) return;

    window.productionQRScanner.initialize(video, (result) => {
      resultEl.style.display = 'block';
      resultEl.innerHTML = result.success
        ? `<div style="color:#0a7">✅ ${result.message}<br><small>${result.ticket.eventTitle} — ${result.ticket.ticketType} x${result.ticket.quantity}</small></div>`
        : `<div style="color:#a00">❌ ${result.message}</div>`;
    });

    startBtn.addEventListener('click', async () => {
      startBtn.style.display = 'none';
      stopBtn.style.display = 'inline-block';
      try { await window.productionQRScanner.startScanning(); } catch(e) { alert(e.message); }
    });

    stopBtn.addEventListener('click', () => {
      window.productionQRScanner.stopScanning();
      stopBtn.style.display = 'none';
      startBtn.style.display = 'inline-block';
    });

    testBtn.addEventListener('click', () => window.productionQRScanner.testWithDemoTicket());
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new AdminDashboard();
});