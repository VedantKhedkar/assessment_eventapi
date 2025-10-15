DROP TABLE IF EXISTS event_registrations;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    location VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0 AND capacity <= 1000)
);

CREATE TABLE event_registrations (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, event_id)
);

INSERT INTO users (name, email) VALUES
('Alice Johnson', 'alice@example.com'),
('Bob Williams', 'bob@example.com');

INSERT INTO events (title, date, location, capacity) VALUES
('Tech Conference 2025', '2025-11-20T09:00:00Z', 'Convention Center', 500),
('Local Hackathon', '2025-12-05T10:00:00Z', 'Community Hall', 100),
('Past Concert', '2024-05-15T19:00:00Z', 'City Arena', 1000);