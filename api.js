"use strict";

// import hapi js
const Hapi = require("hapi");

// import level sandbox functions
const lv = require("./levelSandbox");

const SHA256 = require("crypto-js/sha256");


// memPool global array
var memPool = [];

// Create a server with a host and port
const server = Hapi.server({
  host: "localhost",
  port: 8000
});

server.route([{
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
        body: {},
        time: 0,
        previousBlockHash: ""
      };

      try {
        // assign payload to local variable
        block.body = request.payload.body;

        // // encode block story to hex
        let storyHex = new Buffer(block.body.star.story).toString('hex')
        block.body.star.story = storyHex

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
          block.previousBlockHash = await lv
            .getLevelDBData(block.height - 1)
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
  },
  {
    // request validation route
    method: "POST",
    path: "/requestValidation",
    handler: async (request, h) => {
      // get wallet address from request payload
      let blockchainID = request.payload.walletAddress

      // get current timestamp
      let timestamp = Date.now()

      // create response object
      var block = {
        address: blockchainID,
        message: `${blockchainID}:${timestamp}:starRegistry`,
        requestTimestamp: timestamp,
        validationWindow: 300
      }

      // add block to memPool array
      memPool.push(block)

      // return block in response response
      return block
    }
  },
  {
    // validate message signature
    method: "POST",
    path: "/message-signature/validate",
    handler: async (request, h) => {
      // boolean to store success 
      let success;

      // variable to store status
      let status

      // object to store response
      let response = {}

      // get address and signature from payload
      let address = request.payload.address
      let signature = request.payload.signature

      // variable to store block from memPool
      let block = null

      // look for block matching address in memPool
      block = memPool.find((block) => {
        if (block.address === address) {
          return block
        }
      })

      // check if returned object is null
      if (block !== undefined && block !== null) {
        console.log(`A validation request matching the address: ${address} has been found!`)

        // get time elapsed since validation request was started
        let timeElapsed = Math.round((Date.now() - block.requestTimestamp) / 1000)

        // check if time elapsed is less than 5 minutes
        if (timeElapsed <= 300) {

          // set status and success
          success = true
          block.messageSignature = "valid"
          block.validationWindow -= timeElapsed
          status = block

        } else {
          // set status and success
          success = false
          status = `Validation window of 5 minutes has expired. Please make another validation request`
          console.log(status)

          //delete request from memPool
          memPool.pop()
        }
      } else {
        // set status and success
        success = false
        status = `No validation request matching the address: ${address} was found`
        console.log(status)
      }

      // add status and success to response
      response.registerStar = success
      response.status = status

      // return response
      return response
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