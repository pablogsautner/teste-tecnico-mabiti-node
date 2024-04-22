import mongoose from 'mongoose';
import supertest from 'supertest';
import sinon from 'sinon';
import { faker } from '@faker-js/faker';
import { expect, assert } from 'chai';

import './database';
import { User, UserModel, Region, RegionModel } from './models';
import lib from './lib';
import { server } from './server';

describe('Models', () => {
  let user: User;
  let session: mongoose.ClientSession;
  let sandbox: sinon.SinonSandbox;
  let transactionActive: boolean;

  before(async function () {
    this.timeout(10000);
    sandbox = sinon.createSandbox();
    sandbox.stub(lib, 'getAddressFromCoordinates').resolves(faker.location.streetAddress({ useFullAddress: true }));
    sandbox.stub(lib, 'getCoordinatesFromAddress').resolves({
      lat: faker.location.latitude(),
      lng: faker.location.longitude()
    });

    session = await mongoose.startSession();
    transactionActive = false;
    user = await createUser();
  });

  after(async function () {
    this.timeout(5000);
    sandbox.restore();
    if (session) {
      session.endSession();
    }
  });

  beforeEach(async function () {
    this.timeout(5000);
    if (!transactionActive) {
      await session.startTransaction();
      transactionActive = true;
    }
  });

  afterEach(async function () {
    this.timeout(5000);
    if (transactionActive) {
      await session.commitTransaction();
      transactionActive = false;
    }
  });

  describe('UserModel', () => {
    it('deve criar um usuário', async () => {
      expect(user).to.have.property('name');
      expect(user).to.have.property('email');
      expect(user).to.have.property('address');
    });
  });

  describe('RegionModel', () => {
    it('deve criar uma região', async () => {
      const regionData = { user: user._id, name: faker.name.firstName() };
      const [region] = await RegionModel.create([regionData], { session }) as Region[];
      expect(region).to.deep.include(regionData);
    });

    it('deve desfazer alterações em caso de falha', async () => {
      const userRecord = await UserModel.findOne({ _id: user._id }).select('regions').lean();
      try {
        await RegionModel.create([{ user: user._id.toString() }], { session });
        assert.fail('Deveria ter lançado um erro');
      } catch (error) {
        await session.abortTransaction();
        transactionActive = false;
        const updatedUserRecord = await UserModel.findOne({ _id: user._id }).select('regions').lean();
        expect(userRecord).to.deep.eq(updatedUserRecord);
      }
    });
  });

  it('deve retornar uma lista de usuários', async () => {
    const response = await supertest(server).get('/user');
    expect(response.status).to.equal(200);
  });

  it('deve retornar um usuário', async () => {
    const response = await supertest(server).get(`/users/${user._id}`);
    expect(response.status).to.equal(200);
  });

  async function createUser() {
    try {
      const userInstance: User = await UserModel.create({
        name: faker.person.firstName(),
        email: faker.internet.email(),
        address: faker.location.streetAddress({ useFullAddress: true }),
      });

      return userInstance;
    } catch (error) {
      throw new Error('Erro ao criar usuário: ' + error);
    }
  }

  it('deve criar um usuário', async () => {

    const user = await createUser();
  
    console.log('Usuário criado:', user);
  
    const users = await UserModel.find();
  
    const userExists = users.some(u => u._id.toString() === user._id.toString());
    expect(userExists).to.be.true;
  });
});