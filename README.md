# Financial_News_Sentiment_Analysis
Sentiment analysis / Recommendation engine for Investor’s Asset Portfolio

A comprehensive web application for analyzing investment portfolios with real-time market data, sentiment analysis, and automated recommendations.

## 🚀 Features

- **User Authentication & Management**
  - Secure signup and login
  - JWT-based authentication
  - Password reset functionality
  - Session management

- **Portfolio Management**
  - Multiple portfolio support
  - Real-time portfolio valuation
  - Asset transaction tracking
  - Performance analytics
  - Portfolio diversification insights

- **Market Analysis**
  - Real-time stock price updates
  - Historical price tracking
  - News sentiment analysis
  - Automated trading recommendations
  - Custom alerts and notifications

- **Automated Updates**
  - Periodic price updates
  - News aggregation
  - Sentiment analysis
  - Recommendation generation
  - Portfolio rebalancing alerts

## 🛠️ Technology Stack

- **Frontend**
  - React.js
  - TailwindCSS
  - Recharts for data visualization
  - Axios for API calls

- **Backend**
  - Python
  - Flask
  - SQLite3
  - JWT for authentication
  - Natural for NLP

- **External APIs**
  - Finnhub for financial data
  - News APIs for market news

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- SQLite3
- Git

## 🔧 Installation

1. **Clone the repository**
```bash
git clone https://github.com/Siddhimardhekar/Financial_News_Sentiment_Analysis.git
cd portfolio-analyzer
```

2. **Set up environment variables**
```bash
# Create .env files in both frontend and backend directories
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. **Install dependencies**
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

4. **Initialize the database**
```bash
cd ../backend
npm run init-db
```

5. **Start the development servers**
```bash
# Start backend server (from backend directory)
npm run dev

# Start frontend server (from frontend directory)
npm start
```

## 🗄️ Database Schema

The application uses SQLite with the following main tables:
- `users` - User authentication and profile data
- `portfolios` - User portfolio information
- `assets` - Portfolio holdings and current values
- `transactions` - Trading history
- `news` - Financial news articles
- `recommendations` - Generated trading recommendations

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/forgot-password` - Password reset

### Portfolio Management
- `GET /api/portfolios` - List user portfolios
- `POST /api/portfolios` - Create new portfolio
- `GET /api/portfolios/:id` - Get portfolio details
- `PUT /api/portfolios/:id` - Update portfolio
- `DELETE /api/portfolios/:id` - Delete portfolio

### Assets
- `POST /api/portfolios/:id/assets` - Add asset
- `GET /api/portfolios/:id/assets` - List assets
- `PUT /api/portfolios/:id/assets/:assetId` - Update asset
- `DELETE /api/portfolios/:id/assets/:assetId` - Remove asset

### Analysis
- `GET /api/analysis/recommendations` - Get recommendations
- `GET /api/analysis/news` - Get related news
- `GET /api/analysis/sentiment` - Get sentiment analysis

## 🔒 Environment Variables

### Backend
```env
PORT=5000
JWT_SECRET=your_jwt_secret
NEWS_API_KEY=your_finnhub_api_key
DATABASE_URL=path_to_sqlite_db
```

### Frontend
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_UPDATE_INTERVAL=300000
```

## 🔍 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## 🚀 Deployment

The application can be deployed using various platforms:

### Backend
- Heroku
- DigitalOcean
- AWS EC2

### Frontend
- Netlify
- Vercel
- GitHub Pages

## 📈 Performance Optimization

- Implemented caching for API responses
- Optimized database queries with proper indexing
- Used connection pooling for database operations
- Implemented rate limiting for API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 👥 Authors

- Siddhi Mardhekar - ([https://github.com/Siddhimardhekar])
- Suyash
- Utkarsh
- Dharmika
- Abhishek
- Jason

## 🙏 Acknowledgments

- Finnhub for providing financial data API
- React community for excellent UI components
