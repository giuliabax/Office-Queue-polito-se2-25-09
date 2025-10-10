import { DataTypes, Model } from "sequelize";

export class Queue extends Model {
  static associate(models) {
    Queue.belongsTo(models.ServiceType, {
      foreignKey: "serviceTypeId",
      as: "serviceType",
    });
    Queue.hasMany(models.Ticket, {
      foreignKey: "queueId",
      as: "tickets",
    });
  }
}

export function initQueue(sequelize) {
  Queue.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      lastIssuedTicketNumber: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      sequelize,
      modelName: "Queue",
      tableName: "queues",
      timestamps: false,
    }
  );
}
