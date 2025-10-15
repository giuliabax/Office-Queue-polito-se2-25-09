import {Counter} from "../models/counter.mjs";
import {ServiceType, Ticket, Officer, Queue} from "../models/index.mjs";
import {getQueuesByServiceTypes} from "../dao/queue-dao.mjs";

export async function nextCustomer(counterId) {
    try {
        console.log(`🔍 [nextCustomer] Looking for counter ${counterId}...`);
        
        const counter = await Counter.findByPk(counterId, {
            include: [
                { model: ServiceType, as: "serviceTypes" },
                { model: Officer, as: "officer" }
            ],
        });

        if (!counter) {
            console.log(`❌ [nextCustomer] Counter ${counterId} not found`);
            return null;
        }

        console.log(`✅ [nextCustomer] Counter found:`, counter.number);
        console.log(`📋 [nextCustomer] Service types:`, counter.serviceTypes.map(s => s.name));

        if (!counter.serviceTypes.length) {
            console.log(`⚠️ [nextCustomer] Counter has no service types`);
            return {
                id: counter.id,
                officer: counter.officer ? `${counter.officer.name} ${counter.officer.surname}` : "No officer assigned",
                services: [],
                customerServed: null,
                remainingInQueue: 0,
            };
        }

        const serviceTypeIds = counter.serviceTypes.map(s => s.id);
        console.log(`🔍 [nextCustomer] Looking for queues with service types:`, serviceTypeIds);

        const servingQueues = await getQueuesByServiceTypes(serviceTypeIds);
        console.log(`📋 [nextCustomer] Found ${servingQueues.length} queues`);

        // Chiudi il ticket corrente se esiste
        const currentServing = await Ticket.findOne({
            where: {
                queueId: servingQueues.map(q => q.id),
                status: "ON_GOING",
            },
            order: [["id", "ASC"]],
        });

        if (currentServing) {
            console.log(`✅ [nextCustomer] Closing current ticket #${currentServing.number}`);
            currentServing.status = "SERVED";
            await currentServing.save();
        }

        // Trova il prossimo ticket in attesa
        console.log(`🔍 [nextCustomer] Looking for next waiting ticket...`);
        
        const nextTicket = await Ticket.findOne({
            where: {
                queueId: servingQueues.map(q => q.id),
                status: "WAITING",
            },
            include: [
                {
                    model: Queue,
                    as: "queue",
                    include: [
                        {
                            model: ServiceType,
                            as: "serviceType"
                        }
                    ]
                }
            ],
            order: [["id", "ASC"]],
        });

        if (!nextTicket) {
            console.log(`⚠️ [nextCustomer] No waiting tickets found`);
        } else {
            console.log(`✅ [nextCustomer] Found ticket #${nextTicket.number} for ${nextTicket.queue.serviceType.name}`);
            nextTicket.status = "ON_GOING";
            nextTicket.counterId = counterId;
            await nextTicket.save();
        }

        const remainingInQueue = await Ticket.count({
            where: {
                queueId: servingQueues.map(q => q.id),
                status: "WAITING"
            },
        });

        console.log(`📊 [nextCustomer] Remaining in queue: ${remainingInQueue}`);

        return {
            id: counter.id,
            officer: counter.officer ? `${counter.officer.name} ${counter.officer.surname}` : "No officer assigned",
            services: counter.serviceTypes.map(s => s.name),
            customerServed: nextTicket
                ? {
                    ticketNumber: nextTicket.number,
                    serviceType: nextTicket.queue.serviceType.name,
                }
                : null,
            remainingInQueue,
        };
    } catch (error) {
        console.error('❌ [nextCustomer] Error:', error);
        console.error('Stack:', error.stack);
        throw error;
    }
}
