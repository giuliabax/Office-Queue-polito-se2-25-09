import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Alert, Card, Form, Modal } from 'react-bootstrap';

function OfficerView() {
  const [officer, setOfficer] = useState(null);
  const [selectedCounter, setSelectedCounter] = useState('');
  const [availableCounters, setAvailableCounters] = useState([]);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showChangeCounterModal, setShowChangeCounterModal] = useState(false);
  const [hasCalledCustomer, setHasCalledCustomer] = useState(false);
  const [tempNewCounter, setTempNewCounter] = useState('');

  useEffect(() => {
    loadOfficerInfo();
    loadAvailableCounters();
  }, []);

  // Polling per aggiornare lo stato del cliente corrente
  useEffect(() => {
    if (selectedCounter && currentCustomer) {
      const intervalId = setInterval(() => {
        checkCurrentCustomerStatus();
      }, 2000);
      return () => clearInterval(intervalId);
    }
  }, [selectedCounter, currentCustomer]);

  const loadOfficerInfo = async () => {
    try {
      // TODO: Implementare autenticazione
      // const response = await fetch('/api/officer/me');
      // const data = await response.json();
      
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
    try {
      const response = await fetch('/api/counters');
      const data = await response.json();
      setAvailableCounters(data);
    } catch (error) {
      console.error('Errore nel caricamento dei counter disponibili:', error);
      // Fallback mock
      setAvailableCounters([
        { id: 1, counterNumber: 1 },
        { id: 2, counterNumber: 2 },
        { id: 3, counterNumber: 3 },
        { id: 4, counterNumber: 4 },
        { id: 5, counterNumber: 5 }
      ]);
    }
  };

  const checkCurrentCustomerStatus = async () => {
    if (!currentCustomer) return;
    
    try {
      const response = await fetch(`/api/tickets/${currentCustomer.id}`);
      const updatedTicket = await response.json();
      
      // Se lo stato è cambiato, aggiorna
      if (updatedTicket.status !== currentCustomer.status) {
        setCurrentCustomer(updatedTicket);
      }
    } catch (error) {
      console.error('Errore nel controllo dello stato del cliente:', error);
    }
  };

  const confirmChangeCounter = async () => {
    if (currentCustomer) {
      // Se c'è un cliente in servizio, completalo automaticamente
      await handleCompleteCustomer();
    }
    
    setSelectedCounter(tempNewCounter);
    setHasCalledCustomer(false);
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
    
    try {
      const response = await fetch(`/api/tickets/${currentCustomer.id}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counterId: parseInt(selectedCounter),
          status: 'served'
        })
      });
      
      if (!response.ok) throw new Error('Errore nel completamento del cliente');
      
      setCurrentCustomer(null);
      setHasCalledCustomer(false);
      
    } catch (error) {
      console.error('Errore nel completamento del cliente:', error);
      alert('Errore nel completamento del cliente. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallNextCustomer = async () => {
    if (!selectedCounter) return;

    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/counters/${selectedCounter}/call-next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          alert('No customers in queue');
          return;
        }
        throw new Error('Errore nella chiamata del prossimo cliente');
      }
      
      const nextCustomer = await response.json();
      // Risposta attesa: { id, ticketNumber: "A5", serviceTypeId, status: "called", counterNumber: 3, ... }
      
      setCurrentCustomer(nextCustomer);
      setHasCalledCustomer(true);
      
    } catch (error) {
      console.error('Errore nella chiamata del prossimo cliente:', error);
      alert('Errore nella chiamata del prossimo cliente. Riprova.');
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
                  }
                }
              }}
              size="lg"
              className="py-3 text-center fs-4"
            >
              <option value="">-- Select a counter --</option>
              {availableCounters.map((counter) => (
                <option key={counter.id} value={counter.counterNumber}>
                  Counter {counter.counterNumber}
                </option>
              ))}
            </Form.Select>
            {selectedCounter && (
              <div className="text-center mt-3">
                <span className="badge bg-primary py-2 px-4" style={{ fontSize: '1.2rem' }}>
                  Counter {selectedCounter}
                </span>
              </div>
            )}
          </Form.Group>
        </Col>
      </Row>

      <Row className="flex-grow-1 d-flex align-items-center">
        <Col>
          {currentCustomer ? (
            <Card className="mb-4 shadow-lg border-0" style={{ maxWidth: '500px', margin: '0 auto' }}>
              <Card.Header className="bg-primary text-white py-3">
                <h3 className="mb-0 text-center">Current Customer</h3>
              </Card.Header>
              <Card.Body className="text-center py-5">
                <h1 className="fw-bold text-primary mb-3" style={{ fontSize: '6rem' }}>
                  {currentCustomer.ticketNumber}
                </h1>
                <p className="fs-4 mb-0">
                  <span className="text-muted">Counter:</span>{' '}
                  <span className="fw-bold">{currentCustomer.counterNumber}</span>
                </p>
              </Card.Body>
            </Card>
          ) : selectedCounter ? (
            <Alert variant="info" className="text-center py-5 mb-5" style={{ maxWidth: '900px', margin: '0 auto' }}>
              <Alert.Heading className="display-6">No customer being served</Alert.Heading>
              <p className="fs-4 mb-0">
                Click the button below to call the next customer
              </p>
            </Alert>
          ) : (
            <Alert variant="warning" className="text-center py-5 mb-5" style={{ maxWidth: '900px', margin: '0 auto' }}>
              <Alert.Heading className="display-6">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Counter Not Selected
              </Alert.Heading>
              <p className="fs-4 mb-0">
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
                    Select a counter to enable the buttons
                  </p>
                </div>
              )}
            </Col>
          </Row>
        </Col>
      </Row>

      <Modal show={showChangeCounterModal} onHide={cancelChangeCounter} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fs-3">Change Counter</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentCustomer ? (
            <Alert variant="warning">
              <Alert.Heading className="fs-4">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Customer in service
              </Alert.Heading>
              <p className="mb-0 fs-5">
                You are currently serving customer <strong>{currentCustomer.ticketNumber}</strong>. 
                If you change counter, this customer will be marked as completed. Do you want to continue?
              </p>
            </Alert>
          ) : (
            <p className="fs-5">Are you sure you want to change counter?</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="lg" onClick={cancelChangeCounter}>
            Cancel
          </Button>
          <Button variant="primary" size="lg" onClick={confirmChangeCounter}>
            Confirm Change
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default OfficerView;