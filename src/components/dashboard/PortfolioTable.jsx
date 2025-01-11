import React from 'react';

const PortfolioTable = ({onSelectCompany }) => {
    const portfolioData = [
        { id: 1, symbol: 'AAPL', name: 'Apple Inc.', shares: 100, currentPrice: 178.72, value: 17872, change: 2.5, recommendation: 'Buy' },
        { id: 2, symbol: 'GOOGL', name: 'Google', shares: 50, currentPrice: 141.80, value: 7090, change: -1.2, recommendation: 'Hold' },
        { id: 3, symbol: 'TSLA', name: 'Tesla', shares: 75, currentPrice: 238.45, value: 17883.75, change: 0.8, recommendation: 'Sell' },
    ];

    return (
        <div className="portfolio-table">
            <table style={{ width: '100%' }}>
                <thead>
                    <tr>
                        <th>Symbol</th>
                        <th>Name</th>
                        <th>Shares</th>
                        <th>Price</th>
                        <th>Value</th>
                        <th>Change</th>
                        <th>Recommendation</th>
                    </tr>
                </thead>
                <tbody>
                    {portfolioData.map((asset) => (
                        <tr key={asset.id}>
                            <td>{asset.symbol}</td>
                            <td onClick={() => onSelectCompany(asset.company)}>{asset.name}</td>
                            <td>{asset.shares}</td>
                            <td>${asset.currentPrice.toFixed(2)}</td>
                            <td>${asset.value.toFixed(2)}</td>
                            <td className={asset.change >= 0 ? 'positive' : 'negative'}>
                                {asset.change}%
                            </td>
                            <td>{asset.recommendation}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PortfolioTable;