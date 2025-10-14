import { ServiceTypeCounter } from "../models/service-type-counter.mjs";
import { sequelize } from "../models/index.mjs";
export async function addServiceTypeToCounter(serviceTypeId, counterId) {
  return await ServiceTypeCounter.create({ serviceTypeId, counterId });
}

/* This method can be used to retrive all the service types managed by a certain counter */

export async function getServiceTypesByCounterId(counterId) {
  const serviceTypes = await sequelize.query(
    `SELECT st.*
     FROM "service-types" st
     JOIN "service-type-counters" stc ON st.id = stc.serviceTypeId
     WHERE stc.counterId = :counterId`,
    {
      replacements: { counterId },
      type: sequelize.QueryTypes.SELECT,
    }
  );
  return serviceTypes;
}
