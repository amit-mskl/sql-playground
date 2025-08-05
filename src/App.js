import './App.css';
import { useState, useEffect } from 'react';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState('No query executed yet');
  const [availableTables, setAvailableTables] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedTables, setExpandedTables] = useState({});
  const [tableSchemas, setTableSchemas] = useState({});

  // Fetch available tables on component mount
  useEffect(() => {
    fetch('https://sql-playground-background.onrender.com/api/tables')
      .then(res => res.json())
      .then(data => setAvailableTables(data.tables || []))
      .catch(err => console.error('Error fetching tables:', err));
  }, []);

  const runQuery = async () => {
    try {
      const response = await fetch('https://sql-playground-background.onrender.com/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: query })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setResults(createTable(result.data));
      } else {
        setResults(`Error: ${result.error}`);
      }
    } catch (error) {
      setResults(`Connection error: ${error.message}`);
    }
  };

  const createTable = (data) => {
    if (data.length === 0) return 'No rows found';
    
    const headers = Object.keys(data[0]);
    
    return (
      <div style={{overflowX: 'auto', marginTop: '20px'}}>
        <table border="1" style={{borderCollapse: 'collapse', width: '100%', minWidth: '600px'}}>
          <thead>
            <tr>
              {headers.map(header => (
                <th key={header} style={{padding: '8px', backgroundColor: '#f0f0f0', whiteSpace: 'nowrap'}}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                {headers.map(header => (
                  <td key={header} style={{padding: '8px', whiteSpace: 'nowrap'}}>
                    {row[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const handleTableClick = (tableName) => {
    // Toggle table expansion
    const isExpanded = expandedTables[tableName];
    setExpandedTables(prev => ({
      ...prev,
      [tableName]: !isExpanded
    }));

    // Fetch schema if not already loaded and expanding
    if (!isExpanded && !tableSchemas[tableName]) {
      fetchTableSchema(tableName);
    }
  };

  const fetchTableSchema = async (tableName) => {
    try {
      const response = await fetch(`https://sql-playground-background.onrender.com/api/schema/${tableName}`);
      const result = await response.json();
      
      if (result.success) {
        setTableSchemas(prev => ({
          ...prev,
          [tableName]: result.columns
        }));
      }
    } catch (error) {
      console.error('Error fetching schema:', error);
    }
  };

  const generateQuery = (tableName) => {
    setQuery(`SELECT * FROM ${tableName} LIMIT 10;`);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <>
      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-layout {
            flex-direction: column !important;
          }
          
          .sidebar {
            position: fixed !important;
            top: 0 !important;
            left: ${sidebarOpen ? '0' : '-100%'} !important;
            width: 100% !important;
            height: 100vh !important;
            z-index: 1000 !important;
            transition: left 0.3s ease !important;
          }
          
          .main-content {
            width: 100% !important;
            padding: 80px 15px 20px 15px !important;
          }
          
          .menu-button {
            display: block !important;
          }
          
          .overlay {
            display: ${sidebarOpen ? 'block' : 'none'} !important;
          }
        }
        
        @media (min-width: 769px) {
          .sidebar {
            position: relative !important;
            width: 250px !important;
            left: 0 !important;
          }
          
          .menu-button {
            display: none !important;
          }
          
          .overlay {
            display: none !important;
          }
        }
      `}</style>

      <div style={{display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif'}} className="mobile-layout">
        
        {/* Mobile Menu Button */}
        <button 
          onClick={toggleSidebar}
          className="menu-button"
          style={{
            position: 'fixed',
            top: '15px',
            left: '15px',
            zIndex: 1100,
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '12px 16px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            display: 'none'
          }}
        >
          {sidebarOpen ? '✕' : '☰'} Tables
        </button>

        {/* Overlay for mobile */}
        <div 
          className="overlay"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 999,
            display: 'none'
          }}
        />

        {/* Sidebar */}
        <div 
          className="sidebar"
          style={{
            width: '250px',
            backgroundColor: '#f8f9fa',
            borderRight: '1px solid #ddd',
            padding: '20px',
            overflowY: 'auto',
            position: 'relative'
          }}
        >
          <div style={{paddingTop: '50px'}}>
            <h3 style={{margin: '0 0 20px 0', color: '#333'}}>Available Tables</h3>
            <div>
              {availableTables
                .filter(table => table.name !== 'sqlite_sequence')
                .map(table => (
                <div key={table.name}>
                  {/* Table Header */}
                  <div 
                    onClick={() => handleTableClick(table.name)}
                    style={{
                      padding: '12px 16px',
                      margin: '5px 0',
                      backgroundColor: '#fff',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: '#007bff',
                      fontWeight: '500',
                      transition: 'background-color 0.2s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#e7f3ff'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
                  >
                    <span>📋 {table.name}</span>
                    <span style={{fontSize: '12px', color: '#666'}}>
                      {expandedTables[table.name] ? '▼' : '▶'}
                    </span>
                  </div>

                  {/* Schema Details */}
                  {expandedTables[table.name] && (
                    <div style={{
                      marginLeft: '10px',
                      marginBottom: '10px',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #e9ecef',
                      borderRadius: '4px',
                      padding: '10px'
                    }}>
                      {tableSchemas[table.name] ? (
                        <>
                          <div style={{fontSize: '12px', color: '#666', marginBottom: '8px'}}>
                            Columns ({tableSchemas[table.name].length}):
                          </div>
                          {tableSchemas[table.name].map(column => (
                            <div key={column.name} style={{
                              fontSize: '11px',
                              padding: '4px 8px',
                              marginBottom: '3px',
                              backgroundColor: column.isPrimaryKey ? '#fff3cd' : '#fff',
                              border: '1px solid ' + (column.isPrimaryKey ? '#ffeaa7' : '#e9ecef'),
                              borderRadius: '3px',
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}>
                              <span style={{fontWeight: column.isPrimaryKey ? 'bold' : 'normal'}}>
                                {column.isPrimaryKey && '🔑 '}{column.name}
                              </span>
                              <span style={{color: '#666', fontSize: '10px'}}>
                                {column.type}{!column.nullable ? ' NOT NULL' : ''}
                              </span>
                            </div>
                          ))}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              generateQuery(table.name);
                            }}
                            style={{
                              marginTop: '8px',
                              padding: '4px 8px',
                              backgroundColor: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              width: '100%'
                            }}
                          >
                            Generate SELECT Query
                          </button>
                        </>
                      ) : (
                        <div style={{fontSize: '11px', color: '#666'}}>Loading schema...</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div 
          className="main-content"
          style={{
            flex: 1, 
            padding: '20px', 
            overflowY: 'auto',
            minWidth: 0  // Important for flexbox
          }}
        >
          <header style={{textAlign: 'center', marginBottom: '30px'}}>
            <h1 style={{margin: '0 0 10px 0', color: '#333'}}>Enqurious SQL Arena</h1>
            <p style={{margin: 0, color: '#666'}}>Practice SQL queries interactively on GlobalMart's Database</p>
          </header>
          
          <main>
            <div className="query-section">
              <h3 style={{color: '#333'}}>Write your SQL query:</h3>
              <textarea 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="SELECT * FROM ex_customers LIMIT 10;"
                rows="6"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'Monaco, Consolas, monospace',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  minHeight: '120px'
                }}
              />
              <button 
                onClick={runQuery} 
                style={{
                  marginTop: '15px',
                  marginBottom: '20px',
                  padding: '15px 30px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500',
                  width: '100%'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
              >
                Run Query
              </button>
            </div>
            
            <div className="results-section">
              <h3 style={{color: '#333'}}>Results:</h3>
              <div className="results-area">
                {results}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default App;