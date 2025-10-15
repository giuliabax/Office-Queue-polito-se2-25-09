import sequelize from "./db/db.mjs";
import { ServiceType } from "./models/service-type.mjs";
import { Counter } from "./models/counter.mjs";
import { ServiceTypeCounter } from "./models/service-type-counter.mjs";
import { Queue } from "./models/queue.mjs";

/**
 * Popola il database con dati iniziali
 */
async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // 1. Crea i Service Types
    const services = [
      { name: "Bollettini", acronym: "B" },
      { name: "Spedizione pacchi", acronym: "P" }
    ];

    for (const service of services) {
      const [serviceType, created] = await ServiceType.findOrCreate({
        where: { acronym: service.acronym },
        defaults: service
      });

      if (created) {
        console.log(`Servizio creato: ${serviceType.name} (${serviceType.acronym})`);
        
        // Crea la coda associata al servizio
        await Queue.findOrCreate({
          where: { serviceTypeId: serviceType.id },
          defaults: {
            serviceTypeId: serviceType.id,
            lastIssuedTicketNumber: 0
          }
        });
        console.log(`Coda creata per ${serviceType.name}`);
      } else {
        console.log(`⏭Servizio già esistente: ${serviceType.name} (${serviceType.acronym})`);
      }
    }

    // 2. Crea alcuni Counter (sportelli)
    const counters = [
      { number: 1 },
      { number: 2 },
      { number: 3 }
    ];

    for (const counter of counters) {
      const [counterRecord, created] = await Counter.findOrCreate({
        where: { number: counter.number },
        defaults: counter
      });

      if (created) {
        console.log(`Counter creato: Sportello ${counterRecord.number}`);
      } else {
        console.log(`⏭Counter già esistente: Sportello ${counterRecord.number}`);
      }
    }

    // 3. Associa i servizi ai counter
    const allServices = await ServiceType.findAll();
    const allCounters = await Counter.findAll();

    // Counter 1 gestisce entrambi i servizi
    for (const service of allServices) {
      const [association, created] = await ServiceTypeCounter.findOrCreate({
        where: {
          serviceTypeId: service.id,
          counterId: allCounters[0].id
        },
        defaults: {
          serviceTypeId: service.id,
          counterId: allCounters[0].id
        }
      });

      if (created) {
        console.log(`Counter 1 associato a: ${service.name}`);
      }
    }

    // Counter 2 gestisce solo Bollettini
    const bollettini = allServices.find(s => s.acronym === 'B');
    if (bollettini) {
      const [association, created] = await ServiceTypeCounter.findOrCreate({
        where: {
          serviceTypeId: bollettini.id,
          counterId: allCounters[1].id
        },
        defaults: {
          serviceTypeId: bollettini.id,
          counterId: allCounters[1].id
        }
      });

      if (created) {
        console.log(`Counter 2 associato a: Bollettini`);
      }
    }

    // Counter 3 gestisce solo Spedizione pacchi
    const pacchi = allServices.find(s => s.acronym === 'P');
    if (pacchi) {
      const [association, created] = await ServiceTypeCounter.findOrCreate({
        where: {
          serviceTypeId: pacchi.id,
          counterId: allCounters[2].id
        },
        defaults: {
          serviceTypeId: pacchi.id,
          counterId: allCounters[2].id
        }
      });

      if (created) {
        console.log(`Counter 3 associato a: Spedizione pacchi`);
      }
    }

    console.log("Database seeding completed!");

  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

export default seedDatabase;