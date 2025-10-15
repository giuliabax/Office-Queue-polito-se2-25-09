import { Counter } from "../models/counter.mjs";
import { ServiceType } from "../models/service-type.mjs";

/*  This method allow you to create a new counter by passing the number of the counter as parameter */
export async function createCounter(number) {
  return await Counter.create({ number });
}

/*  This method can be used to get info about the counter */
export async function getCounterByNumber(number) {
  return await Counter.findOne({ where: { number } });
}

/*  Get all counters with their associated service types */
export async function getAllCounters() {
  return await Counter.findAll({
    include: [
      {
        model: ServiceType,
        as: 'serviceTypes',
        attributes: ['id', 'name', 'acronym'],
        through: { attributes: [] } // Non includere i campi della tabella intermedia
      }
    ],
    order: [['number', 'ASC']]
  });
}

/*  Get counter by ID */
export async function getCounterById(id) {
  return await Counter.findByPk(id, {
    include: [
      {
        model: ServiceType,
        as: 'serviceTypes',
        attributes: ['id', 'name', 'acronym'],
        through: { attributes: [] }
      }
    ]
  });
}
