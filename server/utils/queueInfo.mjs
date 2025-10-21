export class QueueInfo {
  constructor(queueId, serviceTypeId, lastIssuedTicketNumber, tickets = []) {
    this.queueId = queueId;
    this.serviceTypeId = serviceTypeId;
    this.lastIssuedTicketNumber = lastIssuedTicketNumber;
    this.tickets = tickets;
  }

  getNextTicketNumber() {
    return this.lastIssuedTicketNumber + 1;
  }

  incrementLastIssuedTicket() {
    this.lastIssuedTicketNumber += 1;
    return this.lastIssuedTicketNumber;
  }

  addTicket(ticket) {
    this.tickets.push(ticket);
    this.incrementLastIssuedTicket();
  }

  getQueueLength() {
    return this.tickets.length;
  }
}