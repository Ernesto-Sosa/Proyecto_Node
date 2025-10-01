// seeders/20251001072312-demo-inventario.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     */
    await queryInterface.bulkInsert('Inventarios', [
      {
        nombre: 'Aceite Motor 5W-30 Sintético',
        descripcion: 'Aceite sintético premium para motor, 1 litro',
        categoria: 'Lubricantes',
        precio: 25.00,
        stock: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Filtro de Aire Premium',
        descripcion: 'Filtro de aire de alta eficiencia para vehículos',
        categoria: 'Filtros',
        precio: 18.50,
        stock: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Pastillas de Freno Delanteras',
        descripcion: 'Juego completo de pastillas de freno delanteras',
        categoria: 'Frenos',
        precio: 65.00,
        stock: 25,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Batería 12V 60Ah',
        descripcion: 'Batería de auto 12 voltios 60 amperios',
        categoria: 'Eléctrico',
        precio: 150.00,
        stock: 15,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Líquido de Frenos DOT-4',
        descripcion: 'Líquido de frenos de alta temperatura',
        categoria: 'Líquidos',
        precio: 12.00,
        stock: 40,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Aceite Transmisión ATF',
        descripcion: 'Aceite para transmisión automática',
        categoria: 'Lubricantes',
        precio: 22.00,
        stock: 35,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Filtro de Aceite Estándar',
        descripcion: 'Filtro de aceite para motores gasolina',
        categoria: 'Filtros',
        precio: 15.00,
        stock: 45,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Bujías Iridio',
        descripcion: 'Juego de 4 bujías de iridio larga duración',
        categoria: 'Eléctrico',
        precio: 48.00,
        stock: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Llanta 185/65R15',
        descripcion: 'Llanta radial todo tiempo',
        categoria: 'Llantas',
        precio: 110.00,
        stock: 25,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Anticongelante Concentrado',
        descripcion: 'Anticongelante para sistema de refrigeración',
        categoria: 'Líquidos',
        precio: 18.75,
        stock: 28,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     */
    await queryInterface.bulkDelete('Inventarios', null, {});
  }
};