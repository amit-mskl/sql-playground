import './App.css';
import { useState } from 'react';

// Sample database tables
const sampleData = {
  users: [
    { id: 1, name: 'John Doe', email: 'john@email.com', age: 25 },
    { id: 2, name: 'Jane Smith', email: 'jane@email.com', age: 30 },
    { id: 3, name: 'Bob Wilson', email: 'bob@email.com', age: 35 }
  ],
  orders: [
    { id: 101, user_id: 1, product: 'Laptop', amount: 999.99 },
    { id: 102, user_id: 2, product: 'Phone', amount: 599.99 },
    { id: 103, user_id: 1, product: 'Mouse', amount: 29.99 }
  ]
};

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState('No query executed yet');

  const runQuery = () => {
    const lowerQuery = query.toLowerCase().trim();
    
    if (lowerQuery.includes('select * from users')) {
      setResults(JSON.stringify(sampleData.users, null, 2));
    } else if (lowerQuery.includes('select * from orders')) {
      setResults(JSON.stringify(sampleData.orders, null, 2));
    } else {
      setResults('Query not supported yet. Try: SELECT * FROM users or SELECT * FROM orders');
    }
  };

  return (
    <div className="App">
      <header>
        <h1>SQL Playground</h1>
        <p>Practice SQL queries interactively</p>
      </header>
      
      <main>
        <div className="query-section">
          <h3>Write your SQL query:</h3>
          <textarea 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SELECT * FROM users;"
            rows="8"
            cols="80"
          />
          <br />
          <button onClick={runQuery}>Run Query</button>
        </div>
        
        <div className="results-section">
          <h3>Results:</h3>
          <div className="results-area">
            {results}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;