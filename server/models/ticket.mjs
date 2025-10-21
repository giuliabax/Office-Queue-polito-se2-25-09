import { DataTypes, Model } from "sequelize";

export class Ticket extends Model {
  static associate(models) {
    Ticket.belongsTo(models.Queue, {
      foreignKey: "queueId",
      as: "queue",
    });
    Ticket.belongsTo(models.Counter, {
      foreignKey: "counterId",
      as: "counter",
    });
  }
}

export function initTicket(sequelize) {
  Ticket.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      number: { type: DataTypes.TEXT, allowNull: false },
      status: {
        type: DataTypes.ENUM("ON_GOING", "WAITING", "SERVED"),
        allowNull: false,
        defaultValue: "WAITING",
      },
      queueId: { type: DataTypes.INTEGER, allowNull: false },
      counterId: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
    },
    {
      sequelize,
      modelName: "Ticket",
      tableName: "tickets",
      timestamps: false,
    }
  );
  return Ticket;
}
