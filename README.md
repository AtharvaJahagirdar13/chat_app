# Real-Time Chat Application (MERN + Socket.io)

![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js)
![Express](https://img.shields.io/badge/API-Express-000000?logo=express)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb)
![Socket.io](https://img.shields.io/badge/Realtime-Socket.io-010101?logo=socket.io)
![JWT](https://img.shields.io/badge/Auth-JWT-black?logo=jsonwebtokens)
![TailwindCSS](https://img.shields.io/badge/UI-TailwindCSS-38B2AC?logo=tailwindcss)
![Zustand](https://img.shields.io/badge/State-Zustand-purple)
![Deployment](https://img.shields.io/badge/Deployment-Render-blue)

A full-stack real-time chat application built using the MERN stack with WebSocket-based communication. This project demonstrates secure authentication, live messaging, scalable backend performance, and production-ready deployment practices.

---

## Overview

This application enables users to communicate instantly using WebSockets while maintaining persistent chat history via REST APIs. It combines stateless JWT authentication, real-time event-driven messaging, and modern frontend state management.

The project focuses on real-world system design concepts including concurrency handling, performance benchmarking, and deployable architecture.

---

## Live Demo

**Live Link:**  
https://chat-app-vs5u.onrender.com/

---

Project Snap-shot 

<img width="935" height="897" alt="image" src="https://github.com/user-attachments/assets/e2c9b366-d5f4-4555-81ab-a481f2142451" />


<img width="1881" height="527" alt="image" src="https://github.com/user-attachments/assets/2fe9acad-65bc-4cbd-a074-4f4e7e9a4eab" />

---
## Architecture

<img width="737" height="438" alt="Architecture Diagram" src="https://github.com/user-attachments/assets/6bedee56-da6c-47c0-a8be-2db18c5451ec" />

The system follows a layered architecture:

- **Frontend**: React application with global state management
- **Backend**: Node.js + Express REST APIs and Socket.io server
- **Database**: MongoDB Atlas for persistent storage
- **Realtime Layer**: WebSocket-based bidirectional communication

---

## Key Features

- Secure authentication using JWT (HTTP-only cookies)
- Real-time messaging powered by Socket.io
- Online/offline user presence tracking
- Persistent chat history with MongoDB
- Profile management with image uploads
- Global state management using Zustand
- Robust client and server error handling
- Performance-tested backend scalability

---

## Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS + DaisyUI
- Zustand (state management)
- Axios

### Backend
- Node.js
- Express.js
- Socket.io (WebSockets)
- JWT Authentication
- MongoDB Atlas
- Mongoose

### Tooling
- Autocannon (load testing)

---

## Performance Testing

The backend was load-tested using Autocannon to evaluate concurrency handling and latency behavior.

**Results (Local Benchmark):**
- Sustained ~12k requests/sec throughput
- Sub-20ms latency under moderate load
- Stable performance up to ~200 concurrent connections
- Gradual latency increase observed beyond 300 connections

This validates efficient event-loop utilization and non-blocking request handling.

---

## Project Structure

```bash
chat_app/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── models/
│   │   └── lib/
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   └── lib/
│   └── package.json


