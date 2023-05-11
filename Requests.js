const { Context, Contract } = require("fabric-contract-api");
const { UserList, ROLES } = require("./Users");
const { ShopList } = require("./Shops");

class RequestsList {
  constructor(ctx) {
    this.ctx = ctx;
    this.KEY = "requests";
  }

  async setRequests(requests) {
    const DataRequests = Buffer.from(JSON.stringify(requests));
    await this.ctx.stub.putState(this.KEY, DataRequests);
    return requests;
  }

  async getRequests() {
    const RequestsList = await this.ctx.stub.getState(this.KEY);
    const requests = JSON.parse(RequestsList);
    return requests;
  }

  async getRequest(requestId) {
    const requests = await this.getRequests();
    return requests[requestId];
  }

  async setRequest(request) {
    const requests = await this.getRequests();
    requests.push(request);
    return await this.setRequests(requests);
  }

  async answerRequest(requestId, status) {
    const requests = await this.getRequests();
    requests[requestId].status = status;
    return await this.setRequests(requests);
  }
}

class RequestsCTX extends Context {
  constructor() {
    super();
    this.requestsList = new RequestsList(this);
    this.userList = new UserList(this);
    this.shopList = new ShopList(this);
  }
}

class Request {
  constructor(userLogin, role, shopId) {
    this.user = userLogin;
    this.role = role;
    this.shop = shopId; // если желаемая роль - продавец
    this.status = STATUS.WAITING;
  }
}

const STATUS = {
  WAITING: 0,
  ACCEPT: 1,
  DECLINE: 2,
};

class RequestsContract extends Contract {
  createContext() {
    return new RequestsCTX();
  }

  async initContract(ctx) {
    const requests = [];
    return await ctx.requestsList.setRequests(requests);
  }

  async setRequest(ctx, userLogin, role, shopId) {
    const request = new Request(userLogin, role, shopId);
    const user = await ctx.userList.getUser(userLogin);

    if (role !== ROLES.SELLER || role !== ROLES.BUYER) {
      return new Error();
    }
    if (user.role === role) {
      return new Error();
    }

    return await ctx.requestsList.setRequest(request);
  }

  async answerRequest(ctx, userLogin, requestId, answer) {
    const request = await ctx.requestsList.getRequest(requestId);
    const user = await ctx.userList.getUser(request.user);
    const answerer = await ctx.userList.getUser(userLogin);

    if (answerer.role !== ROLES.ADMIN) {
      return new Error();
    }
    if (request.status !== STATUS.WAITING) {
      return new Error();
    }

    // if user already have this role or answer === false
    if (user.role === request.role || answer === false) {
      return await ctx.requestsList.answerRequest(requestId, STATUS.DECLINE);
    }

    // if answer === true
    if (request.role === ROLES.SELLER) {
      await ctx.userList.setSeller(request.login);
      await ctx.shopList.setWorker(request.login);
    } else if (request.role === ROLES.BUYER) {
      await ctx.userList.setBuyer(login);
      await ctx.shopList.removeWorker(request.user);
    }
    return await ctx.requestsList.answerRequest(requestId, STATUS.ACCEPT);
  }

  async setAdmin(ctx, userLogin, newAdmninLogin) {
    const newAdmin = await ctx.userList.getUser(newAdmninLogin);
    const caller = await ctx.userList.getUser(userLogin);

    if (caller.role !== ROLES.ADMIN) {
      return new Error();
    }
    if (newAdmin.role !== ROLES.BUYER || newAdmin.role !== ROLES.SELLER) {
      return new Error();
    }

    if (newAdmin.role === ROLES.SELLER) {
      await ctx.shopList.removeWorker(newAdmninLogin);
    }
    return await ctx.userList.setAdmin(newAdmninLogin);
  }
}

module.exports.RequestsList = RequestsList;
module.exports.RequestsContract = RequestsContract;
