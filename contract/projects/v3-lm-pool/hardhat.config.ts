import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";
import "dotenv/config";
import "solidity-docgen";
require("dotenv").config({ path: require("find-config")(".env") });

export default {
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    B2Testnet: {
      url: process.env.B2_TESTNET_URL!,
      accounts: [process.env.PRIVATE_KEY!],
      timeout: 180000,
    },
    Habitat: {
      url: "https://habitat-rpc.bsquared.network",
      accounts: [process.env.PRIVATE_KEY!],
      timeout: 180000,
    },
  },
  paths: {
    sources: "./contracts/",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  solidity: {
    compilers: [
      {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 100,
          },
        },
      },
    ],
  },
};
