import './App.css';
import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Login, Signup } from './components/Auth';

function App() {
  // Authentication state
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  
  // SQL Editor state
  const [query, setQuery] = useState('SELECT * FROM dbo.ex_customers LIMIT 10;');
  const [results, setResults] = useState('No query executed yet');
  const [availableTables, setAvailableTables] = useState([]);
  const [expandedTables, setExpandedTables] = useState({});
  const [tableSchemas, setTableSchemas] = useState({});

  // Check for stored user session on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('sqlArenaUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Fetch available tables when user is logged in
  useEffect(() => {
    if (user) {
      fetch('https://sql-playground-background.onrender.com/api/tables')
        .then(res => res.json())
        .then(data => setAvailableTables(data.tables || []))
        .catch(err => console.error('Error fetching tables:', err));
    }
  }, [user]);

  // Authentication handlers
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('sqlArenaUser', JSON.stringify(userData));
  };

  const handleSignup = (userData) => {
    setUser(userData);
    localStorage.setItem('sqlArenaUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sqlArenaUser');
    setQuery('SELECT * FROM dbo.ex_customers LIMIT 10;');
    setResults('No query executed yet');
  };

  // Activity logging function
  const logActivity = async (sqlQuery, executionResult, success) => {
    try {
      await fetch('https://sql-playground-background.onrender.com/api/log-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginId: user.login_id,
          sqlQuery: sqlQuery,
          executionResult: executionResult,
          success: success
        })
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  // Enhanced runQuery function with activity logging
  const runQuery = async () => {
    const startTime = Date.now();
    
    try {
      const response = await fetch('https://sql-playground-background.onrender.com/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: query })
      });
      
      const result = await response.json();
      const executionTime = Date.now() - startTime;
      
      if (result.success) {
        const tableHtml = createTable(result.data);
        setResults(tableHtml);
        
        // Log successful activity
        await logActivity(query, {
          rowCount: result.rowCount,
          executionTime: executionTime,
          success: true
        }, true);
      } else {
        setResults(`Error: ${result.error}`);
        
        // Log failed activity
        await logActivity(query, {
          error: result.error,
          executionTime: executionTime,
          success: false
        }, false);
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      setResults(`Connection error: ${error.message}`);
      
      // Log connection error
      await logActivity(query, {
        error: error.message,
        executionTime: executionTime,
        success: false
      }, false);
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
    const isExpanded = expandedTables[tableName];
    setExpandedTables(prev => ({
      ...prev,
      [tableName]: !isExpanded
    }));

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
  };

  // Render authentication screens if user is not logged in
  if (!user) {
    if (authMode === 'login') {
      return (
        <Login 
          onLogin={handleLogin} 
          onSwitchToSignup={() => setAuthMode('signup')}
        />
      );
    } else {
      return (
        <Signup 
          onSignup={handleSignup} 
          onSwitchToLogin={() => setAuthMode('login')}
        />
      );
    }
  }

  // Render main application for logged-in users
  return (
    <div style={{display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif'}}>
      
      {/* Sidebar */}
      <div style={{
        width: '280px',
        backgroundColor: '#f8f9fa',
        borderRight: '1px solid #ddd',
        padding: '20px',
        overflowY: 'auto'
      }}>
        {/* User info */}
        <div style={{
          padding: '15px',
          backgroundColor: '#fff',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ddd'
        }}>
          <div style={{fontSize: '14px', color: '#666', marginBottom: '5px'}}>Welcome back!</div>
          <div style={{fontWeight: 'bold', color: '#333', marginBottom: '10px'}}>{user.full_name}</div>
          <button 
            onClick={handleLogout}
            style={{
              padding: '6px 12px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>

        <h3 style={{margin: '0 0 20px 0', color: '#333'}}>Available Tables</h3>
        <div>
          {availableTables
            .filter(table => table.name !== 'sqlite_sequence')
            .map(table => (
            <div key={table.name}>
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

      {/* Main Content */}
      <div style={{flex: 1, padding: '20px', overflowY: 'auto'}}>
        <header style={{textAlign: 'center', marginBottom: '30px'}}>
          <h1 style={{margin: '0 0 10px 0', color: '#333'}}>Enqurious SQL Arena</h1>
          <p style={{margin: 0, color: '#666'}}>Practice SQL queries interactively on GlobalMart's Database</p>
        </header>
        
        <main>
          <div className="query-section">
            <h3 style={{color: '#333'}}>Write your SQL query:</h3>
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginBottom: '15px',
              overflow: 'hidden'
            }}>
              <Editor
                height="180px"
                language="sql"
                value={query}
                onChange={(value) => setQuery(value || '')}
                theme="light"
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  fontFamily: 'Monaco, Consolas, monospace',
                  lineNumbers: 'on',
                  glyphMargin: false,
                  folding: false,
                  lineDecorationsWidth: 0,
                  lineNumbersMinChars: 3,
                  renderLineHighlight: 'line',
                  tabSize: 2,
                  insertSpaces: true,
                  wordWrap: 'on',
                  automaticLayout: true,
                  formatOnPaste: true,
                  formatOnType: true
                }}
              />
            </div>
            <button 
              onClick={runQuery} 
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '25px'
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