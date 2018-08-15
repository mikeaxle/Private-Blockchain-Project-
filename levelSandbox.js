/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

const level = require("level");
const chainDB = "./chaindata";
const db = level(chainDB, { valueEncoding: "json" });

// Get data from levelDB with key
var getLevelDBData = function(key) {
  db.get(key)
    .then(res => {
      console.log(`Value = ${res}`);
    })
    .catch(err => {
      console.log(`Not found! ${err}`);
    });
};

// get all levelDB entries
var getLevelDataCount = function() {
  return Promise((resolve, reject) => {
    // variable to store block height
    let blockHeight = 0;

    // get all items
    db.createReadStream()
      .on("data", res => {
        // increment block height
        blockHeight++;
      })
      .on("error", err => {
        // print error
        let reason = `Unable to read data stream ${err}`;
        console.log(reason);
        reject(reason);
      })
      .on("close", () => {
        // return  value
        console.log(blockHeight);
        resolve(blockHeight - 1);
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

      // check if i is less than 10
      if (i < 10) {
        // pre-pend 0 and add to level
        addLevelDBData("0" + i, value);
      } else {
        // add to level as is
        addLevelDBData(i, value);
      }
    });
};

module.exports = {
  getLevelDataCount,
  getLevelDBData
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
