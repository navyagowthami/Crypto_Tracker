# Crypto Tracker

A comprehensive cryptocurrency portfolio management application with real-time data, portfolio tracking, price alerts, and news updates. Built with React, Tailwind CSS, and JSON-Server.

## Features

- 📊 **Real-time Market Data**: View live cryptocurrency prices and market data from CoinGecko API
- 💼 **Portfolio Management**: Full CRUD operations to track your cryptocurrency investments
- 🔔 **Price Alerts**: Set and manage price alerts for your favorite cryptocurrencies
- 📰 **News Updates**: Stay informed with the latest cryptocurrency news
- 📄 **PDF Export**: Export your portfolio to PDF for record-keeping
- 📱 **Responsive Design**: Beautiful, modern UI that works on all devices

## Tech Stack

- **Frontend**: React 19, Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Backend**: JSON-Server
- **Icons**: React Icons
- **Notifications**: React Toastify
- **PDF Export**: jsPDF, jsPDF-AutoTable

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation

1. Clone the repository or navigate to the project directory:
```bash
cd crypto-tracker
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Start JSON-Server (Backend)

In one terminal window, start the JSON-Server:
```bash
npm run server
```

The JSON-Server will run on `http://localhost:3001`

### Start the Development Server

In another terminal window, start the Vite development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
crypto-tracker/
├── src/
│   ├── components/       # Reusable components
│   │   ├── Navbar.jsx
│   │   └── CryptoCard.jsx
│   ├── pages/           # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Portfolio.jsx
│   │   ├── Alerts.jsx
│   │   └── News.jsx
│   ├── services/        # API services
│   │   └── api.js
│   ├── App.jsx          # Main app component with routing
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── db.json              # JSON-Server database
├── package.json
└── README.md
```

## Usage

### Dashboard
- View real-time cryptocurrency prices
- Search for specific cryptocurrencies
- Navigate through pages of market data
- Data refreshes automatically every 30 seconds

### Portfolio
- Add cryptocurrency investments with purchase details
- View portfolio summary (total value, cost, profit/loss)
- Edit or delete portfolio items
- Export portfolio to PDF

### Alerts
- Create price alerts for cryptocurrencies
- Set target prices and conditions (above/below)
- Alerts automatically check every 30 seconds
- Activate/deactivate alerts as needed

### News
- Browse latest cryptocurrency news
- Search through news articles
- Click to read full articles on external sites

## API Endpoints

The application uses JSON-Server for backend data:

- `GET /portfolio` - Get all portfolio items
- `POST /portfolio` - Create a new portfolio item
- `PUT /portfolio/:id` - Update a portfolio item
- `DELETE /portfolio/:id` - Delete a portfolio item

- `GET /alerts` - Get all alerts
- `POST /alerts` - Create a new alert
- `PUT /alerts/:id` - Update an alert
- `DELETE /alerts/:id` - Delete an alert

External APIs used:
- CoinGecko API for cryptocurrency market data
- CryptoCompare API for news (with fallback)

## CRUD Operations

The application implements full CRUD operations:

- **Create**: Add new portfolio items and alerts
- **Read**: View portfolio, alerts, and market data
- **Update**: Edit existing portfolio items and alerts
- **Delete**: Remove portfolio items and alerts

## Development

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Lint
```bash
npm run lint
```

## Notes

- The application uses free-tier APIs which may have rate limits
- JSON-Server data persists in `db.json`
- Alerts check prices every 30 seconds when active
- Market data refreshes automatically on the Dashboard

## License

This project is open source and available for educational purposes.

Demonstration Video Link: https://drive.google.com/file/d/1HIfoBZQwgEnFF2nr4VhTCfeO371rBQZA/view?usp=drivesdk 

Code Explanation Video Link: https://drive.google.com/file/d/1_S5a_w30f18kbDe5GSPDKd2PfBA836Ay/view?usp=drivesdk
