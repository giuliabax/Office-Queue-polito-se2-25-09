import { Officer } from "../models/officer.mjs";

export async function createOfficer(name, surname, counterId) {
  return await Officer.create({ name, surname, counterId });
}

/*  This method can be used to get info about the officer for a certain counter */
export async function getOfficerByCounterId(counterId) {
  return await Officer.findOne({ where: { counterId } });
}
