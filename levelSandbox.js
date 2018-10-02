/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

const level = require("level");
const chainDB = "./chaindata";
const db = level(chainDB, {
  valueEncoding: "json"
});

// Get block from levelDB with height
var getLevelDBData = function (key) {
  return db
    .get(key)
    .then(res => {
      // console.log(`Value = ${JSON.stringify(res)}`);
      return res;
    })
    .catch(err => {
      console.log(`Not found! ${err}`);
    });
};

// get blocks from levelDB with address
var getBlocksByAddress = function (address) {
  // array to store blocks
  var blocks = []

  return new Promise((resolve, reject) => {
    db.createReadStream({ keys: false, values: true })
      .on("data", block => {
        // make sure body isn't string
        if (typeof block.body !== 'string' && block.body !== undefined) {
          
          // check if block address === address
          if (block.body.address === address) {
            // convert hex to ascii staring
            let hexStory = new Buffer(block.body.star.story, 'hex')
            block.body.star.story = hexStory.toString('ascii')

            // add block to array
            blocks.push(block)
            console.log(block)
          }
        }
      })
      .on("error", err => {
        // create error string
        let reason = `Unable to read data stream ${err}`;

        // print error
        console.log(reason);

        // reject
        reject(reason);
      })
      .on("end", () => {
        // resolve blocks array
        resolve(blocks)
      })
  })
}

// get all levelDB entries
var getLevelDataCount = function () {
  // return as promise
  return new Promise((resolve, reject) => {
    // variable to store block height
    let blockHeight = -1;

    // get all items
    db.createReadStream()
      .on("data", res => {
        // increment block height
        console.log(res)
        blockHeight++;
      })
      .on("error", err => {
        // create error string
        let reason = `Unable to read data stream ${err}`;

        // print error
        console.log(reason);

        // reject
        reject(reason);
      })
      .on("end", () => {
        // print value
        console.log(`current block height is: ${blockHeight}`);

        // resolve value
        resolve(blockHeight);
      });
  });
};

// Add data to levelDB with key/value pair
var addLevelDBData = function (key, value) {
  db.put(key, value).catch(err => {
    console.log(`Block ${key} submission failed. ${err}`);
  });
};

// Add data to levelDB with value
var addDataToLevelDB = function (value) {
  let i = 0;
  db.createReadStream()
    .on("data", function (data) {
      // increase i to current block number
      i++;
    })
    .on("error", function (err) {
      return console.log("Unable to read data stream!", err);
    })
    .on("close", function () {
      console.log("Block #" + i);
      // add to level as is
      addLevelDBData(i, value);

    });
};


module.exports = {
  getLevelDataCount,
  getLevelDBData,
  addDataToLevelDB,
  addLevelDBData,
  getBlocksByAddress
};

/* ===== Testing ==============================================================|
|  - Self-invoking function to add blocks to chain                             |
|  - Learn more:                                                               |
|   https://scottiestech.info/2014/07/01/javascript-fun-looping-with-a-delay/  |
|                                                                              |
|  * 100 Milliseconds loop = 36,000 blocks per hour                            |
|     (13.89 hours for 500,000 blocks)                                         |
|    Bitcoin blockchain adds 8640 blocks per day                               |
|     ( new block every 10 minutes )                                           |
|  ===========================================================================*/

// (function theLoop (i) {
//   setTimeout(function () {
//     addDataToLevelDB(`Testing data`);
//     if (--i) theLoop(i);
//   }, 100);
// })(10);