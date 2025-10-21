import { nextCustomer } from "../services/queueService.js";
import { Ticket } from "../models/ticket.mjs";
import { Queue } from "../models/queue.mjs";
import { ServiceType } from "../models/service-type.mjs";
import { Counter } from "../models/counter.mjs";

export async function handleNextCustomer(req, res) {
    try {
        const counterId = Number(req.params.counterId);
        console.log(`📞 Counter ${counterId} calling next customer...`);
        
        const result = await nextCustomer(counterId);
        
        console.log('🔍 Result from nextCustomer:', result);

        if (result === null) {
            console.log('❌ Counter not found');
            return res.status(404).json({ message: "Counter not found" });
        }

        if (!result.customerServed) {
            console.log('⚠️ No customers in queue');
            return res.status(404).json({ message: result.remainingInQueue === 0 ? "No customers in queue" : "Queue is empty" });
        }

        console.log('✅ Next customer:', result.customerServed);
        res.json(result);
    } catch (err) {
        console.error('❌ Error in handleNextCustomer:', err);
        console.error('Stack:', err.stack);
        res.status(500).json({ 
            error: "Internal server error",
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
}

export async function handleCompleteCustomer(req, res) {
    try {
        const ticketId = Number(req.params.ticketId);
        console.log(`✅ Completing ticket ${ticketId}...`);
        
        const ticket = await Ticket.findByPk(ticketId);
        
        if (!ticket) {
            console.log('❌ Ticket not found');
            return res.status(404).json({ message: "Ticket not found" });
        }
        
        if (ticket.status !== 'ON_GOING') {
            console.log(`⚠️ Ticket ${ticketId} is not ON_GOING (status: ${ticket.status})`);
            return res.status(400).json({ message: "Ticket is not being served" });
        }
        
        // Marca il ticket come SERVED
        ticket.status = 'SERVED';
        ticket.counterId = null; // Libera il counter
        await ticket.save();
        
        console.log(`✅ Ticket ${ticket.number} marked as SERVED`);
        
        res.json({
            message: "Customer completed successfully",
            ticket: {
                id: ticket.id,
                number: ticket.number,
                status: ticket.status
            }
        });
    } catch (err) {
        console.error('❌ Error in handleCompleteCustomer:', err);
        console.error('Stack:', err.stack);
        res.status(500).json({ 
            error: "Internal server error",
            message: err.message
        });
    }
}

/**
 * Ottiene la lista dei prossimi ticket in coda
 * GET /api/queue
 * ⬅️ FIX: Include anche ticket ON_GOING e il Counter associato
 */
export async function getQueueList(req, res) {
    try {
        console.log('📋 Getting queue list...');
        
        // ⬅️ FIX: Include sia WAITING che ON_GOING
        const tickets = await Ticket.findAll({
            where: { 
                status: ['WAITING', 'ON_GOING'] 
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
                },
                // ⬅️ FIX: Include il Counter
                {
                    model: Counter,
                    as: 'counter',
                    attributes: ['id', 'number']
                }
            ],
            order: [['id', 'ASC']],
            limit: 10
        });
        
        console.log('✅ Queue tickets found:', tickets.length);
        
        // Log per debug
        tickets.forEach(ticket => {
            console.log(`📊 Ticket ${ticket.number}: status=${ticket.status}, counterId=${ticket.counterId}, counterNumber=${ticket.counter?.number}`);
        });
        
        res.json(tickets);
    } catch (err) {
        console.error('❌ Error getting queue list:', err);
        console.error('Stack:', err.stack);
        res.status(500).json({ 
            error: "Internal server error",
            message: err.message
        });
    }
}