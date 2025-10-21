import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Alert, Card, Form, Modal } from 'react-bootstrap';

const API_URL = 'http://localhost:3001';

function OfficerView() {
  const [officer, setOfficer] = useState(null);
  const [selectedCounter, setSelectedCounter] = useState('');
  const [availableCounters, setAvailableCounters] = useState([]);
  const [counterServices, setCounterServices] = useState([]);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showChangeCounterModal, setShowChangeCounterModal] = useState(false);
  const [hasCalledCustomer, setHasCalledCustomer] = useState(false);
  const [tempNewCounter, setTempNewCounter] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOfficerInfo();
    loadAvailableCounters();
  }, []);

  useEffect(() => {
    if (selectedCounter) {
      loadCounterServices(selectedCounter);
    }
  }, [selectedCounter]);

  const loadOfficerInfo = async () => {
    try {
      const mockOfficer = {
        id: 1,
        name: 'Mario',
        surname: 'Rossi'
      };
      setOfficer(mockOfficer);
    } catch (error) {
      console.error('Errore nel caricamento delle informazioni dell\'officer:', error);
    }
  };

  const loadAvailableCounters = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/counters`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch counters');
      }
      
      const data = await response.json();
      console.log('✅ Counter caricati:', data);
      setAvailableCounters(data);
      
    } catch (error) {
      console.error('❌ Errore nel caricamento dei counter:', error);
      setError('Impossibile caricare i counter. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCounterServices = async (counterId) => {
    try {
      const response = await fetch(`${API_URL}/api/counters/${counterId}/service-types`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch counter services');
      }
      
      const data = await response.json();
      console.log(`✅ Servizi per counter ${counterId}:`, data);
      setCounterServices(data);
      
    } catch (error) {
      console.error('❌ Errore nel caricamento dei servizi del counter:', error);
      setCounterServices([]);
    }
  };

  const confirmChangeCounter = async () => {
    if (currentCustomer) {
      await handleCompleteCustomer();
    }
    
    setSelectedCounter(tempNewCounter);
    setHasCalledCustomer(false);
    setCurrentCustomer(null);
    setShowChangeCounterModal(false);
    setTempNewCounter('');
  };

  const cancelChangeCounter = () => {
    setShowChangeCounterModal(false);
    setTempNewCounter('');
  };

    const handleCompleteCustomer = async () => {
    if (!currentCustomer) return;

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('✅ Completing customer:', currentCustomer.ticketNumber, 'ID:', currentCustomer.ticketId);
      
      // ⬅️ FIX: Chiama l'API per completare il ticket
      const response = await fetch(`${API_URL}/api/queue/tickets/${currentCustomer.ticketId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || 'Failed to complete customer');
      }
      
      const data = await response.json();
      console.log('✅ Customer completed:', data);
      
      setCurrentCustomer(null);
      setHasCalledCustomer(false);
      setError(null);
      
    } catch (error) {
      console.error('❌ Errore nel completamento del cliente:', error);
      setError('Errore nel completamento del cliente. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

    const handleCallNextCustomer = async () => {
    if (!selectedCounter) return;

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📞 Calling next customer for counter:', selectedCounter);
      
      const response = await fetch(`${API_URL}/api/queue/counters/${selectedCounter}/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          const errorData = await response.json().catch(() => ({ message: 'No customers in queue' }));
          console.log('⚠️ No customers:', errorData.message);
          setError(errorData.message);
          setCurrentCustomer(null);
          return;
        }
        
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        console.error('❌ Server error:', errorData);
        throw new Error(errorData.message || 'Errore nella chiamata del prossimo cliente');
      }
      
      const data = await response.json();
      console.log('✅ Full response data:', data);
      
      // ⬅️ FIX: Salva anche il ticketId per il completamento
      if (data.customerServed) {
        const selectedCounterData = availableCounters.find(c => c.id === parseInt(selectedCounter));
        
        const customerData = {
          ticketId: data.customerServed.ticketId, // ⬅️ AGGIUNGI QUESTO
          ticketNumber: data.customerServed.ticketNumber,
          serviceType: data.customerServed.serviceType,
          counterNumber: selectedCounterData?.counterNumber || selectedCounter
        };
        
        console.log('✅ Setting current customer:', customerData);
        
        setCurrentCustomer(customerData);
        setHasCalledCustomer(true);
        setError(null);
      } else {
        console.log('⚠️ No customer to serve');
        setError('No customers in queue');
        setCurrentCustomer(null);
      }
      
    } catch (error) {
      console.error('❌ Errore nella chiamata del prossimo cliente:', error);
      setError(error.message || 'Errore nella chiamata del prossimo cliente. Riprova.');
      setCurrentCustomer(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container fluid className="vh-100 d-flex flex-column p-5 bg-light">
      <Row className="mb-4">
        <Col>
          <h1 className="text-center display-3 fw-bold text-primary">
            Welcome {officer ? `${officer.name} ${officer.surname}` : 'Officer'}!
          </h1>
        </Col>
      </Row>

      {error && (
        <Row className="mb-3">
          <Col>
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              <i className="bi bi-exclamation-circle me-2"></i>
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      <Row className="mb-5">
        <Col md={{ span: 6, offset: 3 }}>
          <Form.Group>
            <Form.Label className="h3 text-center d-block mb-3">
              {selectedCounter ? 'Working at Counter:' : 'Select Your Counter:'}
            </Form.Label>
            <Form.Select
              value={selectedCounter}
              onChange={(e) => {
                const newCounter = e.target.value;
                if (currentCustomer && selectedCounter && newCounter !== selectedCounter) {
                  setTempNewCounter(newCounter);
                  setShowChangeCounterModal(true);
                } else {
                  setSelectedCounter(newCounter);
                  if (newCounter !== selectedCounter) {
                    setHasCalledCustomer(false);
                    setCurrentCustomer(null);
                  }
                }
              }}
              size="lg"
              className="py-3 text-center fs-4"
              disabled={isLoading}
            >
              <option value="">
                {isLoading ? 'Loading counters...' : '-- Select a counter --'}
              </option>
              {availableCounters.map((counter) => (
                <option key={counter.id} value={counter.id}>
                  Counter {counter.counterNumber}
                </option>
              ))}
            </Form.Select>
            
            {selectedCounter && (
              <div className="text-center mt-3">
                <span className="badge bg-primary py-2 px-4" style={{ fontSize: '1.2rem' }}>
                  Counter {availableCounters.find(c => c.id === parseInt(selectedCounter))?.counterNumber}
                </span>
                
                {/* ⬅️ SEZIONE SERVICE TYPES */}
                {counterServices.length > 0 && (
                  <div className="mt-3 p-3 bg-white rounded shadow-sm">
                    <p className="mb-2 fw-bold text-muted" style={{ fontSize: '1rem' }}>
                      Service type(s):
                    </p>
                    <div className="d-flex justify-content-center gap-2 flex-wrap">
                      {counterServices.map((service) => (
                        <span 
                          key={service.id}
                          className="badge bg-info text-dark py-2 px-3"
                          style={{ fontSize: '1rem' }}
                        >
                          {service.name} ({service.acronym})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Form.Group>
        </Col>
      </Row>

      <Row className="flex-grow-1 d-flex align-items-center">
        <Col>
          {/* ⬅️ MOSTRA IL CURRENT CUSTOMER */}
          {currentCustomer ? (
            <Card className="mb-4 shadow-lg border-0" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <Card.Header className="bg-success text-white py-3">
                <h3 className="mb-0 text-center">
                  <i className="bi bi-person-check me-2"></i>
                  Now Serving
                </h3>
              </Card.Header>
              <Card.Body className="text-center py-5">
                <div className="mb-4">
                  <p className="text-muted mb-2" style={{ fontSize: '1.2rem' }}>Ticket Number</p>
                  <h1 className="fw-bold text-primary mb-0" style={{ fontSize: '6rem' }}>
                    {currentCustomer.ticketNumber}
                  </h1>
                </div>
                
                <div className="mb-3">
                  <span className="badge bg-primary py-2 px-4" style={{ fontSize: '1.5rem' }}>
                    Counter {currentCustomer.counterNumber}
                  </span>
                </div>
                
                <div className="mt-4 p-3 bg-light rounded">
                  <p className="mb-0 text-muted" style={{ fontSize: '1.2rem' }}>
                    Service: <strong className="text-dark">{currentCustomer.serviceType}</strong>
                  </p>
                </div>
              </Card.Body>
            </Card>
          ) : selectedCounter ? (
            <Alert variant="info" className="text-center py-5 mb-5 shadow-sm" style={{ maxWidth: '900px', margin: '0 auto' }}>
              <Alert.Heading className="display-6">
                <i className="bi bi-hourglass-split me-2"></i>
                No customer being served
              </Alert.Heading>
              <p className="fs-4 mb-0 mt-3">
                Click the button below to call the next customer
              </p>
            </Alert>
          ) : (
            <Alert variant="warning" className="text-center py-5 mb-5 shadow-sm" style={{ maxWidth: '900px', margin: '0 auto' }}>
              <Alert.Heading className="display-6">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Counter Not Selected
              </Alert.Heading>
              <p className="fs-4 mb-0 mt-3">
                Please select a counter from the dropdown above to start serving customers
              </p>
            </Alert>
          )}

          <Row className="justify-content-center">
            <Col md={10} lg={8}>
              <Row className="g-4">
                <Col md={6}>
                  <div className="d-grid">
                    <Button
                      variant="success"
                      size="lg"
                      onClick={handleCompleteCustomer}
                      disabled={!currentCustomer || isLoading || !hasCalledCustomer}
                      className="py-4 shadow"
                      style={{ fontSize: '1.5rem', minHeight: '100px' }}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          <br />
                          Complete Customer
                        </>
                      )}
                    </Button>
                  </div>
                </Col>

                <Col md={6}>
                  <div className="d-grid">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleCallNextCustomer}
                      disabled={currentCustomer !== null || isLoading || !selectedCounter}
                      className="py-4 shadow"
                      style={{ fontSize: '1.5rem', minHeight: '100px' }}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Calling...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-telephone me-2"></i>
                          <br />
                          Call Next Customer
                        </>
                      )}
                    </Button>
                  </div>
                </Col>
              </Row>

              {!selectedCounter && (
                <div className="text-center mt-4">
                  <p className="text-muted fst-italic fs-5">
                    <i className="bi bi-arrow-up me-2"></i>
                    Select a counter to enable the buttons
                  </p>
                </div>
              )}
            </Col>
          </Row>
        </Col>
      </Row>

      <Modal show={showChangeCounterModal} onHide={cancelChangeCounter} centered size="lg">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fs-3">
            <i className="bi bi-arrow-left-right me-2"></i>
            Change Counter
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          {currentCustomer ? (
            <Alert variant="warning" className="mb-0">
              <Alert.Heading className="fs-4">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Customer in service
              </Alert.Heading>
              <p className="mb-0 fs-5 mt-3">
                You are currently serving customer <strong>#{currentCustomer.ticketNumber}</strong>. 
                If you change counter, this customer will be marked as completed. Do you want to continue?
              </p>
            </Alert>
          ) : (
            <p className="fs-5 mb-0">Are you sure you want to change counter?</p>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" size="lg" onClick={cancelChangeCounter} className="px-4">
            <i className="bi bi-x-circle me-2"></i>
            Cancel
          </Button>
          <Button variant="primary" size="lg" onClick={confirmChangeCounter} className="px-4">
            <i className="bi bi-check-circle me-2"></i>
            Confirm Change
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default OfficerView;