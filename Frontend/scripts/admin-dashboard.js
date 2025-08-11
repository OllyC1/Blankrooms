class AdminDashboard {
  constructor() {
    console.log('AdminDashboard constructor called');
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
    this.setAdminInfo();
  }

  setAdminInfo() {
    // Admin authentication is already checked in DOMContentLoaded, just set the name
    const user = window.auth.getCurrentUser();
    if (user && user.name) {
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

    // When switching to events section, ensure table is populated (and reloaded)
    if (key === 'events') {
      this.populateTables();
    }
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

  async populateTables() {
    // Events table (load from API if available)
    const tbody = document.getElementById('eventsTableBody');
    let events = [];
    try {
      const apiEvents = await window.adminApi.fetchEvents();
      // Normalize MongoDB _id to id for consistency
      events = apiEvents.map(e => ({
        ...e,
        id: e._id || e.id
      }));
      console.log('Loaded events from API:', events);
    } catch (err) {
      console.log('API failed, using fallback:', err);
      events = window.adminStore ? window.adminStore.getEvents() : (EVENTS_DATA ? Object.values(EVENTS_DATA) : []);
    }
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
      btn.addEventListener('click', async () => {
        if (action === 'edit') this.openEventForm(events.find(ev => String(ev._id || ev.id) === String(id)));
        if (action === 'delete') {
          if (confirm('Delete this event?')) {
            try { await window.adminApi.deleteEvent(id); } catch { /* fallback */ window.adminStore.deleteEvent(id); }
            this.populateTables();
          }
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
        <td>Demo User</td>
        <td>${t.ticketType}</td>
        <td>${t.quantity}</td>
        <td>${t.status}</td>
        <td><button class="btn-secondary" data-action="view" data-id="${t.id}">View</button></td>
      </tr>
    `).join('');
  }

  getAllDemoTickets() {
    const demoUser = { name: 'Demo User' };
    return demoUser?.tickets || [];
  }

  bindAddEdit() {
    const addBtn = document.getElementById('addNewBtn');
    if (addBtn) {
      console.log('Add New button found, binding click event');
      addBtn.addEventListener('click', () => {
        console.log('Add New button clicked!');
        this.openEventForm();
      });
    } else {
      console.error('Add New button not found!');
    }

    // Modal basic wiring
    const closeBtn = document.getElementById('closeModal');
    closeBtn.addEventListener('click', () => document.getElementById('adminModal').classList.remove('show'));
  }

  openEventForm(event = null) {
    console.log('Opening event form...', event ? 'editing' : 'adding');
    const modal = document.getElementById('adminModal');
    if (!modal) {
      console.error('Modal not found!');
      return;
    }
    document.getElementById('modalTitle').textContent = event ? 'Edit Event' : 'Add Event';
    const e = event || { title:'', date:'', location:'', image:'', description:'', features:[], ticketTypes: [] };

    const body = document.getElementById('modalBody');
    body.innerHTML = `
      <form id="eventForm" class="admin-form">
        <div class="form-grid">
          <div>
            <label for="eventTitle">Event Title</label>
            <input type="text" id="eventTitle" name="title" value="${e.title}" required placeholder="Enter event title">
          </div>
          <div>
            <label for="eventDate">Event Date</label>
            <input type="date" id="eventDate" name="date" value="${this.parseDateInput(e.date)}" required>
          </div>
          <div>
            <label for="eventLocation">Location</label>
            <input type="text" id="eventLocation" name="location" value="${e.location}" placeholder="Event venue or location">
          </div>
          <div>
            <label for="eventImage">Event Image</label>
            <input type="file" id="eventImage" name="imageFile" accept="image/*">
          </div>
        </div>
        
        <div>
          <label for="eventDescription">Description</label>
          <textarea id="eventDescription" name="description" rows="4" placeholder="Describe your event...">${e.description || ''}</textarea>
        </div>
        
        <div>
          <label for="eventFeatures">Features (comma-separated)</label>
          <input type="text" id="eventFeatures" name="features" value="${(e.features||[]).join(', ')}" placeholder="e.g. live music, food, drinks">
        </div>
        
        <div class="ticket-types-section">
          <div class="ticket-types-header">
            <h4>Ticket Types</h4>
            <p>Add at least one ticket type with name and price</p>
          </div>
          <div id="ticketTypes"></div>
          <button type="button" class="btn-secondary" id="addTicketType">+ Add Another Ticket Type</button>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn-secondary" id="cancelForm">Cancel</button>
          <button type="submit" class="btn-primary">${event ? 'Save Changes' : 'Create Event'}</button>
        </div>
      </form>
    `;

    modal.classList.add('show');

    const ticketTypesContainer = document.getElementById('ticketTypes');
    const renderTicketTypes = (list) => {
      console.log('Rendering ticket types:', list);
      ticketTypesContainer.innerHTML = '';
      list.forEach((t, idx) => {
        const row = document.createElement('div');
        row.className = 'ticket-type-row';
        row.innerHTML = `
          <div class="ticket-type-inputs">
            <div>
              <label for="ticketName${idx}">Ticket Name</label>
              <input type="text" id="ticketName${idx}" placeholder="e.g., Early Access, VIP, General Admission" value="${t.name || ''}" data-idx="${idx}" data-key="name">
            </div>
            <div>
              <label for="ticketPrice${idx}">Price (£)</label>
              <input type="number" id="ticketPrice${idx}" step="0.01" min="0" placeholder="0.00" value="${t.price || ''}" data-idx="${idx}" data-key="price">
            </div>
            <div>
              <label>&nbsp;</label>
              <button type="button" data-remove="${idx}" class="btn-secondary">Remove</button>
            </div>
          </div>
        `;
        ticketTypesContainer.appendChild(row);
      });
    };
    let ticketTypes = Array.isArray(e.ticketTypes) ? e.ticketTypes : [];
    // If no ticket types exist, start with one empty row
    if (ticketTypes.length === 0) {
      ticketTypes.push({ name: '', price: '' });
    }
    renderTicketTypes(ticketTypes);
    // Add ticket type button
    document.getElementById('addTicketType').addEventListener('click', () => { 
      console.log('Adding new ticket type');
      ticketTypes.push({ name: '', price: '' }); 
      renderTicketTypes(ticketTypes); 
    });
    
    // Handle input changes without re-rendering (to prevent disappearing text)
    ticketTypesContainer.addEventListener('input', (evt) => {
      const target = evt.target;
      const idx = Number(target.getAttribute('data-idx'));
      const key = target.getAttribute('data-key');
      
      if (!Number.isNaN(idx) && key && ticketTypes[idx]) {
        // Update the data array directly without re-rendering
        ticketTypes[idx][key] = target.value;
        console.log(`Updated ticket ${idx}.${key} to:`, target.value);
        console.log('Current ticketTypes:', ticketTypes);
      }
    });
    
    // Handle remove button clicks
    ticketTypesContainer.addEventListener('click', (evt) => {
      const removeBtn = evt.target.closest('[data-remove]');
      if (removeBtn) {
        evt.preventDefault();
        const idx = Number(removeBtn.getAttribute('data-remove'));
        if (!Number.isNaN(idx) && ticketTypes.length > 1) { 
          console.log('Removing ticket type at index:', idx);
          ticketTypes.splice(idx, 1); 
          renderTicketTypes(ticketTypes); 
        } else if (ticketTypes.length === 1) {
          alert('You must have at least one ticket type.');
        }
      }
    });

    document.getElementById('cancelForm').addEventListener('click', () => modal.classList.remove('show'));
    document.getElementById('eventForm').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const form = ev.target;
      const fd = new FormData(form);
      const data = Object.fromEntries(fd.entries());
      const features = (data.features || '').split(',').map(s => s.trim()).filter(Boolean);
      const validTicketTypes = ticketTypes.filter(t => t.name && t.price && !Number.isNaN(Number(t.price))).map(t => ({ 
        name: t.name.trim(), 
        price: Number(t.price) 
      }));
      
      // Validate that at least one ticket type is provided
      if (validTicketTypes.length === 0) {
        alert('Please add at least one valid ticket type with both name and price.');
        return;
      }
      
      const normalized = {
        title: data.title,
        date: this.formatDateOutput(data.date),
        location: data.location,
        description: data.description,
        features,
        ticketTypes: validTicketTypes
      };

      // Upload image if file provided (optional; fallback to keep existing image)
      const file = fd.get('imageFile');
      if (file && file.size > 0) {
        try {
          const upload = await this.uploadImageToVercel(file);
          if (upload?.url) normalized.image = upload.url;
        } catch (err) { console.warn('Image upload failed', err); }
      }

      try {
        console.log('Saving event data:', normalized);
        if (event && (event._id || event.id)) { 
          const result = await window.adminApi.updateEvent(event._id || event.id, normalized); 
          console.log('Event updated:', result);
        } else { 
          const result = await window.adminApi.createEvent(normalized); 
          console.log('Event created:', result);
        }
        alert('Event saved successfully!');
      } catch (apiErr) {
        console.error('API error:', apiErr);
        alert('Error saving event: ' + apiErr.message);
        // Fallback to local store if API not available
        if (event) { window.adminStore.updateEvent(event.id, normalized); }
        else { window.adminStore.addEvent(normalized); }
      }

      modal.classList.remove('show');
      this.populateOverview();
      this.populateTables();
    });
  }

  async uploadImageToVercel(file) {
    // Placeholder for future direct upload integration (Vercel Blob or S3). For now, convert to data URL.
    // Warning: Data URLs are large; this is for quick demo only. For production, switch to Vercel Blob or S3.
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ url: reader.result });
      reader.onerror = reject;
      reader.readAsDataURL(file);
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

// Dashboard initialization is now handled in the HTML file after authentication