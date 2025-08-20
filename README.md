# Agriculture App - React Native & Node.js

A comprehensive React Native application for agriculture management with AI-powered features, IoT integration, and real-time analytics.

## 🏗️ Project Structure

```
agriculture-app/
├── client/                 # React Native (Expo) Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── screens/        # App screens
│   │   ├── services/       # API services
│   │   ├── contexts/       # React Context providers
│   │   ├── navigation/     # Navigation configuration
│   │   ├── utils/          # Utility functions
│   │   └── assets/         # Images, fonts, etc.
│   ├── app.json           # Expo configuration
│   ├── package.json       # Client dependencies
│   └── ...
├── server/                # Node.js Backend API
│   ├── config/            # Database & app configuration
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Express middleware
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic services
│   ├── utils/             # Server utilities
│   ├── uploads/           # File uploads
│   ├── server.js          # Main server file
│   ├── package.json       # Server dependencies
│   └── ...
├── docs/                  # Documentation
├── scripts/               # Build & deployment scripts
├── package.json          # Root workspace configuration
├── .env                  # Environment variables
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

## 🚀 Features

### Frontend (React Native)
- **AI Dashboard**: Crop analysis and recommendations
- **Disease Detection**: ML-powered plant disease identification
- **IoT Integration**: Real-time sensor data monitoring
- **Market Insights**: Price predictions and market trends
- **Financial Management**: Expense tracking and budgeting
- **Community Features**: Farmer networking and knowledge sharing
- **Analytics**: Comprehensive farming analytics

### Backend (Node.js/Express)
- **RESTful API**: Complete CRUD operations
- **Authentication**: JWT-based user authentication
- **File Uploads**: Image processing for crop analysis
- **Database Integration**: MongoDB with Mongoose ODM
- **Security**: Helmet, CORS, input validation
- **Logging**: Winston-based logging system
- **API Documentation**: Swagger/OpenAPI integration

## 📋 Prerequisites

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0 (or yarn)
- **Expo CLI**: `npm install -g @expo/cli`
- **MongoDB**: Local installation or cloud instance
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

## 🛠️ Installation

### Option 1: Install Everything at Once
```bash
# Clone the repository
git clone <repository-url>
cd agriculture-app

# Install all dependencies (root, client, server)
npm run install:all
```

### Option 2: Manual Installation
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

## 🏃‍♂️ Running the Application

### Development Mode (Recommended)
```bash
# Start both client and server concurrently
npm run dev

# Or start them separately:
npm run dev:server    # Start backend only
npm run dev:client    # Start frontend only
```

### Production Mode
```bash
# Start server in production
npm run start:server

# Build client for production
npm run build:client
```

## 📱 Client Development

```bash
cd client

# Start development server
npm start

# Run on specific platforms
npm run android     # Android emulator/device
npm run ios         # iOS simulator (macOS only)
npm run web         # Web browser

# Other commands
npm run lint        # Lint code
npm test           # Run tests
```

## 🖥️ Server Development

```bash
cd server

# Start development server (with nodemon)
npm run dev

# Start production server
npm start

# Database operations
npm run seed        # Seed database with sample data
npm run migrate     # Run database migrations

# Other commands
npm test           # Run tests
npm run logs       # View application logs
```

## 🔧 Configuration

### Environment Variables

Create `.env` files in both root and server directories:

**Root `.env`:**
```env
NODE_ENV=development
```

**Server `.env`:**
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/agriculture-app
JWT_SECRET=your-jwt-secret-key
API_BASE_URL=http://localhost:3000
```

**Client Configuration:**
Update `client/app.json` for Expo configuration and API endpoints.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run client tests only
npm run test:client

# Run server tests only
npm run test:server
```

## 📝 Code Quality

```bash
# Lint all code
npm run lint

# Lint client code only
npm run lint:client

# Lint server code only
npm run lint:server
```

## 🧹 Maintenance

```bash
# Clean all node_modules and build artifacts
npm run clean

# Clean client only
npm run clean:client

# Clean server only
npm run clean:server
```

## 📚 API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:3000/api-docs`
- API Health: `http://localhost:3000/api/health`

## 🔄 Development Workflow

1. **Start Development**: `npm run dev`
2. **Make Changes**: Edit files in `client/src/` or `server/`
3. **Test Changes**: Both servers auto-reload on file changes
4. **Test API**: Use provided test scripts or Postman
5. **Build for Production**: `npm run build:client`

## 🚀 Deployment

### Server Deployment
- Configure production environment variables
- Set up MongoDB connection
- Deploy to platforms like Heroku, AWS, or DigitalOcean

### Client Deployment
- **Mobile**: Build and publish to App Store/Play Store via EAS
- **Web**: Deploy to Netlify, Vercel, or similar platforms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   # Kill process using port 3000
   npx kill-port 3000
   ```

2. **Metro Bundler Issues**:
   ```bash
   cd client
   npx expo start -c  # Clear cache
   ```

3. **Database Connection Issues**:
   - Ensure MongoDB is running
   - Check connection string in `.env`

4. **Build Failures**:
   ```bash
   npm run clean
   npm run install:all
   ```

### Getting Help

- Check the `docs/` directory for detailed documentation
- Review server logs: `npm run logs` (from server directory)
- Enable debug mode by setting `NODE_ENV=development`

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check existing documentation in `docs/`
- Review troubleshooting section above
