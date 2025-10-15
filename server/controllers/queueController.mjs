import { nextCustomer } from "../services/queueService.js";
import { getWaitingTickets } from "../dao/ticket-dao.mjs";


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

/**
 * Ottiene la lista dei prossimi ticket in coda
 * GET /api/queue
 */
export async function getQueueList(req, res) {
    try {
        console.log('📋 Getting queue list...');
        
        const tickets = await getWaitingTickets(10);
        
        console.log('✅ Queue tickets found:', tickets.length);
        
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