import { DataTypes, Model } from "sequelize";

export class ServiceTypeCounter extends Model {}

export function initServiceTypeCounter(sequelize) {
  ServiceTypeCounter.init(
    {
      serviceTypeId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      counterId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
    },
    {
      sequelize,
      modelName: "ServiceTypeCounter",
      tableName: "service_type_counter",
      timestamps: false,
    }
  );
}
