import './App.css';
import { useState, useEffect } from 'react';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState('No query executed yet');
  const [availableTables, setAvailableTables] = useState([]);

  // Fetch available tables on component mount
  useEffect(() => {
    fetch('http://localhost:3001/api/tables')
      .then(res => res.json())
      .then(data => setAvailableTables(data.tables || []))
      .catch(err => console.error('Error fetching tables:', err));
  }, []);

  const runQuery = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/query', {
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
      <div style={{display: 'flex', justifyContent: 'center', marginTop: '20px'}}>
        <table border="1" style={{borderCollapse: 'collapse', width: 'auto'}}>
          <thead>
            <tr>
              {headers.map(header => (
                <th key={header} style={{padding: '8px', backgroundColor: '#f0f0f0'}}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                {headers.map(header => (
                  <td key={header} style={{padding: '8px'}}>
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
    setQuery(`SELECT * FROM ${tableName} LIMIT 10;`);
  };

  return (
    <div style={{display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif'}}>
      {/* Sidebar */}
      <div style={{
        width: '250px',
        backgroundColor: '#f8f9fa',
        borderRight: '1px solid #ddd',
        padding: '20px',
        overflowY: 'auto'
      }}>
        <h3 style={{margin: '0 0 20px 0', color: '#333'}}>Available Tables</h3>
        <div>
          {availableTables
            .filter(table => table.name !== 'sqlite_sequence')
            .map(table => (
            <div 
              key={table.name} 
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
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#e7f3ff'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
            >
              📋 {table.name}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{flex: 1, padding: '20px', overflowY: 'auto'}}>
        <header style={{textAlign: 'center', marginBottom: '30px'}}>
          <h1 style={{margin: '0 0 10px 0', color: '#333'}}>SQL Playground</h1>
          <p style={{margin: 0, color: '#666'}}>Practice SQL queries interactively</p>
        </header>
        
        <main>
          <div className="query-section">
            <h3 style={{color: '#333'}}>Write your SQL query:</h3>
            <textarea 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SELECT * FROM ex_customers LIMIT 10;"
              rows="8"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'Monaco, Consolas, monospace',
                resize: 'vertical'
              }}
            />
            <br />
            <button 
              onClick={runQuery} 
              style={{
                marginTop: '15px',
                marginBottom: '20px',
                padding: '12px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
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
  );
}

export default App;