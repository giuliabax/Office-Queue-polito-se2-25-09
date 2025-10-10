import { DataTypes, Model } from "sequelize";

export class Officer extends Model {
  static associate(models) {
    Officer.belongsTo(models.Counter, {
      foreignKey: "counterId",
      as: "counter",
    });
  }
}

export function initOfficer(sequelize) {
  Officer.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.TEXT, allowNull: false },
      surname: { type: DataTypes.TEXT, allowNull: false },
      counterId: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      modelName: "Officer",
      tableName: "officers",
      timestamps: false,
    }
  );
}
