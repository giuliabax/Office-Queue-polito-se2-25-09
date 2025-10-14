import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import CustomerView from './components/CustomerView';
import OfficerView from './components/OfficerView';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/customer" element={<CustomerView />} />
        <Route path="/officer" element={<OfficerView />} />
      </Routes>
    </BrowserRouter>
  );
}

// Pagina iniziale per scegliere la vista
function Home() {
  return (
    <Container fluid className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="text-center">
        <h1 className="display-2 mb-5 fw-bold text-primary">Office Queue Management</h1>
        <p className="lead mb-5 text-muted">Select your role to continue</p>
        <div className="d-flex gap-4 justify-content-center">
          <Link 
            to="/customer" 
            className="btn btn-primary btn-lg px-5 py-4 shadow-lg" 
            style={{ fontSize: '1.5rem', minWidth: '250px' }}
          >
            <i className="bi bi-person me-3"></i>
            <br />
            Customer
          </Link>
          <Link 
            to="/officer" 
            className="btn btn-success btn-lg px-5 py-4 shadow-lg" 
            style={{ fontSize: '1.5rem', minWidth: '250px' }}
          >
            <i className="bi bi-person-badge me-3"></i>
            <br />
            Officer
          </Link>
        </div>
      </div>
    </Container>
  );
}

export default App;