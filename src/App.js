import './App.css';

function App() {
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
            placeholder="SELECT * FROM users;"
            rows="8"
            cols="80"
          />
          <br />
          <button>Run Query</button>
        </div>
        
        <div className="results-section">
          <h3>Results:</h3>
          <div className="results-area">
            No query executed yet
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;