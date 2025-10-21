import { ServiceType } from "../models/service-type.mjs";

/* This method allows to create a new service type by passing the name and the acronym.
    (e.g: name: packages delivery, acronym: PADE) */
export async function createServiceType(name, acronym) {
  return await ServiceType.create({ name, acronym });
}

/* This method allows to get all service types */
export async function getAllServiceTypes() {
  return await ServiceType.findAll();
}
export async function getServiceTypeById(id) {
  return await ServiceType.findByPk(id);
}
