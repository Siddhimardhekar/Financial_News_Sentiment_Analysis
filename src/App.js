import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
} from "react-router-dom";
import { Line, Pie } from "react-chartjs-2";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Tooltip,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
} from "chart.js";
import "chartjs-adapter-date-fns";

// Import CSS files
import "./App.css";
import "./portfolio.css";
import "./company-details.css";

// Register Chart.js elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

// ----- MOCK DATA -----
const mockData = [
  {
    name: "Apple Inc.",
    symbol: "AAPL",
    recommendation: "Buy",
    sentiment: 0.34,
    articles: [
      { title: "Apple hits new record high", url: "https://www.investors.com/news/technology/apple-stock-record-high-strong-holiday-sales/#:~:text=On%20the%20stock%20market%20today,0.3%25%20to%20close%20at%20255.27." },
      { title: "Apple Chief Tim Cook, With Rs 544 Crore Salary, Gets 18% Pay Rise", url: "https://www.ndtv.com/world-news/apple-chief-tim-cook-with-rs-544-crore-salary-gets-18-pay-rise-7448884" },
    ],
    value: 100000,
    beta: 1.20,
    volAvg: 75000000,
    mktCap: 2200000000000,
    lastDiv: 0.22,
  },
  {
    name: "Microsoft Corporation",
    symbol: "MSFT",
    recommendation: "Hold",
    sentiment: 0.12,
    articles: [
      { title: "Microsoft invests in AI startup", url: "https://news.microsoft.com/en-in/microsoft-announces-us-3bn-investment-over-two-years-in-india-cloud-and-ai-infrastructure-to-accelerate-adoption-of-ai-skilling-and-innovation/#:~:text=Gift%20Cards-,Microsoft%20announces%20US%20%243bn%20investment%20over%20two%20years%20in,of%20AI%2C%20skilling%20and%20innovation" },
    ],
    value: 75000,
    beta: 0.98,
    volAvg: 35000000,
    mktCap: 1800000000000,
    lastDiv: 0.56,
  },
  {
    name: "Google LLC",
    symbol: "GOOGL",
    recommendation: "Strong Buy",
    sentiment: 0.65,
    articles: [
      { title: "Google unveils new AI tech", url: "https://blog.google/technology/google-deepmind/google-gemini-ai-update-december-2024/" },
      { title: "Google Cloud expands", url: "https://cloud.google.com/blog/products/identity-security/google-cloud-expands-cve-program" },
    ],
    value: 120000,
    beta: 1.10,
    volAvg: 1500000,
    mktCap: 1500000000000,
    lastDiv: 0,
  },
];

// Finnhub API key
const API_KEY = "cu120l9r01qjiermt8tgcu120l9r01qjiermt8u0";

// Helper function to compute moving average from a series of data points
function computeMovingAverage(data, windowSize) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < windowSize - 1) {
      result.push({ x: data[i].x, y: null });
    } else {
      const windowData = data.slice(i - windowSize + 1, i + 1);
      const sum = windowData.reduce((acc, point) => acc + point.y, 0);
      const avg = sum / windowSize;
      result.push({ x: data[i].x, y: avg });
    }
  }
  return result;
}

// Helper function to get recommendation color with more visible choices
function getRecommendationColor(recommendation) {
  switch (recommendation) {
    case "Buy":
      return "#2ecc71"; // Bright green
    case "Strong Buy":
      return "#27ae60"; // Darker green
    case "Hold":
      return "#f39c12"; // Orange shade for better visibility
    default:
      return "#34495e"; // Default dark color
  }
}

