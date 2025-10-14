import { sequelize, Queue, ServiceType } from "./models/index.mjs";
import { getTicket } from "./controllers/ticketController.mjs";

const mockRes = {
  json: (data) => console.log("Response JSON:", data),
  status: function (code) { this.statusCode = code; return this; },
};

function createMockReq(serviceTypeId) {
  return { body: { serviceTypeId } };
}

async function runEdgeCaseTests() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log("DB ready\n");

    // ============================
    // 1️⃣ Test con più service type
    // ============================
    console.log("=== Test 1: Multiple Service Types ===");

    const shipping = await ServiceType.create({ name: "Shipping", acronym: "SHIP" });
    const accounts = await ServiceType.create({ name: "Accounts", acronym: "ACCT" });

    const queueShipping = await Queue.create({ serviceTypeId: shipping.id, lastIssuedTicketNumber: 0 });
    const queueAccounts = await Queue.create({ serviceTypeId: accounts.id, lastIssuedTicketNumber: 0 });

    const requests1 = [
      shipping.id,
      accounts.id,
      shipping.id,
      shipping.id,
      accounts.id
    ];

    for (let i = 0; i < requests1.length; i++) {
      console.log(`\nCliente ${i+1} (ServiceTypeId=${requests1[i]})`);
      const req = createMockReq(requests1[i]);
      await getTicket(req, mockRes);
    }

    // ==================================
    // 2️⃣ Test con coda già non vuota
    // ==================================
    console.log("\n=== Test 2: Queue Already Not Empty ===");

    // Imposta lastIssuedTicketNumber a 5 per Shipping
    queueShipping.lastIssuedTicketNumber = 5;
    await queueShipping.save();

    const req2 = createMockReq(shipping.id);
    console.log("\nCliente nuovo su Shipping (lastIssuedTicketNumber=5)");
    await getTicket(req2, mockRes); // dovrebbe generare ticketNumber=6

    // ==================================
    // 3️⃣ Test con service type inesistente
    // ==================================
    console.log("\n=== Test 3: Nonexistent Service Type ===");

    const fakeServiceTypeId = 9999;
    const req3 = createMockReq(fakeServiceTypeId);
    await getTicket(req3, mockRes); // dovrebbe restituire 404

    await sequelize.close();
    console.log("\nDB connection closed");

  } catch (error) {
    console.error("Edge case tests failed:", error);
  }
}

runEdgeCaseTests();
