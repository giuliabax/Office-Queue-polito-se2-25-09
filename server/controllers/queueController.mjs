import { nextCustomer } from "../services/queueService.js";

export async function handleNextCustomer(req, res) {
    try {
        const counterId = Number(req.params.counterId);
        const result = await nextCustomer(counterId);

        if (result === null ) {
            return res.status(404).json({ message: "Counter not found"});
        }

        if (!result.customerServed) {
            return res.status(404).json({ message: "No customers in queue" });
        }

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
}