// ----- PORTFOLIO COMPONENT -----
function Portfolio() {
  const [data, setData] = useState([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [livePrices, setLivePrices] = useState({});
  const [dayHighs, setDayHighs] = useState({});
  const [dayLows, setDayLows] = useState({});
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    setData(mockData);
    const totalVal = mockData.reduce((acc, stock) => acc + (stock.value || 0), 0);
    setPortfolioValue(totalVal);
  }, []);

  // Fetch live data using Finnhub's REST API for each stock every 3 seconds
  useEffect(() => {
    const fetchData = () => {
      data.forEach((stock) => {
        axios
          .get(
            `https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${API_KEY}`
          )
          .then((response) => {
            const quote = response.data;
            // Finnhub quote returns:
            // c: current price, h: high price of the day, l: low price of the day
            const currentPrice = quote.c;
            setLivePrices((prevPrices) => ({
              ...prevPrices,
              [stock.symbol]: currentPrice,
            }));
            setDayHighs((prevHighs) => ({
              ...prevHighs,
              [stock.symbol]: quote.h,
            }));
            setDayLows((prevLows) => ({
              ...prevLows,
              [stock.symbol]: quote.l,
            }));
          })
          .catch((error) => {
            console.error(`Error fetching quote for ${stock.symbol}:`, error);
          });
      });
    };
    // Fetch immediately and then every 3 seconds
    fetchData();
    const intervalId = setInterval(fetchData, 3000);
    return () => clearInterval(intervalId);
  }, [data]);

  const updateRecommendations = () => {
    setLoading(true);
    setIsBlurred(true); // Activate blur effect

    // Simulate a 1-minute loading process
    setTimeout(() => {
      setLoading(false);
      setIsBlurred(false); // Remove blur effect
      window.location.reload(); // Refresh the page
      alert("Database fulfilled"); // Show alert message
    }, 15000); // 1 minute = 60000 milliseconds
  };

  const computedLabels =
    portfolioValue > 0
      ? data.map(
          (s) => `${s.name} (${((s.value / portfolioValue) * 100).toFixed(1)}%)`
        )
      : data.map((s) => s.name);

  const pieChartData = {
    labels: computedLabels,
    datasets: [
      {
        data: data.map((s) => s.value || 0),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
        ],
      },
    ],
  };

  return (
    <div className={`portfolio ${isBlurred ? "blur-effect" : ""}`}>
      <header className="portfolio-header">
        <h1>Stock Portfolio Analysis</h1>
        <h2>Total Holdings: ${portfolioValue.toLocaleString()}</h2>
      </header>
      <div className="update-section">
        <button
          className="update-button"
          onClick={updateRecommendations}
          disabled={loading}
        >
          {loading ? "Updating Recommendations..." : "Update Recommendations"}
        </button>
        {loading && <div className="loading-spinner"></div>}
      </div>
      <div className="portfolio-content">
        <div className="chart-section">
          <h3>Portfolio Distribution</h3>
          <div className="pie-chart">
            <Pie data={pieChartData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="table-section">
          <h3>Stock Details</h3>
          <div className="table-container">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Symbol</th>
                  <th>Recommendation</th>
                  <th>Sentiment</th>
                  <th>Asset Value</th>
                  <th>Live Price</th>
                  <th>Day Low</th>
                  <th>Day High</th>
                </tr>
              </thead>
              <tbody>
                {data.map((stock, idx) => (
                  <tr key={idx}>
                    <td>
                      <Link
                        to={`/company/${stock.symbol}`}
                        className="company-link"
                        title="Click for details"
                      >
                        {stock.name}
                      </Link>
                    </td>
                    <td>{stock.symbol}</td>
                    <td
                      style={{
                        color: getRecommendationColor(stock.recommendation),
                      }}
                    >
                      {stock.recommendation}
                    </td>
                    <td>
                      {stock.sentiment !== undefined
                        ? stock.sentiment.toFixed(2)
                        : "N/A"}
                    </td>
                    <td>
                      ${stock.value ? stock.value.toLocaleString() : "N/A"}
                    </td>
                    <td>
                      $
                      {livePrices[stock.symbol]
                        ? livePrices[stock.symbol].toFixed(2)
                        : "N/A"}
                    </td>
                    <td>
                      $
                      {dayLows[stock.symbol]
                        ? dayLows[stock.symbol].toFixed(2)
                        : "N/A"}
                    </td>
                    <td>
                      $
                      {dayHighs[stock.symbol]
                        ? dayHighs[stock.symbol].toFixed(2)
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----- COMPANY DETAILS COMPONENT -----
function CompanyDetails() {
  const { symbol } = useParams();
  const stock = mockData.find((s) => s.symbol === symbol);
  const [priceData, setPriceData] = useState([]);
  const [quote, setQuote] = useState(null);

  // Fetch live quote data from Finnhub REST API every 3 seconds
  useEffect(() => {
    const fetchQuote = () => {
      axios
        .get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`)
        .then((response) => {
          const data = response.data;
          // data.c: current price, data.h: high, data.l: low, data.o: open, data.pc: previous close
          setQuote(data);
          // Append current price to priceData for charting
          setPriceData((prev) => [...prev, { x: new Date(), y: data.c }]);
        })
        .catch((error) => {
          console.error(`Error fetching quote for ${symbol}:`, error);
        });
    };
    fetchQuote();
    const intervalId = setInterval(fetchQuote, 3000);
    return () => clearInterval(intervalId);
  }, [symbol]);

  const dayHigh = quote && quote.h ? quote.h : null;
  const dayLow = quote && quote.l ? quote.l : null;
  const movingAvgData = computeMovingAverage(priceData, 5);

  const lineData = {
    datasets: [
      {
        label: `${symbol} Live Price`,
        data: priceData,
        borderColor: "#3498db",
        backgroundColor: "rgba(52, 152, 219, 0.1)",
      },
      {
        label: `${symbol} Moving Average`,
        data: movingAvgData.filter((d) => d.y !== null),
        borderColor: "#e74c3c",
        borderDash: [5, 5],
        fill: false,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    scales: {
      x: {
        type: "time",
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
      <div className="not-found-container">
        <Typography variant="h5">No stock found for symbol: {symbol}</Typography>
        <Link to="/" className="back-link">← Back to Portfolio</Link>
      </div>
    );
  }

  const betaInterpretation =
    stock.beta === 1
      ? "Company is stable"
      : stock.beta > 1
      ? "Company is doing great"
      : "Company is under performing";

  return (
    <div className="company-details-container">
      <Link to="/" className="back-link">← Back to Portfolio</Link>
      <div className="content-grid">
        {/* Left Column */}
        <div className="main-content">
          <Typography variant="h4" className="company-name">{stock.name}</Typography>
          <div className="stock-info">
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
          </div>
          <div className="price-metrics">
            <Typography variant="subtitle1">
              <strong>Day Low:</strong> {dayLow ? `$${dayLow.toFixed(2)}` : "N/A"}
            </Typography>
            <Typography variant="subtitle1">
              <strong>Day High:</strong> {dayHigh ? `$${dayHigh.toFixed(2)}` : "N/A"}
            </Typography>
          </div>
          <div className="chart-container">
            <div className="chart-header">
              <Typography variant="h6" className="section-title">
                Live Price Chart
              </Typography>
              <Tooltip
                title="Moving Average is the average of the last 5 data points, which smooths out short-term fluctuations to help identify trends."
                arrow
              >
                <span style={{ marginLeft: "5px", cursor: "help" }}>ℹ️</span>
              </Tooltip>
            </div>
            <div className="chart-wrapper">
              <Line data={lineData} options={lineOptions} key={priceData.length} redraw />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="metrics-sidebar">
          <Typography variant="h6" className="section-title">
            Additional Metrics
          </Typography>
          <TableContainer component={Paper} className="metrics-table">
            <Table size="small">
              <TableBody>
                <TableRow>
                  <Tooltip
                    title="Beta measures the stock's volatility compared to the overall market. A beta of 1 indicates the stock moves in line with the market."
                    arrow
                  >
                    <TableCell className="metric-name">Beta</TableCell>
                  </Tooltip>
                  <TableCell className="metric-value">
                    {stock.beta !== undefined ? stock.beta : "N/A"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <Tooltip
                    title="Beta Interpretation: Beta = 1 indicates a stable company; >1 suggests the company is doing great (more volatile/upside potential); <1 may indicate under performance."
                    arrow
                  >
                    <TableCell className="metric-name">Beta Interpretation</TableCell>
                  </Tooltip>
                  <TableCell className="metric-value">
                    {stock.beta !== undefined ? betaInterpretation : "N/A"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <Tooltip
                    title="Average Volume represents the average number of shares traded over a given period, indicating the stock's liquidity."
                    arrow
                  >
                    <TableCell className="metric-name">Vol Avg</TableCell>
                  </Tooltip>
                  <TableCell className="metric-value">
                    {stock.volAvg !== undefined ? stock.volAvg.toLocaleString() : "N/A"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <Tooltip
                    title="Market Capitalization is the total market value of a company's outstanding shares, reflecting its size."
                    arrow
                  >
                    <TableCell className="metric-name">Mkt Cap</TableCell>
                  </Tooltip>
                  <TableCell className="metric-value">
                    {stock.mktCap !== undefined ? "$" + stock.mktCap.toLocaleString() : "N/A"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <Tooltip
                    title="Last Dividend is the most recent dividend paid per share by the company."
                    arrow
                  >
                    <TableCell className="metric-name">Last Div</TableCell>
                  </Tooltip>
                  <TableCell className="metric-value">
                    {stock.lastDiv !== undefined ? stock.lastDiv : "N/A"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>

      <div className="news-section">
        <Typography variant="h6" className="section-title">
          Supporting News
        </Typography>
        {stock.articles && stock.articles.length > 0 ? (
          <ul className="news-list">
            {stock.articles.map((article, idx) => (
              <li key={idx}>
                <a href={article.url} target="_blank" rel="noreferrer" className="news-link">
                  {article.title}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <Typography variant="body1">No relevant articles found.</Typography>
        )}
      </div>
    </div>
  );
}

// ----- MAIN APP COMPONENT -----
export default function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/company/:symbol" element={<CompanyDetails />} />
      </Routes>
    </Router>
  );
}