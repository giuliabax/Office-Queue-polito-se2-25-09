import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Modal, Table, Alert } from 'react-bootstrap';

function CustomerView() {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [myTickets, setMyTickets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [lastTicket, setLastTicket] = useState(null);
  const [queueData, setQueueData] = useState([]);

  // Carica i servizi disponibili
  useEffect(() => {
    loadServices();
  }, []);

  // Polling per aggiornare la coda ogni 2 secondi
  useEffect(() => {
    if (myTickets.length > 0) {
      loadQueue();
      const intervalId = setInterval(() => {
        loadQueue();
        checkMyTicketsStatus(); // Controlla lo stato dei miei biglietti
      }, 2000);
      return () => clearInterval(intervalId);
    }
  }, [myTickets.length]);

  const loadServices = async () => {
    try {
      // TODO: Chiamata API reale
      const response = await fetch('/api/service-types');
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Errore nel caricamento dei servizi:', error);
      // Fallback mock
      setServices([
        { id: 1, name: 'Service A', serviceTag: 'A' },
        { id: 2, name: 'Service B', serviceTag: 'B' },
        { id: 3, name: 'Service C', serviceTag: 'C' },
        { id: 4, name: 'Service D', serviceTag: 'D' }
      ]);
    }
  };

  const loadQueue = async () => {
    try {
      // TODO: Chiamata API reale per ottenere i prossimi 10 in coda
      const response = await fetch('/api/queue/next/10');
      const data = await response.json();
      setQueueData(data);
    } catch (error) {
      console.error('Errore nel caricamento della coda:', error);
    }
  };

  const checkMyTicketsStatus = async () => {
    try {
      // Controlla lo stato di tutti i miei biglietti
      for (const ticket of myTickets) {
        const response = await fetch(`/api/tickets/${ticket.id}`);
        const updatedTicket = await response.json();
        
        // Se il biglietto è stato appena chiamato, mostra notifica
        if (ticket.status !== 'called' && updatedTicket.status === 'called') {
          showNotification(updatedTicket.ticketNumber, updatedTicket.counterNumber);
          playNotificationSound();
        }
        
        // Aggiorna lo stato locale
        setMyTickets(prev => 
          prev.map(t => t.id === ticket.id ? updatedTicket : t)
        );
      }
    } catch (error) {
      console.error('Errore nel controllo dello stato dei biglietti:', error);
    }
  };

  const handleGetTicket = async () => {
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceTypeId: parseInt(selectedService) })
      });
      
      if (!response.ok) throw new Error('Errore nella creazione del biglietto');
      
      const newTicket = await response.json();
      // Risposta attesa: { id, ticketNumber: "A5", serviceTypeId, status: "waiting", ... }
      
      setLastTicket(newTicket.ticketNumber);
      setShowModal(true);
      
      // Aggiungi alla lista dei miei biglietti
      setMyTickets(prev => [...prev, newTicket]);
      
      // Reset selezione
      setSelectedService('');
      
      // Ricarica la coda
      loadQueue();
      
    } catch (error) {
      console.error('Errore nel recupero del biglietto:', error);
      alert('Errore nella generazione del biglietto. Riprova.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const showNotification = (ticketNum, counterNum) => {
    if (Notification.permission === "granted") {
      new Notification("Your turn!", {
        body: `Ticket ${ticketNum} - Please go to Counter ${counterNum}`,
        icon: '/notification-icon.png'
      });
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (error) {
      console.log('Audio not available');
    }
  };

  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Prepara array di 10 elementi per la tabella
  const displayQueue = [...queueData.slice(0, 10)];
  while (displayQueue.length < 10) {
    displayQueue.push({ 
      id: `empty-${displayQueue.length}`,
      ticketNumber: '', 
      counterNumber: null,
      status: 'empty' 
    });
  }

  return (
    <Container fluid className="vh-100 d-flex flex-column p-5">
      <Row className="mb-5">
        <Col>
          <h1 className="text-center display-3 fw-bold">Office Queue Management</h1>
        </Col>
      </Row>
      
      {myTickets.length === 0 ? (
        // Vista centrata iniziale
        <Row className="flex-grow-1 align-items-center justify-content-center">
          <Col md={6} lg={5}>
            <Form.Group className="mb-4">
              <Form.Label className="h3">Select a service type:</Form.Label>
              <Form.Select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                size="lg"
                className="py-3"
              >
                <option value="">-- Select a service --</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="d-grid gap-2">
              <Button
                variant="primary"
                size="lg"
                onClick={handleGetTicket}
                disabled={!selectedService}
                className="py-3"
                style={{ fontSize: '1.5rem' }}
              >
                Get Ticket
              </Button>
            </div>
          </Col>
        </Row>
      ) : (
        // Vista a 2 colonne dopo aver preso almeno un biglietto
        <Row className="flex-grow-1">
          <Col lg={6} className="d-flex flex-column justify-content-center">
            <div className="p-4">
              <Form.Group className="mb-4">
                <Form.Label className="h3">Select a service type:</Form.Label>
                <Form.Select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  size="lg"
                  className="py-3"
                >
                  <option value="">-- Select a service --</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <div className="d-grid gap-2 mb-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleGetTicket}
                  disabled={!selectedService}
                  className="py-3"
                  style={{ fontSize: '1.5rem' }}
                >
                  Get Ticket
                </Button>
              </div>

              {/* Lista dei miei biglietti */}
              <div className="mb-4">
                <h4 className="mb-3">Your Tickets:</h4>
                {myTickets.map((ticket) => (
                  <Alert 
                    key={ticket.id}
                    variant={
                      ticket.status === 'waiting' ? 'info' :
                      ticket.status === 'called' ? 'warning' :
                      ticket.status === 'served' ? 'success' : 'secondary'
                    }
                    className="p-3"
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong className="fs-4">{ticket.ticketNumber}</strong>
                      </div>
                      <div className="text-end">
                        {ticket.status === 'waiting' && (
                          <span className="badge bg-info fs-6">Waiting</span>
                        )}
                        {ticket.status === 'called' && (
                          <span className="badge bg-warning fs-6">
                            🔔 Counter {ticket.counterNumber}
                          </span>
                        )}
                        {ticket.status === 'served' && (
                          <span className="badge bg-success fs-6">Completed</span>
                        )}
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            </div>
          </Col>

          <Col lg={6} className="d-flex flex-column justify-content-center">
            <div className="p-4">
              <h2 className="mb-4 display-5">Next 10 in Queue</h2>
              <Table striped bordered hover size="lg" className="fs-5">
                <thead className="table-dark">
                  <tr>
                    <th className="text-center">Position</th>
                    <th className="text-center">Ticket Number</th>
                    <th className="text-center">Counter</th>
                  </tr>
                </thead>
                <tbody>
                  {displayQueue.map((ticket, index) => {
                    const isMyTicket = myTickets.some(t => t.ticketNumber === ticket.ticketNumber);
                    const isCalled = ticket.status === 'called';
                    
                    return (
                      <tr 
                        key={ticket.id || `empty-${index}`}
                        className={`
                          ${isMyTicket && isCalled ? 'table-warning' : ''}
                          ${isMyTicket && ticket.status === 'waiting' ? 'table-info' : ''}
                        `}
                        style={{
                          transition: 'all 0.3s ease',
                          fontWeight: isMyTicket ? 'bold' : 'normal'
                        }}
                      >
                        <td className="text-center">{index + 1}</td>
                        <td className="text-center">
                          {ticket.ticketNumber}
                          {isMyTicket && ticket.ticketNumber && (
                            <span className="badge bg-primary ms-2">YOU</span>
                          )}
                        </td>
                        <td className="text-center">
                          {ticket.counterNumber || ''}
                          {isMyTicket && isCalled && (
                            <span className="ms-2">🔔</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </Col>
        </Row>
      )}

      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="fs-2">Ticket Generated</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-5">
          <h2 className="display-6 mb-4">Your ticket is:</h2>
          <h1 className="display-1 text-primary fw-bold" style={{ fontSize: '8rem' }}>
            {lastTicket}
          </h1>
          <p className="mt-4 fs-4">Please wait for your turn</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleCloseModal} size="lg" className="px-5 py-3">
            OK
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default CustomerView;