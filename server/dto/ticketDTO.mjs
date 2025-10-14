export class TicketDTO {
  constructor(ticketNumber, serviceTypeName, estimatedWaitTime) { // so this is what server respond
    this.ticketNumber = ticketNumber;         // number of ticket
    this.serviceTypeName = serviceTypeName;   // service type chosen
    this.estimatedWaitTime = estimatedWaitTime; // estimated time (mybe not necessary)
  }

  static fromTicket(ticketModel, serviceTypeModel, estimatedWaitTime) {
    return new TicketDTO(
      ticketModel.number,
      serviceTypeModel.name,
      estimatedWaitTime
    );
  }
}
