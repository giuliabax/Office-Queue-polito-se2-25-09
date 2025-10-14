import { Queue } from "../models/queue.mjs";
import { ServiceType, Ticket } from "../models/index.mjs";

/* The method allows to create a new queue related to a specific service type*/
export async function createQueue(serviceTypeId) {
  return await Queue.create({ serviceTypeId });
}

/* This method can be used to obtain the last number of ticket used for a certain queue:
    whenever you have to create a new ticket for that service type you could simply assign the
    lastIssuedTicketNumber+1 to the new ticket to be assigned to a customer
*/
export async function getLastIssuedTicketNumberByQueueId(queueId) {
  const queue = await Queue.findOne({ where: { queueId } });
  return queue.lastIssuedTicketNumber;
}

/* This method can be used to obtain the last number of ticket used for a certain service type:
    whenever you have to create a new ticket for that service type you could simply assign the
    lastIssuedTicketNumber+1 to the new ticket to be assigned to a customer
*/
export async function getLastIssuedTicketNumberByServiceTypeId(serviceTypeId) {
  const queue = await Queue.findOne({ where: { serviceTypeId } });
  return queue.lastIssuedTicketNumber;
}

export async function getQueueByServiceTypeId(serviceTypeId) {
  return await Queue.findOne({ where: { serviceTypeId } });
}
/* Retrieve all queues that handle the given service types, including their waiting tickets and
   related service type details.
*/
export async function getQueuesByServiceTypes(serviceTypeIds) {
  return await Queue.findAll({
    where: { serviceTypeId: serviceTypeIds },
    include: [
      {
        model: Ticket,
        as: "tickets",
        where: { status: "waiting" },
        required: false,
      },
      { model: ServiceType, as: "serviceType" },
    ],
  });
}
