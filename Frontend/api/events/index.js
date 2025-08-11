const { getDb } = require('../_lib/mongo');

module.exports = async (req, res) => {
  try {
    const db = await getDb();

    if (req.method === 'GET') {
      const events = await db
        .collection('events')
        .find({ status: { $ne: 'deleted' } })
        .sort({ date: 1 })
        .toArray();
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(events);
    }

    if (req.method === 'POST') {
      // TODO: add admin auth check using JWT
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
      const doc = {
        title: body.title,
        date: body.date,
        location: body.location,
        price: Number(body.price || 0),
        image: body.image,
        description: body.description || '',
        features: Array.isArray(body.features)
          ? body.features
          : String(body.features || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const { insertedId } = await db.collection('events').insertOne(doc);
      return res.status(201).json({ id: insertedId, ...doc });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error('[events api] error', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

