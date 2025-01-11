import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
    const { user, logout } = useAuth();

    return (
        <header className="dashboard-header">
            <div className="container">
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                }}>
                    <h1>Investment Portfolio</h1>
                    <div>
                        <span style={{ marginRight: '20px' }}>
                            Welcome, {user.email}
                        </span>
                        <button 
                            className="btn btn-outline"
                            onClick={logout}
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;