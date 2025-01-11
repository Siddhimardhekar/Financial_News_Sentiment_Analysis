// App.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
} from "react-router-dom";

// MUI Components
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";

// Chart.js imports and registration
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,       // For time-based x-axis in line chart
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,      // Needed for Pie charts
} from "chart.js";
import "chartjs-adapter-date-fns"; // Date adapter for time scale
import { Line, Pie } from "react-chartjs-2";

// Register all required Chart.js elements and scales
ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,      // Register TimeScale so that "time" is recognized
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement      // Register ArcElement (for Pie charts)
);

// ----- MOCK DATA -----
// Each company includes "value" representing its current asset's value.
const mockData = [
  {
    name: "Apple Inc.",
    symbol: "AAPL",
    recommendation: "Buy",
    sentiment: 0.34,
    articles: [
      { title: "Apple hits new record high", url: "https://example.com/apple-high" },
      { title: "iPhone 15 rumors ramp up", url: "https://example.com/iphone15" },
    ],
    value: 100000,
  },
  {
    name: "Microsoft Corporation",
    symbol: "MSFT",
    recommendation: "Hold",
    sentiment: 0.12,
    articles: [
      { title: "Microsoft invests in AI startup", url: "https://example.com/msft-ai" },
    ],
    value: 75000,
  },
  {
    name: "Google LLC",
    symbol: "GOOGL",
    recommendation: "Strong Buy",
    sentiment: 0.65,
    articles: [
      { title: "Google unveils new AI tech", url: "https://example.com/google-ai" },
      { title: "Google Cloud expands", url: "https://example.com/google-cloud" },
    ],
    value: 120000,
  },
];

// ----- MAIN APP COMPONENT -----
export default function App() {
  return (
    <Router>
      <Routes>
        {/* Portfolio (home) route */}
        <Route path="/" element={<Portfolio />} />
        {/* Company details route */}
        <Route path="/company/:symbol" element={<CompanyDetails />} />
      </Routes>
    </Router>
  );
}

