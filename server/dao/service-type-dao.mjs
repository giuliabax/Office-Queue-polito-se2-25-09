import { ServiceType } from "../models/service-type.mjs";

/* This method allows to create a new service type by passing the name and the acronym.
    (e.g: name: packages delivery, acronym: PADE) */
export async function createServiceType(name, acronym) {
  return await ServiceType.create({ name, acronym });
}

export async function getServiceTypeById(id) {
  return await ServiceType.findByPk(id);
}