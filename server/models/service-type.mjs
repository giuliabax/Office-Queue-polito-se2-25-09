import { DataTypes, Model } from "sequelize";

export class ServiceType extends Model {
  static associate(models) {
    ServiceType.belongsToMany(models.Counter, {
      through: "service_type_counter",
      foreignKey: "serviceTypeId",
      otherKey: "counterId",
      as: "counters",
    });
    ServiceType.hasOne(models.Queue, {
      foreignKey: "serviceTypeId",
      as: "queue",
    });
  }
}

export function initServiceType(sequelize) {
  ServiceType.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.TEXT, allowNull: false },
      acronym: { type: DataTypes.TEXT, allowNull: false },
    },
    {
      sequelize,
      modelName: "ServiceType",
      tableName: "service-types",
      timestamps: true,
    }
  );
}