// ----- PORTFOLIO PAGE -----
function Portfolio() {
  const [data, setData] = useState([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load initial data on mount (using mock data)
  useEffect(() => {
    setData(mockData);
    const totalVal = mockData.reduce((acc, stock) => acc + (stock.value || 0), 0);
    setPortfolioValue(totalVal);
  }, []);

  // Function to call backend to update recommendations manually
  const updateRecommendations = () => {
    setLoading(true);
    axios.get("http://localhost:5000/calculate-recommendations")
      .then((response) => {
        // Assume the backend returns an array of recommendations with the original asset value included.
        const updatedData = response.data;
        setData(updatedData);
        const totalVal = updatedData.reduce((acc, stock) => acc + (stock.value || 0), 0);
        setPortfolioValue(totalVal);
      })
      .catch((error) => {
        console.error("Error updating recommendations:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Compute Pie chart labels including percentage contribution
  const computedLabels =
    portfolioValue > 0
      ? data.map(
          (s) =>
            `${s.name} (${((s.value / portfolioValue) * 100).toFixed(1)}%)`
        )
      : data.map((s) => s.name);

  // Pie chart data for portfolio distribution
  const pieChartData = {
    labels: computedLabels,
    datasets: [
      {
        data: data.map((s) => s.value || 0),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
      },
    ],
  };

  return (
    <div style={{ padding: 20 }}>
      <Typography variant="h4" gutterBottom>
        Stock Portfolio Analysis
      </Typography>
      <Typography variant="h6">
        Total Holdings: ${portfolioValue.toLocaleString()}
      </Typography>
      <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={updateRecommendations}
          disabled={loading}
        >
          {loading ? "Updating Recommendations..." : "Update Recommendations"}
        </Button>
        {loading && <CircularProgress style={{ marginLeft: 10 }} />}
      </div>
      <div style={{ display: "flex", gap: "2rem", marginTop: "2rem" }}>
        {/* Left side: Pie Chart */}
        <div style={{ width: 300, height: 300 }}>
          <Pie data={pieChartData} key={data.length} />
        </div>
        {/* Right side: Table of stocks with asset info */}
        <TableContainer component={Paper} style={{ flex: 1 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Company Name</TableCell>
                <TableCell>Symbol</TableCell>
                <TableCell>Recommendation</TableCell>
                <TableCell>Sentiment</TableCell>
                <TableCell>Asset Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((stock, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Tooltip title="Click for details" arrow placement="right">
                      <Link
                        to={`/company/${stock.symbol}`}
                        style={{ textDecoration: "underline", cursor: "pointer" }}
                      >
                        {stock.name}
                      </Link>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{stock.symbol}</TableCell>
                  <TableCell>{stock.recommendation}</TableCell>
                  <TableCell>
                    {stock.sentiment !== undefined
                      ? stock.sentiment.toFixed(2)
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    ${stock.value ? stock.value.toLocaleString() : "N/A"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
}

// ----- COMPANY DETAILS PAGE -----
function CompanyDetails() {
  const { symbol } = useParams();
  const stock = mockData.find((s) => s.symbol === symbol);

  // Simulated live price data (array of { x: Date, y: number })
  const [priceData, setPriceData] = useState([]);
  const [wsConnection, setWsConnection] = useState(null);

  // Establish a WebSocket connection on mount (using an echo server for demo)
  useEffect(() => {
    const ws = new WebSocket("wss://echo.websocket.org");
    setWsConnection(ws);

    ws.onopen = () => {
      console.log("WebSocket connected for symbol:", symbol);
      // Optionally, send a subscription message
      // ws.send(JSON.stringify({ action: "subscribe", symbol }));
    };

    ws.onmessage = (event) => {
      // Assume we get a plain number string, e.g., "123.45"
      const newPrice = parseFloat(event.data);
      if (!isNaN(newPrice)) {
        setPriceData((prev) => [...prev, { x: new Date(), y: newPrice }]);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket closed for symbol:", symbol);
    };

    return () => {
      console.log("Closing WebSocket for symbol:", symbol);
      ws.close();
    };
  }, [symbol]);

  // Every 3 seconds, send a random price to simulate live updates
  useEffect(() => {
    if (!wsConnection) return;
    const interval = setInterval(() => {
      const randomPrice = (100 + Math.random() * 10).toFixed(2);
      wsConnection.send(randomPrice);
    }, 3000);
    return () => clearInterval(interval);
  }, [wsConnection]);

  const lineData = {
    datasets: [
      {
        label: `${symbol} Live Price`,
        data: priceData, // array of { x: Date, y: number }
        borderColor: "blue",
        backgroundColor: "rgba(0, 0, 255, 0.3)",
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    scales: {
      x: {
        type: "time", // Uses the registered TimeScale and date-fns adapter
        time: {
          unit: "second",
          displayFormats: {
            second: "HH:mm:ss",
          },
        },
      },
      y: {
        beginAtZero: false,
      },
    },
  };

  if (!stock) {
    return (
      <div style={{ padding: 20 }}>
        <Typography variant="h5">
          No stock found for symbol: {symbol}
        </Typography>
        <Link to="/">← Back to Portfolio</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <Link to="/">← Back to Portfolio</Link>
      <Typography variant="h4" gutterBottom>{stock.name}</Typography>
      <Typography variant="subtitle1">
        <strong>Symbol:</strong> {stock.symbol}
      </Typography>
      <Typography variant="subtitle1">
        <strong>Recommendation:</strong> {stock.recommendation}
      </Typography>
      <Typography variant="subtitle1">
        <strong>Sentiment:</strong>{" "}
        {stock.sentiment !== undefined ? stock.sentiment.toFixed(2) : "N/A"}
      </Typography>
      <Typography variant="subtitle1">
        <strong>Asset Value:</strong> ${stock.value.toLocaleString()}
      </Typography>

      <Typography variant="h6" style={{ marginTop: "1rem" }}>
        Supporting News
      </Typography>
      {stock.articles && stock.articles.length > 0 ? (
        <ul>
          {stock.articles.map((article, idx) => (
            <li key={idx}>
              <a href={article.url} target="_blank" rel="noreferrer">
                {article.title}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <Typography variant="body1">No relevant articles found.</Typography>
      )}

      <Typography variant="h6" style={{ marginTop: "2rem" }}>
        Live Price Chart
      </Typography>
      <div style={{ width: 600, maxWidth: "90%" }}>
        <Line data={lineData} options={lineOptions} key={priceData.length} redraw />
      </div>
    </div>
  );
}
