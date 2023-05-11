const { UsersContract } = require("./Users");
const { ShopContract } = require("./Shops");
const { RequestsContract } = require("./Requests");

module.exports.UsersContract = UsersContract;
module.exports.ShopContract = ShopContract;
module.exports.RequestsContract = RequestsContract;
module.exports.contracts = [UsersContract, ShopContract, RequestsContract];
