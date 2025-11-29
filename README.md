# 🤟 Live Sign Language Translator

A full-stack web application for real-time sign language translation with user authentication and modern UI.

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** (Backend)
- **Node.js 16+** (Frontend)
- **MongoDB** (Database - Local or Atlas)

### 1. Clone & Setup

```powershell
# Clone the repository
git clone <your-repo-url>
cd "Live Sign Language Translator UI"
```

### 2. Backend Setup

```powershell
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate

# Install dependencies
pip install -r requirements.txt

# Configure MongoDB connection in .env
# MONGODB_URI=mongodb+srv://your-connection-string

# Start backend server
uvicorn app.main:app --reload
```

Backend runs at: **http://localhost:8000**
- API Docs: http://localhost:8000/docs

### 3. Frontend Setup

```powershell
# Open new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 📋 Environment Configuration

### Backend `.env`
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:8000
```

---

## 🏗️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database with Motor (async driver)
- **Pydantic** - Data validation
- **JWT** - Secure authentication
- **Passlib** - Password hashing

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Radix UI** - Component primitives
- **Lucide React** - Icons

---

## 📁 Project Structure

```
├── backend/
│   ├── app/
│   │   ├── models/          # MongoDB Pydantic models
│   │   ├── routers/         # API endpoints (auth, translator)
│   │   ├── schemas/         # Request/Response schemas
│   │   ├── utils/           # Auth helpers
│   │   ├── config.py        # Settings
│   │   ├── database.py      # MongoDB connection
│   │   └── main.py          # FastAPI app
│   ├── requirements.txt
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── components/      # React components
    │   │   ├── ui/         # Reusable UI components
    │   │   ├── Home.tsx
    │   │   ├── Login.tsx
    │   │   ├── Signup.tsx
    │   │   ├── Profile.tsx
    │   │   └── Translator.tsx
    │   ├── contexts/        # Auth & Theme contexts
    │   ├── services/        # API service layer
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    └── .env
```

---

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Translation
- `POST /api/translate` - Translate sign language
- `GET /api/translate/status` - Service status

---

## 💾 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  username: String (unique, indexed),
  hashed_password: String,
  is_active: Boolean,
  created_at: DateTime,
  updated_at: DateTime
}
```

---

## 🎯 Features

- ✅ User authentication with JWT
- ✅ MongoDB integration for flexible data storage
- ✅ Protected routes
- ✅ Responsive UI with dark/light theme
- ✅ Real-time form validation
- ✅ Toast notifications
- ✅ Loading states
- 🚧 Sign language translation (in development)

---

## 🐛 Troubleshooting

### Backend Issues

**Port 8000 in use:**
```powershell
uvicorn app.main:app --reload --port 8001
# Update VITE_API_URL in frontend/.env
```

**MongoDB connection error:**
- Verify your connection string in `.env`
- Check network access in MongoDB Atlas
- Whitelist your IP address

### Frontend Issues

**CORS errors:**
- Ensure backend is running
- Check `VITE_API_URL` matches backend URL
- Verify `FRONTEND_URL` in backend `.env`

**Dependencies error:**
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

---

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- HttpOnly cookies
- CORS protection
- Protected API routes
- MongoDB unique indexes

---

## 🚀 Deployment

### Backend (Render, Railway, Fly.io)
1. Set environment variables
2. Install dependencies: `pip install -r requirements.txt`
3. Run: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel, Netlify)
1. Set `VITE_API_URL` to production backend URL
2. Build: `npm run build`
3. Deploy `dist` folder

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for accessible communication**
