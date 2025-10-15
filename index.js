require('dotenv').config();
const express = require('express');
const db = require('./db');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Event Management API is running.' });
});

app.post('/users', async (req, res) => {
    const { name, email } = req.body;
    const result = await db.query('INSERT INTO users(name, email) VALUES($1, $2) RETURNING id', [name, email]);
    res.status(201).json({ userId: result.rows[0].id, name, email });
});

app.post('/events', async (req, res) => {
  const { title, date, location, capacity } = req.body;

  if (!Number.isInteger(capacity) || capacity <= 0 || capacity > 1000) {
    return res.status(400).json({ error: 'Capacity must be a positive integer up to 1000.' });
  }

  try {
    const sql = `
      INSERT INTO events (title, date, location, capacity)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `;
    const params = [title, date, location, capacity];
    const result = await db.query(sql, params);
    res.status(201).json({ eventId: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

app.get('/events/upcoming', async (req, res) => {
  try {
    const sql = `
      SELECT * FROM events
      WHERE date > NOW()
      ORDER BY date ASC, location ASC;
    `;
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

app.get('/events/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const sql = `
      SELECT
        e.id, e.title, e.date, e.location, e.capacity,
        COALESCE(
          (SELECT json_agg(json_build_object('id', u.id, 'name', u.name, 'email', u.email))
           FROM event_registrations er
           JOIN users u ON er.user_id = u.id
           WHERE er.event_id = e.id),
          '[]'::json
        ) AS registered_users
      FROM events e
      WHERE e.id = $1;
    `;
    const result = await db.query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

app.post('/events/:id/register', async (req, res) => {
  const { id: eventId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const eventQuery = 'SELECT date, capacity FROM events WHERE id = $1 FOR UPDATE;';
    const eventResult = await client.query(eventQuery, [eventId]);
    if (eventResult.rows.length === 0) throw new Error('Event not found.');

    const event = eventResult.rows[0];
    if (new Date(event.date) < new Date()) throw new Error('Cannot register for a past event.');

    const regQuery = 'SELECT * FROM event_registrations WHERE user_id = $1 AND event_id = $2;';
    const regResult = await client.query(regQuery, [userId, eventId]);
    if (regResult.rows.length > 0) throw new Error('User is already registered for this event.');

    const countQuery = 'SELECT COUNT(*) FROM event_registrations WHERE event_id = $1;';
    const countResult = await client.query(countQuery, [eventId]);
    const registrationCount = parseInt(countResult.rows[0].count, 10);
    if (registrationCount >= event.capacity) throw new Error('Event is full.');

    const insertQuery = 'INSERT INTO event_registrations (user_id, event_id) VALUES ($1, $2);';
    await client.query(insertQuery, [userId, eventId]);

    await client.query('COMMIT');
    res.status(201).json({ message: 'Successfully registered for the event.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(409).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.delete('/events/:eventId/registrations/:userId', async (req, res) => {
  const { eventId, userId } = req.params;

  try {
    const deleteQuery = 'DELETE FROM event_registrations WHERE event_id = $1 AND user_id = $2 RETURNING *;';
    const result = await db.query(deleteQuery, [eventId, userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Registration not found.' });
    }

    res.status(200).json({ message: 'Registration successfully cancelled.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

app.get('/events/:id/stats', async (req, res) => {
  const { id } = req.params;
  try {
    const eventQuery = 'SELECT capacity FROM events WHERE id = $1;';
    const regsQuery = 'SELECT COUNT(*) AS total_registrations FROM event_registrations WHERE event_id = $1;';

    const [eventResult, regsResult] = await Promise.all([
      db.query(eventQuery, [id]),
      db.query(regsQuery, [id])
    ]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const capacity = eventResult.rows[0].capacity;
    const total_registrations = parseInt(regsResult.rows[0].total_registrations, 10);
    const remaining_capacity = capacity - total_registrations;
    const percentage_used = capacity > 0 ? (total_registrations / capacity) * 100 : 0;

    res.json({
      total_registrations,
      remaining_capacity,
      percentage_used: parseFloat(percentage_used.toFixed(2))
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});