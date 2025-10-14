import { GetTicketRequest } from "../dto/getTicketRequest.mjs";
import { TicketDTO } from "../dto/ticketDTO.mjs";
import { QueueInfo } from "../utils/queueInfo.mjs";
import * as queueDAO from "../dao/queue-dao.mjs";
import * as ticketDAO from "../dao/ticket-dao.mjs";
import * as serviceTypeDAO from "../dao/service-type-dao.mjs";

export async function getTicket(req, res) {
  try {
    const request = GetTicketRequest.fromJSON(req.body);

    const queue = await queueDAO.getQueueByServiceTypeId(request.serviceTypeId);
    if (!queue) {
      return res.status(404).json({ error: "Service type not found or queue missing" });
    }

    const queueInfo = new QueueInfo(
      queue.id,
      queue.serviceTypeId,
      queue.lastIssuedTicketNumber
    );

    const nextTicketNumber = queueInfo.getNextTicketNumber();

    const ticket = await ticketDAO.createTicket(nextTicketNumber, queue.id);

    queue.lastIssuedTicketNumber = nextTicketNumber;
    await queue.save();

    const serviceType = await serviceTypeDAO.getServiceTypeById(request.serviceTypeId);

    const estimatedWaitTime = 10; // placeholder for estimated wait time calculation

    const response = TicketDTO.fromTicket(ticket, serviceType, estimatedWaitTime);

    res.json(response);

  } catch (error) {
    console.error("Error in getTicket:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}