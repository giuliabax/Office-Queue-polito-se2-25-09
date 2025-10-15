import {Counter} from "../models/counter.mjs";
import {ServiceType, Ticket, Officer} from "../models/index.mjs";
import {getQueuesByServiceTypes} from "../dao/queue-dao.mjs";

export async function nextCustomer(counterId) {

    const counter = await Counter.findByPk(counterId, {
        include: [
            { model: ServiceType, as: "serviceTypes" },
            { model: Officer, as: "officer" }
        ],
    });

    if (!counter || !counter.serviceTypes.length) return null;

    const servingQueues = await getQueuesByServiceTypes(counter.serviceTypes.map(s => s.id));

    const currentServing = await Ticket.findOne({
        where: {
            queueId: servingQueues.map(q => q.id),
            status: "serving",
        },
        order: [["id", "ASC"]],
    });

    if (currentServing) {
        currentServing.status = "served";
        await currentServing.save();
    }

    const nextTicket = await Ticket.findOne({
        where: {
            queueId: servingQueues.map(q => q.id),
            status: "waiting",
        },
        order: [["id", "ASC"]],
    });

    if (nextTicket) {
        nextTicket.status = "serving";
        await nextTicket.save();
    }

    const remainingInQueue = await Ticket.count({
        where: {
            queueId: servingQueues.map(q => q.id),
            status: "waiting"},
    });

    return {
        id: counter.id,
        officer: `${counter.officer.name} ${counter.officer.surname}`,
        services: counter.serviceTypes.map(s => s.name),
        customerServed: nextTicket
        ? {
            ticketNumber: nextTicket.number,
            serviceType: servingQueues.find(q => q.id === nextTicket.queueId).serviceType.name,
        }
        : null,
        remainingInQueue,
    };
}
