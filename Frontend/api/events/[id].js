const { ObjectId } = require('mongodb');
const { getDb } = require('../_lib/mongo');

module.exports = async (req, res) => {
  const { id } = req.query;
  try {
    const db = await getDb();
    const _id = new ObjectId(String(id));

    if (req.method === 'GET') {
      const event = await db.collection('events').findOne({ _id });
      if (!event) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(event);
    }

    if (req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
      body.updatedAt = new Date();
      await db.collection('events').updateOne({ _id }, { $set: body });
      const updated = await db.collection('events').findOne({ _id });
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      await db.collection('events').updateOne({ _id }, { $set: { status: 'deleted', updatedAt: new Date() } });
      return res.status(204).end();
    }

    res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
    return res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error('[event by id api] error', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

