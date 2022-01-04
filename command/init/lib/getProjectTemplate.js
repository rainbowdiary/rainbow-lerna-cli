const request = require("@rainbow-lerna-cli/request");

module.exports = () => {
  return request({
    url: "/project/getTemplate",
  });
};
