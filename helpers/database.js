const Sequelize = require("sequelize");
const dotenv = require("dotenv").config();

const databaseName = process.env.DB_NAME;
const password = process.env.DB_PASSWORD;
const user = process.env.DB_USER;
const dialect = process.env.DB_DIALECT;
const host = process.env.HOST;

const sequelize = new Sequelize(databaseName, user, password, {
    host: host,
    dialect: dialect,
    logging: false,
});

sequelize
.authenticate()
.then(() => {
    console.log("Conexión establecida correctamente.");})
.catch((err) => {
    console.log("Error al conectarse a la base de datos:");});
module.exports = sequelize;
