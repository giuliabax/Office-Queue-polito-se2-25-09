export class GetTicketRequest { // i expect that the client send me the id of service that wanted
  constructor(serviceTypeId) {
    this.serviceTypeId = serviceTypeId; // id chosen
  }

  static fromJSON(json) {
    return new GetTicketRequest(json.serviceTypeId);
  }
}