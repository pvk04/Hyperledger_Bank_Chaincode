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
    await this.setUsers(users);
    return user;
  }

  async setBuyer(login) {
    const users = await this.getUsers();
    users[login].role = ROLES.BUYER;
    return await this.setUsers(users);
  }

  async setSeller(login) {
    const users = await this.getUsers();
    users[login].role = ROLES.SELLER;
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
  constructor(role, name = "", balance = 0) {
    this.id = User.#id++;
    this.role = role;
    this.name = name;
    this.balance = balance;
  }
}

class UsersContract extends Contract {
  createContext() {
    return new UsersCTX();
  }

  async initContract(ctx) {
    const users = { adm: new User(ROLES.ADMIN, "admin") };
    users["bank"] = new User(ROLES.BANK, "", 10000);
    users["provider"] = new User(ROLES.PROVIDER, "", 0);

    return await ctx.userList.setUsers(users);
  }

  async getUsers(ctx) {
    return await ctx.userList.getUsers();
  }

  async getUser(ctx, login) {
    return await ctx.userList.getUser(login);
  }

  async registration(ctx, login, name) {
    const user = new User(ROLES.BUYER, name);
    return await ctx.userList.setUser(login, user);
  }
}

module.exports.UserList = UserList;
module.exports.UsersContract = UsersContract;
module.exports.ROLES = ROLES;
