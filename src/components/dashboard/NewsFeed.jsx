import React from 'react';

const NewsFeed = () => {
    const newsData = [
        {
            id: 1,
            symbol: 'AAPL',
            title: 'Apple Reports Strong iPhone Sales',
            sentiment: 'positive',
            timestamp: new Date().toISOString()
        },
        {
            id: 2,
            symbol: 'GOOGL',
            title: 'Google Announces New AI Features',
            sentiment: 'positive',
            timestamp: new Date().toISOString()
        },
        {
            id: 3,
            symbol: 'TSLA',
            title: 'Tesla Production Updates',
            sentiment: 'neutral',
            timestamp: new Date().toISOString()
        }
    ];

    return (
        <div className="news-feed" style={{ padding: "20px", border: "1px solid #ccc" }}>
            <h2>Latest News</h2>
            <div className="news-items">
                {newsData.map((news) => (
                    <div
                        key={news.id}
                        className="news-item"
                        style={{ marginBottom: "10px", border: "1px solid #ddd", padding: "10px" }}
                    >
                        <div className="symbol">{news.symbol}</div>
                        <div className="title">{news.title}</div>
                        <div className="timestamp">
                            {new Date(news.timestamp).toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
    
};

export default NewsFeed;