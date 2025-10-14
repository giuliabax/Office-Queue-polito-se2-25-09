import {Counter} from "../models/counter.mjs";
import {ServiceType, Ticket} from "../models/index.mjs";
import {getQueuesByServiceTypes} from "../dao/queue-dao.mjs";

export async function nextCustomer(counterId) {

    const counter = await Counter.findByPk(counterId, {
        include: {model: ServiceType, as: "serviceTypes"},
    });

    if (!counter || !counter.serviceTypes.length) return null;

    const serviceTypeIds = counter.serviceTypes.map((s) => s.id);
    const queues = await getQueuesByServiceTypes(serviceTypeIds);
    if (!queues.length) return null;

    queues.sort((a, b) => b.tickets.length - a.tickets.length);

    const selectedQueue = queues[0];

    const ticket = await Ticket.findOne({
        where: {queueId: selectedQueue.id, status: "waiting"},
        order: [["id", "ASC"]],
    });
    if (!ticket) return null;

    ticket.status = "serving";
    ticket.counterId = counterId;
    await ticket.save();

    const remainingInQueue = await Ticket.count({
        where: {queueId: selectedQueue.id, status: "waiting"},
    });

    return {
        ticketNumber: ticket.number,
        serviceType: selectedQueue.serviceType.acronym,
        counterNumber: counter.number,
        status: ticket.status,
        remainingInQueue,
    };
}
