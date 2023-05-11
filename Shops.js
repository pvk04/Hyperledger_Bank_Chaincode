import { Context, Contract } from "fabric-contract-api";
import { UserList } from "./Users";

class ShopList {
  constructor(ctx) {
    this.ctx = ctx;
    this.KEY = "shops";
  }

  async setShops(shops) {
    const DataShops = Buffer.from(JSON.stringify(shops));
    await this.ctx.stub.putState(this.KEY, DataShops);
    return shops;
  }

  async getShops() {
    const ShopList = await this.ctx.stub.getState(this.KEY);
    return JSON.parse(ShopList);
  }

  async getShop(shopId) {
    const ShopList = await this.ctx.stub.getState(this.KEY);
    const shops = JSON.parse(ShopList);
    return shops[shopId];
  }

  async setShop(shop) {
    const shops = await this.getShops();
    shops.push(shop);
    return await this.setShops(shops);
  }

  async setWorker(shopId, workerLogin) {
    const shops = this.getShops();
    shops[shopId].workers.push(workerLogin);
    return await this.setShops(shops);
  }

  async setRate(shopId, rate) {
    const shops = await this.getShops();
    shops[shopId].rates.push(rate);
    return await this.setShops(shops);
  }

  async likeRate(shopId, rateId, userLogin, like) {
    const shops = await this.getShops();
    shops[shopId].rates[rateId].likes[userLogin] = like;
    return await this.setShops(shops);
  }

  async setComment(shopId, rateId, comment) {
    const shops = await this.getShops();
    shops[shopId].rates[rateId].comments.push(comment);
    return await this.setShops(shops);
  }

  async likeComment(shopId, rateId, commentId, userLogin, like) {
    const shops = await this.getShops();
    shops[shopId].rates[rateId].comments[commentId].likes[userLogin] = like;
    return await this.setShops(shops);
  }
}

class ShopCTX extends Context {
  constructor() {
    super();
    this.shopList = new ShopList(this);
    this.userList = new UserList(this);
  }
}

class Shop {
  constructor(city, balance = 1000) {
    this.city = city;
    this.balance = balance;
    this.workers = []; // array of worker logins
    this.rates = []; // Rate[]
  }
}

class Rate {
  constructor(login, rate, text) {
    this.author = login;
    this.rate = rate;
    this.text = text;
    this.likes = {};
    this.comments = [];
  }
}

class Comment {
  constructor(text) {
    this.author = login;
    this.text = text;
    this.likes = {};
  }
}

class Like {
  constructor(isLike) {
    this.isLike = isLike; // true - like; false - dislike
  }
}

class ShopContract extends Contract {
  createContext() {
    return new ShopCTX();
  }

  async initContract(ctx) {
    const shops = [];
    shops.push(new Shop("Дмитров", 1000));
    shops.push(new Shop("Калуга", 900));
    shops.push(new Shop("Москва", 1050));
    shops.push(new Shop("Рязань", 700));
    shops.push(new Shop("Самара", 2000));
    shops.push(new Shop("Санкт-Петербург", 2300));
    shops.push(new Shop("Таганрог", 0));
    shops.push(new Shop("Томск", 780));
    shops.push(new Shop("Хабаровск", 1500));

    return await ctx.shopList.setShops(shops);
  }

  async setShop(ctx, city) {
    const shop = new Shop(city);

    return await ctx.shopList.setShop(shop);
  }

  async setWorker(ctx, shopId, workerLogin) {
    const shop = await ctx.shopList.getShop(shopId);
    const user = await ctx.userList.getUser(workerLogin);

    if (shop.workers.includes(workerLogin) || user.role !== 0) {
      return new Error();
    }

    return await ctx.shopList.setWorker(shopId, workerLogin);
  }

  async setRate(ctx, shopId, userLogin, rate, text = "") {
    const newRate = new Rate(userLogin, rate, text);
    // const user = await ctx.userList.getUser(userLogin);

    if (rate < 0 || rate > 10) {
      return new Error();
    }

    return await ctx.shopList.setRate(shopId, newRate);
  }

  async likeRate(ctx, shopId, userLogin, rateId, isLike) {
    const like = new Like(userLogin, isLike);
    const shops = await ctx.shopList.getShops();

    if (shops[shopId].rates[rateId].likes[userLogin]) {
      delete shops[shopId].rates[rateId].likes[userLogin];

      return await ctx.shopList.setShops(shops);
    }

    return await ctx.shopList.likeRate(shopId, rateId, userLogin, like);
  }

  async setComment(ctx, shopId, userLogin, rateId, text) {
    const comment = new Comment(userLogin, text);
    // const user = await ctx.userList.getUser(userLogin);

    return await ctx.shopList.setComment(shopId, rateId, comment);
  }

  async likeComment(ctx, shopId, rateId, commentId, userLogin, isLike) {
    const like = new Like(userLogin, isLike);
    const shops = await ctx.shopList.getShops();

    if (shops[shopId].rates[rateId].comments[commentId].likes[userLogin]) {
      delete shops[shopId].rates[rateId].comments[commentId].likes[userLogin];

      return await ctx.shopList.setShops(shops);
    }

    return await ctx.shopList.likeComment(
      shopId,
      rateId,
      commentId,
      userLogin,
      like
    );
  }
}

module.exports.ShopList = ShopList;
module.expoerts.ShopContract = ShopContract;
