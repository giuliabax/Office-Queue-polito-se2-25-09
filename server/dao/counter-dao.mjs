import { Counter } from "../models/counter.mjs";

/*  This method allow you to create a new counter by passing the number of the counter as parameter */
export async function createCounter(number) {
  return await Counter.create({ number });
}

/*  This method can be used to get info about the counter */
export async function getCounterByNumber(number) {
  return await Counter.findOne({ where: { number } });
}
