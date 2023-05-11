const { Contract, Context } = require("fabric-contract-api");

class UserList {
  constructor(ctx) {
    this.ctx = ctx;
    this.KEY = "Users";
  }

  async setUsers(users) {
    const DataUsers = Buffer.from(JSON.stringify(users));
    await this.ctx.stub.putState(this.KEY, DataUsers);
    return users;
  }

  async getUsers() {
    const UserList = await this.ctx.stub.getState(this.KEY);
    return JSON.parse(UserList);
  }

  async getUser(login) {
    const users = await this.getUsers();
    return users[login];
  }

  async setUser(login, user) {
    const users = await this.getUsers();
    users[login] = user;
    return await this.setUsers(users);
  }

  async setBuyer(login) {
    const users = await this.getUsers();
    users[login] = ROLES.BUYER;
    return await this.setUsers(users);
  }

  async setSeller(login) {
    const users = await this.getUsers();
    users[login] = ROLES.SELLER;
    return await this.setUsers(users);
  }

  async setAdmin(login) {
    const users = await this.getUsers();
    users[login].role = ROLES.ADMIN;
    return await this.setUsers(users);
  }
}

class UsersCTX extends Context {
  constructor() {
    super();
    this.userList = new UserList(this);
  }
}

const ROLES = {
  BUYER: 0,
  SELLER: 1,
  ADMIN: 2,
  BANK: 3,
  PROVIDER: 4,
};

class User {
  static #id = 0;
  constructor(role, shopId, name = "", balance = 0) {
    this.id = User.#id++;
    this.role = role;
    this.shopId = shopId;
    this.name = name;
    this.balance = balance;
  }
}

class UsersContract extends Contract {
  createContext() {
    return new UsersCTX();
  }

  async initContract(ctx) {
    const users = {};
    users["bank"] = new User(ROLES.BANK, -1, "", 10000);
    users["provider"] = new User(ROLES.PROVIDER, -1, "", 0);

    return await ctx.userList.setUsers(users);
  }

  async registration(ctx, login, name) {
    const user = new User(ROLES.BUYER, -1, name);
    return await ctx.userList.setUser(login, user);
  }
}

module.exports.UserList = UserList;
module.exports.UsersContract = UsersContract;
module.exports.ROLES = ROLES;
