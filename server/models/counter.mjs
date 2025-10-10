import { DataTypes, Model } from "sequelize";

export class Counter extends Model {
  static associate(models) {
    Counter.belongsToMany(models.ServiceType, {
      through: models.ServiceTypeCounter,
      foreignKey: "counterId",
      otherKey: "serviceTypeId",
      as: "serviceTypes",
    });
    Counter.hasOne(models.Officer, {
      foreignKey: "counterId",
      as: "officer",
    });
  }
}

export function initCounter(sequelize) {
  Counter.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      number: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      modelName: "Counter",
      tableName: "counters",
      timestamps: false,
    }
  );
}
