class AdminStore {
  constructor() {
    this.storageKey = 'blankrooms_admin_events';
    this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        this.events = JSON.parse(raw);
      } else {
        // seed from global EVENTS_DATA if available
        const seed = (typeof EVENTS_DATA !== 'undefined') ? Object.values(EVENTS_DATA) : [];
        this.events = seed;
        this.save();
      }
    } catch {
      this.events = [];
      this.save();
    }
    this.syncWindow();
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.events));
    this.syncWindow();
    // Also dispatch an event so other pages can react if needed
    try { window.dispatchEvent(new Event('blankrooms:events-updated')); } catch {}
  }

  syncWindow() {
    if (typeof window !== 'undefined') {
      const map = {};
      this.events.forEach(ev => { map[ev.id] = ev; });
      window.EVENTS_DATA = map;
    }
  }

  getEvents() { return [...this.events]; }

  getEventById(id) { return this.events.find(e => String(e.id) === String(id)); }

  nextId() {
    const maxId = this.events.reduce((m, e) => Math.max(m, Number(e.id) || 0), 0);
    return maxId + 1;
  }

  addEvent(event) {
    const newEvent = { ...event, id: event.id || this.nextId() };
    this.events.push(newEvent);
    this.save();
    return newEvent;
  }

  updateEvent(id, updates) {
    const idx = this.events.findIndex(e => String(e.id) === String(id));
    if (idx === -1) return null;
    this.events[idx] = { ...this.events[idx], ...updates };
    this.save();
    return this.events[idx];
  }

  deleteEvent(id) {
    this.events = this.events.filter(e => String(e.id) !== String(id));
    this.save();
  }
}

window.adminStore = new AdminStore();