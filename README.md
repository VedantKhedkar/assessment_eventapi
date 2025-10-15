# Event Management API

A backend service for an event management platform, built using Node.js and PostgreSQL.

## Core Features

-   Event creation and management (title, date, location, capacity).
-   User registration system with checks for duplicates, capacity, and event date.
-   Ability to cancel registrations.
-   A sorted list of all upcoming events.
-   On-demand statistics for any event.

## Tech Stack

-   Node.js
-   Express
-   PostgreSQL

## Getting Started

### Prerequisites

You'll need Node.js and PostgreSQL installed on your machine.

### Setup

1.  Clone the project repository.
    ```bash
    git clone (https://github.com/VedantKhedkar/assessment_eventapi.git)
    ```

2.  Install the dependencies.
    ```bash
    npm install
    ```

3.  Set up your database. You'll need to create a user and a database in PostgreSQL.

4.  Create a `.env` file in the main project directory and add your database connection string. It should look like this:
    ```env
    DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/YOUR_DATABASE"
    ```

5.  Run the included SQL script to create the necessary tables.
    ```bash
    psql -U YOUR_USER -d YOUR_DATABASE -f database.sql
    ```

6.  Launch the server.
    ```bash
    nodemon index.js
    ```
    The server will start on `http://localhost:3000`.

## API Endpoints

Here are the main endpoints and how to use them.

---

#### **Create an Event**
`POST /events`
* **Description:** Creates a new event.
* **Body:**
    ```json
    {
      "title": "New Product Launch",
      "date": "2026-02-15T10:00:00Z",
      "location": "Main Auditorium",
      "capacity": 200
    }
    ```
* **Success Response (`201`):**
    ```json
    {
        "eventId": 4
    }
    ```

---

#### **Get Event Details**
`GET /events/:id`
* **Description:** Retrieves details for a single event, including registered users.
* **Success Response (`200`):**
    ```json
    {
        "id": 1,
        "title": "Tech Conference 2025",
        "date": "2025-11-20T09:00:00.000Z",
        "location": "Convention Center",
        "capacity": 500,
        "registered_users": []
    }
    ```

---

#### **Register for an Event**
`POST /events/:id/register`
* **Description:** Registers a user for an event.
* **Body:**
    ```json
    {
      "userId": 1
    }
    ```
* **Success Response (`201`):**
    ```json
    {
        "message": "Successfully registered for the event."
    }
    ```

---

#### **Cancel a Registration**
`DELETE /events/:eventId/registrations/:userId`
* **Description:** Cancels a user's registration for an event.
* **Success Response (`200`):**
    ```json
    {
        "message": "Registration successfully cancelled."
    }
    ```

---

#### **List Upcoming Events**
`GET /events/upcoming`
* **Description:** Returns a list of all future events, sorted by date then location.
* **Success Response (`200`):**
    ```json
    [
        {
            "id": 1,
            "title": "Tech Conference 2025",
            "date": "2025-11-20T09:00:00.000Z",
            "location": "Convention Center",
            "capacity": 500
        }
    ]
    ```
---

#### **Get Event Statistics**
`GET /events/:id/stats`
* **Description:** Retrieves statistics for a specific event.
* **Success Response (`200`):**
    ```json
    {
        "total_registrations": 1,
        "remaining_capacity": 499,
        "percentage_used": 0.2
    }
    ```