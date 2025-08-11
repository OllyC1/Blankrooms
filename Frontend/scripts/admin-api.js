const adminApi = {
  async fetchEvents() {
    const res = await fetch('/api/events', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load events');
    return res.json();
  },
  async createEvent(payload) {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create event');
    return res.json();
  },
  async updateEvent(id, payload) {
    const res = await fetch(`/api/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update event');
    return res.json();
  },
  async deleteEvent(id) {
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) throw new Error('Failed to delete event');
  },
};

window.adminApi = adminApi;

