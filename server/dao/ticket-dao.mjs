import { Ticket } from "../models/ticket.mjs";

/*  This method allows to create a new ticket by passing the number and the associated queue.
    Note that it is not necessary to specify the status of the ticket, because it has a default
    value at creation time (see the Ticked model)
*/
export async function createTicket(number, queueId) {
  return await Ticket.create({ number, queueId });
}

/* The method has to be used whenever a customer (and its ticket) is currently served, waiting or he was already served */
export async function setTicketStatus(number, status, queueId) {
  const ticket = await Ticket.findOne({ where: { number, queueId } });
  if (!ticket) return null;
  ticket.status = status;
  await ticket.save();
  return ticket;
}

export async function getTicketById(ticketId) {
  return await Ticket.findByPk(ticketId);
}
