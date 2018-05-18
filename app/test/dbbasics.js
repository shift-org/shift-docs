"use strict";

const {it, describe} = require('mocha');
const assert = require('assert');


describe('DB', function() {
  describe('connection', function() {
    it('should have env variables for the db', function() {
      assert(process.env.POSTGRES_USER);
      assert(process.env.POSTGRES_PASSWORD);
      assert(process.env.POSTGRES_DB);
      assert(process.env.POSTGRES_HOST);
    });
    
    it('should be able to connect', function() {
  
      const {POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_HOST} = process.env;
  
      
      const Sequelize = require('sequelize');
      const sequelize = new Sequelize(POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, {
        host: POSTGRES_HOST,
        dialect: 'postgres',
        operatorsAliases: false,
    
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
      });
      
      sequelize
        .authenticate()
        .then(() => {
          assert(true);
          console.log('Connection has been established successfully.');
        })
        .catch(err => {
          assert(false);
          console.error('Unable to connect to the database:', err);
        });

    });
  });
});



