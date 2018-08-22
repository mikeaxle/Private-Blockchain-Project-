/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

const level = require("level");
const chainDB = "./chaindata";
const db = level(chainDB, { valueEncoding: "json" });

// Get data from levelDB with key
var getLevelDBData = function(key) {
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

// get all levelDB entries
var getLevelDataCount = function() {
  // return as promise
  return new Promise((resolve, reject) => {
    // variable to store block height
    let blockHeight = 0;

    // get all items
    db.createReadStream()
      .on("data", res => {
        // increment block height
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
        console.log(blockHeight);

        // resolve value
        resolve(blockHeight);
      });
  });
};

// Add data to levelDB with key/value pair
var addLevelDBData = function(key, value) {
  db.put(key, value).catch(err => {
    console.log(`Block ${key} submission failed. ${err}`);
  });
};

// Add data to levelDB with value
var addDataToLevelDB = function(value) {
  let i = 0;
  db.createReadStream()
    .on("data", function(data) {
      // increase i to current block number
      i++;
    })
    .on("error", function(err) {
      return console.log("Unable to read data stream!", err);
    })
    .on("close", function() {
      console.log("Block #" + i);
        // add to level as is
        addLevelDBData(i, value);

    });
};

module.exports = {
  getLevelDataCount,
  getLevelDBData,
  addDataToLevelDB
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