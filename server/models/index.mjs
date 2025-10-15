import sequelize from "../db/db.mjs";
import { initCounter, Counter } from "./counter.mjs";
import { initOfficer, Officer } from "./officer.mjs";
import { initQueue, Queue } from "./queue.mjs";
import { initServiceType, ServiceType } from "./service-type.mjs";
import {
  initServiceTypeCounter,
  ServiceTypeCounter,
} from "./service-type-counter.mjs";
import { initTicket, Ticket } from "./ticket.mjs";

initCounter(sequelize);
initOfficer(sequelize);
initQueue(sequelize);
initServiceType(sequelize);
initServiceTypeCounter(sequelize);
initTicket(sequelize);

Counter.associate({ ServiceType, ServiceTypeCounter, Officer, Ticket });
Officer.associate({ Counter });
Queue.associate({ ServiceType, Ticket });
ServiceType.associate({ Counter, Queue, ServiceTypeCounter });
Ticket.associate({ Queue , Counter });

export { sequelize, Counter, Officer, Queue, ServiceType, Ticket };
