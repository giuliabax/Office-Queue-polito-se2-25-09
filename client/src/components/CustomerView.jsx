import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Modal, Table, Alert } from 'react-bootstrap';

const API_URL = 'http://localhost:3001';

function CustomerView() {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [myTickets, setMyTickets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [lastTicket, setLastTicket] = useState(null);
  const [queueData, setQueueData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carica i servizi disponibili dal DB
  useEffect(() => {
    loadServices();
  }, []);

  // Polling per aggiornare la coda ogni 2 secondi
  useEffect(() => {
    loadQueue();
    const intervalId = setInterval(() => {
      loadQueue();
    }, 2000);
    return () => clearInterval(intervalId);
  }, []);

  const loadServices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/service-types`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch service types');
      }
      
      const data = await response.json();
      console.log('✅ Servizi caricati dal DB:', data);
      setServices(data);
      
    } catch (error) {
      console.error('❌ Errore nel caricamento dei servizi:', error);
      setError('Impossibile caricare i servizi. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadQueue = async () => {
    try {
      const response = await fetch(`${API_URL}/api/queue`);
      if (!response.ok) {
        throw new Error('Failed to fetch queue');
      }
      
      const data = await response.json();
      console.log('📋 Queue data from backend:', data);
      
      // ⬅️ FIX: Carica anche i counter per mappare counterId → counterNumber
      const countersResponse = await fetch(`${API_URL}/api/counters`);
      const counters = countersResponse.ok ? await countersResponse.json() : [];
      
      console.log('🏢 Counters:', counters);
      
      // Crea una mappa counterId → counterNumber
      const counterMap = {};
      counters.forEach(counter => {
        counterMap[counter.id] = counter.counterNumber;
      });
      
      console.log('🗺️ Counter map:', counterMap);
      
      // ⬅️ FIX: Mappa i dati usando la counterMap
      const formattedQueue = data.map(ticket => {
        const counterNumber = ticket.counterId ? counterMap[ticket.counterId] : null;
        
        return {
          id: ticket.id,
          ticketNumber: ticket.number,
          serviceType: ticket.queue?.serviceType?.name || 'Unknown',
          status: ticket.status,
          counterId: ticket.counterId,
          counterNumber: counterNumber // ⬅️ Ora usa il counterNumber corretto
        };
      });
      
      console.log('✅ Formatted queue with counter numbers:', formattedQueue);
      
      setQueueData(formattedQueue);
      updateMyTicketsFromQueue(formattedQueue);
      
    } catch (error) {
      console.error('❌ Errore nel caricamento della coda:', error);
    }
  };

  // ⬅️ FIX: Aggiorna automaticamente lo stato dei miei ticket
  const updateMyTicketsFromQueue = (queueTickets) => {
    setMyTickets(prevTickets => {
      return prevTickets.map(myTicket => {
        const queueTicket = queueTickets.find(qt => 
          qt.ticketNumber === myTicket.ticketNumber
        );
        
        if (queueTicket) {
          const wasWaiting = myTicket.status === 'waiting';
          const nowCalled = queueTicket.counterId !== null;
          
          // Notifica se il ticket viene chiamato
          if (wasWaiting && nowCalled) {
            console.log(`🔔 Ticket ${myTicket.ticketNumber} chiamato al counter ${queueTicket.counterId}!`);
            showNotification(myTicket.ticketNumber, queueTicket.counterId);
            playNotificationSound();
          }
          
          return {
            ...myTicket,
            status: queueTicket.counterId ? 'called' : 'waiting',
            counterId: queueTicket.counterId,
            counterNumber: queueTicket.counterNumber
          };
        } else {
          // Ticket non più in coda = servito
          if (myTicket.status !== 'served') {
            console.log(`✅ Ticket ${myTicket.ticketNumber} servito!`);
            
            // Rimuovi il ticket dopo 30 secondi
            setTimeout(() => {
              setMyTickets(prev => prev.filter(t => t.ticketNumber !== myTicket.ticketNumber));
            }, 30000);
            
            return {
              ...myTicket,
              status: 'served'
            };
          }
          return myTicket;
        }
      });
    });
  };

  const handleGetTicket = async () => {
    if (!selectedService) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceTypeId: parseInt(selectedService) })
      });
      
      if (!response.ok) {
        throw new Error('Errore nella creazione del biglietto');
      }
      
      const data = await response.json();
      console.log('🎫 Ticket creato:', data);
      
      // ⬅️ FIX: Crea il ticket con la struttura corretta
      const newTicket = {
        id: data.id,
        ticketNumber: data.ticketNumber,
        serviceType: services.find(s => s.id === parseInt(selectedService))?.name || 'Unknown',
        status: 'waiting',
        counterId: null,
        counterNumber: null
      };
      
      setLastTicket(data.ticketNumber);
      setShowModal(true);
      setMyTickets(prev => [...prev, newTicket]);
      setSelectedService('');
      
      // Richiedi permesso notifiche
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
      
      await loadQueue();
      
    } catch (error) {
      console.error('❌ Errore nel recupero del biglietto:', error);
      setError('Errore nella generazione del biglietto. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const showNotification = (ticketNum, counterNum) => {
    if (Notification.permission === "granted") {
      new Notification("Your turn!", {
        body: `Ticket ${ticketNum} - Please go to Counter ${counterNum}`,
        icon: '/notification-icon.png',
        tag: `ticket-${ticketNum}`
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

  // ⬅️ FIX: Prepara la queue per la visualizzazione (sempre 10 righe)
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
      
      {error && (
        <Row className="mb-3">
          <Col>
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          </Col>
        </Row>
      )}
      
      {myTickets.length === 0 ? (
        <Row className="flex-grow-1 align-items-center justify-content-center">
          <Col md={6} lg={5}>
            <Form.Group className="mb-4">
              <Form.Label className="h3">Select a service type:</Form.Label>
              <Form.Select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                size="lg"
                className="py-3"
                disabled={isLoading || services.length === 0}
              >
                <option value="">
                  {isLoading ? 'Loading services...' : '-- Select a service --'}
                </option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} ({service.acronym})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <div className="d-grid gap-2">
              <Button
                variant="primary"
                size="lg"
                onClick={handleGetTicket}
                disabled={!selectedService || isLoading}
                className="py-3"
                style={{ fontSize: '1.5rem' }}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Processing...
                  </>
                ) : (
                  'Get Ticket'
                )}
              </Button>
            </div>
          </Col>
        </Row>
      ) : (
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
                  disabled={isLoading}
                >
                  <option value="">-- Select a service --</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} ({service.acronym})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <div className="d-grid gap-2 mb-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleGetTicket}
                  disabled={!selectedService || isLoading}
                  className="py-3"
                  style={{ fontSize: '1.5rem' }}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Processing...
                    </>
                  ) : (
                    'Get Ticket'
                  )}
                </Button>
              </div>

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
                        <div className="text-muted small">{ticket.serviceType}</div>
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
                    const isCalled = ticket.counterId !== null;
                    
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