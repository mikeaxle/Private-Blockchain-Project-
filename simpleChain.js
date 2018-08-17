const lv = require("./levelSandbox");

/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require("crypto-js/sha256");

var totalBlockHeight;

/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block {
  constructor(data) {
    (this.hash = ""),
      (this.height = 0),
      (this.body = data),
      (this.time = 0),
      (this.previousBlockHash = "");
  }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/
class Blockchain {
  constructor() {
    // call function to get total block height
    this.getBlockHeight();

    // wait 3 seconds
    setTimeout(() => {
      // create genesis block
      if (totalBlockHeight == 0) {
        console.log("no blocks");
        this.addBlock(new Block("First block in the chain - Genesis block"));
      }
    }, 3000);
  }

  // Get block height
  getBlockHeight() {
    // consume promise
    lv.getLevelDataCount()
      .then(res => {
        totalBlockHeight = res;
      })
      .catch(err => {
        console.log(err);
      });
  }

  // Add new block
  addBlock(newBlock) {
    // Block height
    newBlock.height = totalBlockHeight;

    // UTC timestamp
    newBlock.time = Date.now();

    // previous block hash
    if (this.totalBlockHeight > 0) {
      newBlock.previousBlockHash = this.chain[totalBlockHeight - 1].hash;
    }

    // Block hash with SHA256 using newBlock and converting to a string
    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();

    // Adding block object to chain
    lv.addDataToLevelDB(newBlock);
  }

  // get block
  getBlock(blockHeight) {
    // return object as a single string
    return JSON.parse(JSON.stringify(this.chain[blockHeight]));
  }

  // validate block
  validateBlock(blockHeight) {
    // get block object
    let block = this.getBlock(blockHeight);
    // get block hash
    let blockHash = block.hash;
    // remove block hash to test block integrity
    block.hash = "";
    // generate block hash
    let validBlockHash = SHA256(JSON.stringify(block)).toString();
    // Compare
    if (blockHash === validBlockHash) {
      return true;
    } else {
      console.log(
        "Block #" +
          blockHeight +
          " invalid hash:\n" +
          blockHash +
          "<>" +
          validBlockHash
      );
      return false;
    }
  }

  // Validate blockchain
  validateChain() {
    let errorLog = [];
    for (var i = 0; i < this.totalBlockHeight - 1; i++) {
      // validate block
      if (!this.validateBlock(i)) errorLog.push(i);
      // compare blocks hash link
      let blockHash = this.chain[i].hash;
      let previousHash = this.chain[i + 1].previousBlockHash;
      if (blockHash !== previousHash) {
        errorLog.push(i);
      }
    }
    if (errorLog.length > 0) {
      console.log("Block errors = " + errorLog.length);
      console.log("Blocks: " + errorLog);
    } else {
      console.log("No errors detected");
    }
  }
}
