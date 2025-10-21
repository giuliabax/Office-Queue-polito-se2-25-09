import { Ticket } from "../models/ticket.mjs";
import { ServiceType } from "../models/service-type.mjs";
import { Queue } from "../models/queue.mjs";

/*  This method allows to create a new ticket by passing the number and the associated queue.
    Note that it is not necessary to specify the status of the ticket, because it has a default
    value at creation time (see the Ticked model)
*/
export async function createTicket(number, queueId, serviceTypeAcronym = null) {

  const formattedNumber = serviceTypeAcronym 
    ? `${serviceTypeAcronym}${number}` 
    : number.toString();

  return await Ticket.create({ number: formattedNumber, queueId });
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

export async function getWaitingTickets(limit = 10) {
    const tickets = await Ticket.findAll({
        where: {
            status: 'WAITING'
        },
        include: [
            {
                model: Queue,
                as: 'queue',  
                include: [
                    {
                        model: ServiceType,
                        as: 'serviceType',
                        attributes: ['id', 'name', 'acronym']
                    }
                ]
            }
        ],
        order: [['id', 'ASC']],
        limit: limit
    });

    // Trasforma i dati per il frontend
    return tickets.map(ticket => {
        const plainTicket = ticket.get({ plain: true });
        return {
            id: plainTicket.id,
            number: plainTicket.number,
            ticketNumber: plainTicket.number, // Alias per frontend
            status: plainTicket.status,
            queueId: plainTicket.queueId,
            counterId: plainTicket.counterId || null,
            serviceName: plainTicket.queue?.serviceType?.name || 'Unknown',
            serviceAcronym: plainTicket.queue?.serviceType?.acronym || '?'
        };
    });
}