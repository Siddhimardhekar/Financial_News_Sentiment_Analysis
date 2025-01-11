import React, { useEffect, useState } from "react";

const TopNews = ({ company }) => {
  const [news, setNews] = useState([]);

  // Static news data based on the company name
  const staticNewsData = {
    Tesla: [
      {
        title: "Tesla's New Model S Launches",
        description:
          "Tesla announces a new electric car model, the Model S, with enhanced features and technology.",
        url: "https://example.com/news1",
        publishedAt: "2025-01-09T14:30:00Z",
      },
      {
        title: "Tesla's Stock Hits Record High",
        description:
          "Tesla's stock price reaches an all-time high after the announcement of new partnerships.",
        url: "https://example.com/news2",
        publishedAt: "2025-01-08T10:00:00Z",
      },
    ],
    Apple: [
      {
        title: "Apple's Earnings Report Shows Strong Growth",
        description:
          "Apple announces better-than-expected earnings for Q4 2024, driven by iPhone sales.",
        url: "https://example.com/news1",
        publishedAt: "2025-01-10T12:00:00Z",
      },
      {
        title: "Apple Announces New iPhone Features",
        description:
          "Apple introduces new features in the iPhone 15 that could change the smartphone industry.",
        url: "https://example.com/news2",
        publishedAt: "2025-01-07T14:00:00Z",
      },
    ],
    Amazon: [
      {
        title: "Amazon Expands Its Reach with New Services",
        description:
          "Amazon announces a major expansion of its cloud services and logistics network.",
        url: "https://example.com/news1",
        publishedAt: "2025-01-06T11:00:00Z",
      },
      {
        title: "Amazon Prime Membership Hits New Milestone",
        description:
          "Amazon Prime surpasses 200 million subscribers worldwide, according to recent reports.",
        url: "https://example.com/news2",
        publishedAt: "2025-01-05T09:30:00Z",
      },
    ],
  };

  useEffect(() => {
    if (company && staticNewsData[company]) {
      setNews(staticNewsData[company]);
    }
  }, [company]);

  return (
    <div className="space-y-4">
      {news.length > 0 ? (
        news.map((article, index) => (
          <div key={index} className="p-4 border rounded-md shadow-sm">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl font-bold text-blue-600"
            >
              {article.title}
            </a>
            <p className="text-sm text-gray-600">{article.description}</p>
            <span className="text-xs text-gray-400">
              {new Date(article.publishedAt).toLocaleString()}
            </span>
          </div>
        ))
      ) : (
        <div className="text-center">No news available for {company}</div>
      )}
    </div>
  );
};

export default TopNews;
