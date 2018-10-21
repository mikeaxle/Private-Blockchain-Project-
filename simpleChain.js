const lv = require("./levelSandbox");

/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require("crypto-js/sha256");

/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block {
  constructor(data) {
    this.hash = "";
    this.height = 0;
    this.body = data;
    this.time = 0;
    this.previousBlockHash = "";
  }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/
class Blockchain {
  constructor() {
    // init total block height
    this.totalBlockHeight;

    // call function to get total block height
    this.getBlockHeight()
      .then(blockHeight => {
        // create genesis block
        if (blockHeight == -1) {
          console.log('no blocks in chain');
          this.addBlock(new Block({
            address: '13wLKyZrhEMUnD88crU3AtL8tcBD6jUTfq',
            star: {
              dec: "-26° 29' 24.9",
              ra: "16h 29m 1.0s",
              story: 'First star in the BlockChain - Genesis block',
            }

          }));
        }
      })
      .catch(err => {
        console.log(err);
      });
  }

  // Get block height
  getBlockHeight() {
    // return promise
    return lv
      .getLevelDataCount()
      .then(res => {
        return (this.totalBlockHeight = res);
      })
      .catch(err => {
        console.log(err);
      });
  }

  // Add new block
  async addBlock(newBlock) {
    try {
      // increment block height by 1
      this.totalBlockHeight += 1;

      // Block height
      newBlock.height = this.totalBlockHeight;

      // UTC timestamp
      newBlock.time = Date.now();

      // previous block hash
      if (this.totalBlockHeight > 0) {
        newBlock.previousBlockHash = await this.getBlock(
          this.totalBlockHeight - 1
        )
          .then(block => {
            return block.hash;
          })
          .catch(error => {
            console.log(error);
          });
      }

      // Block hash with SHA256 using newBlock and converting to a string
      newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();

      console.log(newBlock);

      // Adding block object to chain
      lv.addDataToLevelDB(newBlock);
    } catch (error) {
      console.log(error);
    }
  }

  //  get block function
  getBlock(blockHeight) {
    return lv.getLevelDBData(blockHeight);
  }

  // validate block function
  async validateBlock(blockHeight) {
    try {
      // get block object
      let block = await this.getBlock(blockHeight)
        .then(res => {
          return res;
        })
        .catch(err => {
          console.log(err);
        });

      // console.log(`this is the block ${block}`);
      // get block hash
      let blockHash = block.hash;

      // remove block hash to test block integrity
      block.hash = "";

      // generate block hash
      let validBlockHash = SHA256(JSON.stringify(block)).toString();

      // Compare
      if (blockHash === validBlockHash) {
        console.log("Valid hash: " + blockHash);
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
    } catch (error) {
      console.log(error);
    }
  }

  // Validate blockchain
  async validateChain() {
    // array store errors
    let errorLog = [];

    for (var i = 0; i < this.totalBlockHeight + 1; i++) {
      try {
        // check if current block is valid

        let isBlockValid = await this.validateBlock(i)
          .then(valid => {
            return valid;
          })
          .catch(error => {
            console(error);
          });

        // add to error array if invalid block
        if (!isBlockValid) {
          errorLog.push(i);
        }

        // check if i is greater than block height
        // if (i == this.totalBlockHeight) {
        //   // break loop
        //   break;
        // } else {
        // get block hash
        let blockHash = await this.getBlock(i)
          .then(res => {
            return res.hash;
          })
          .catch(err => {
            console.log(err);
          });

        // console.log(`current index ${i}`);

        // check if last block
        if (i == this.totalBlockHeight) {
          break;
        } else {
          // get block hash from next block
          let previousHash = await this.getBlock(i + 1)
            .then(res => {
              return res.previousBlockHash;
            })
            .catch(err => {
              console.log(err);
            });

          // compare block hash from current block to previous block hash in next block
          if (blockHash !== previousHash) {
            errorLog.push(i);
          }
        }
        // }
      } catch (error) {
        console.log(error);
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

module.exports = {
  Block,
  Blockchain
};