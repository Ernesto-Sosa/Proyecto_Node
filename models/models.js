const { DataTypes } = require("sequelize");
const sequelize = require("../helpers/database");

const Places = sequelize.define("places", {
  place_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  state_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
place_image_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: true,
  paranoid: true,
});
module.exports = Places;

const Categories = require('./categories');
const States = require('./states');

// Relación uno a muchos con States
States.hasMany(Places, {
    foreignKey: 'stateId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
  Places.belongsTo(States, {
    foreignKey: 'stateId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
  // Relación muchos a muchos con Categories
  Places.belongsToMany(Categories, {
    through: "PlaceCategories",
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  });
  
