import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import './App.css';

// Register the required components
ChartJS.register(ArcElement, Tooltip, Legend);

const App = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [recommendation, setRecommendation] = useState("");
  const [overallSentiment, setOverallSentiment] = useState(0);
  const [relevantArticles, setRelevantArticles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/portfolio")
      .then((response) => {
        setPortfolio(response.data);
      })
      .catch((error) => {
        console.error("Error fetching portfolio:", error);
      });
  }, []);

  useEffect(() => {
    if (selectedSymbol) {
      setLoading(true);
      axios.get(`http://127.0.0.1:5000/analyze/${selectedSymbol}`)
        .then((response) => {
          setRecommendation(response.data.recommendation);
          setOverallSentiment(response.data.overall_sentiment);
          setRelevantArticles(response.data.relevant_articles);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [selectedSymbol]);

  // Mock data for portfolio value (replace with actual data from your backend)
  const portfolioValue = portfolio.reduce((total, company) => total + (company.value || 0), 0);

  const pieChartData = {
    labels: portfolio.map(company => company.name),
    datasets: [
      {
        data: portfolio.map(company => (company.value || 0) / portfolioValue * 100),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
        ],
        hoverBackgroundColor: [
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
    <div className="app">
      <header className="header">
        <h1>Stock Portfolio Analysis</h1>
      </header>
      
      <div className="container">
        <nav className="sidebar">
          <h2>Your Portfolio</h2>
          <ul>
            {portfolio.map((company, index) => (
              <li key={index}>
                <button
                  onClick={() => setSelectedSymbol(company.symbol)}
                  className={`company-button ${selectedSymbol === company.symbol ? 'active' : ''}`}
                >
                  <span className="company-name">{company.name}</span>
                  <span className="company-symbol">{company.symbol}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="content">
          {selectedSymbol ? (
            <div className="analysis-container">
              <h2>Analysis for {selectedSymbol}</h2>
              {loading ? (
                <div className="loading">Loading analysis...</div>
              ) : (
                <>
                  <div className="metrics">
                    <div className="metric-card">
                      <h3>Recommendation</h3>
                      <p className="metric-value">{recommendation}</p>
                    </div>
                  </div>

                  <div className="news-section">
                    <h3>Recent News</h3>
                    {relevantArticles.length > 0 ? (
                      <ul className="news-list">
                        {relevantArticles.map((article, index) => (
                          <li key={index}>
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="news-link"
                            >
                              {article.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-news">No relevant news found</p>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="dashboard">
              <h2>Portfolio Overview</h2>
              <div className="portfolio-summary">
                <div className="portfolio-value">
                  <h3>Total Portfolio Value</h3>
                  <p>${portfolioValue.toLocaleString()}</p>
                </div>
                <div className="portfolio-chart">
                  {/* Add a key to force re-render */}
                  <Pie data={pieChartData} key={portfolioValue} />
                </div>
              </div>
              <TableContainer component={Paper} className="portfolio-table">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Company Name</TableCell>
                      <TableCell>Symbol</TableCell>
                      <TableCell>Value</TableCell>
                      <TableCell>Percentage of Portfolio</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {portfolio.map((company, index) => (
                      <TableRow key={index}>
                        <TableCell>{company.name}</TableCell>
                        <TableCell>{company.symbol}</TableCell>
                        <TableCell>${(company.value || 0).toLocaleString()}</TableCell>
                        <TableCell>{((company.value || 0) / portfolioValue * 100).toFixed(2)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;