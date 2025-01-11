import React, { useState } from "react";
import Header from '../components/layout/Header';
import PortfolioTable from '../components/dashboard/PortfolioTable';
// import AssetDistribution from '../components/dashboard/AssetDistribution';
import TopNews from "../components/dashboard/TopNews"; 
import NewsFeed from '../components/dashboard/NewsFeed';
import '../styles/dashboard.css';

const Dashboard = () => {

    const [selectedCompany, setSelectedCompany] = useState(null);

  // Handle company selection
  const handleSelectCompany = (companyName) => {
    setSelectedCompany(companyName);
  };

    return (
        <div className="dashboard">
            <Header />
            
            <div className="container">
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Portfolio Value</h3>
                        <div className="value">$42,845.75</div>
                    </div>
                    <div className="stat-card">
                        <h3>Today's Change</h3>
                        <div className="value positive">+2.4%</div>
                    </div>
                    <div className="stat-card">
                        <h3>Number of Assets</h3>
                        <div className="value">3</div>
                    </div>
                </div>

                <PortfolioTable onSelectCompany={handleSelectCompany} />

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '2fr 1fr', 
                    gap: '20px',
                    marginTop: '20px' 
                }}>
                      
                      {selectedCompany && (
                        <div >
                            <h2 className="text-xl font-semibold">Top News for {selectedCompany}</h2>
                        <TopNews company={selectedCompany} />
                        </div>
                )}
                
                    <NewsFeed />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;