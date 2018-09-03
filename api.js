"use strict";

// import hapi js
const Hapi = require("hapi");

// import level sandbox functions
const lv = require("./levelSandbox");

const SHA256 = require("crypto-js/sha256");

// Create a server with a host and port
const server = Hapi.server({
  host: "localhost",
  port: 8000
});

server.route([
  {
    // Get block route
    method: "GET",
    path: "/block/{height}",
    handler: async (request, h) => {
      try {
        // get block using request param as argument
        let block = await lv
          .getLevelDBData(encodeURIComponent(request.params.height))
          .then(block => {
            // check if block exists
            if (block === undefined || null) {
              return `Block with height of ${encodeURIComponent(
                request.params.height
              )} does not exist`;
            } else {
              return block;
            }
          })
          .catch(error => {
            // display error
            console.log(error);
          });

        // return block
        return block;
      } catch (error) {
        // display error
        console.log(error);
      }
    }
  },
  {
    // Add block route
    method: "POST",
    path: "/block",
    handler: async (request, h) => {
      // create block object
      let block = {
        hash: "",
        height: 0,
        body: "",
        time: 0,
        previousBlockHash: ""
      };

      try {
        // assign payload to local variable
        block.body = request.payload.body;

        // get block height
        block.height = await lv
          .getLevelDataCount()
          .then(res => {
            return res + 1;
          })
          .catch(err => {
            console.log(err);
          });

        // UTC timestamp
        block.time = Date.now();

        // previous block hash
        if (block.height > 0) {
          block.previousBlockHash = await lv.getLevelDBData(block.height - 1)
            .then(res => {
              return res.hash;
            })
            .catch(error => {
              console.log(error);
            });
        }

        // Block hash with SHA256 using newBlock and converting to a string
        block.hash = SHA256(JSON.stringify(block)).toString();

        // add data to chain
        lv.addDataToLevelDB(block);

        // return message
        return block;
      } catch (error) {
        console.log(error);
      }
    }
  }
]);

// Start the server
async function start() {
  try {
    await server.start();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
  console.log("Server running at:", server.info.uri);
}

start();
