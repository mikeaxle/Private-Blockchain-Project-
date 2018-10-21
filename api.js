"use strict";

// import hapi js
const Hapi = require("hapi");

// import level sandbox functions
const lv = require("./levelSandbox");

const SHA256 = require("crypto-js/sha256");

// import bitcoinjs library
const bitcoin = require("bitcoinjs-lib");

// import bitcoinjs message
const bitcoinMessage = require('bitcoinjs-message')


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

      // make sure body isn't string
      if (typeof block.body !== 'string' && block.body !== undefined) {
        // convert hex to ascii staring
        let hexStory = new Buffer(block.body.star.story, 'hex')
        block.body.star.storyDecoded = hexStory.toString('ascii')
      }
      // return block
      return block;
    } catch (error) {
      // display error
      console.log(error);
    }
  }
}, {
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

      // check if address was entered
      if(block.body.address !== undefined && block.body.address !== null){
        // check if there is a valid request in the mempool 
        let request = memPool.find(_block => {
          if(_block.address === block.body.address){
            return _block
          }
        })

        // if request does not exist, return
        if(request === undefined){
          return `There is no validation request associated with the address: ${block.body.address}`
        }
        
        if(request.messageSignature !== undefined){
          // check if request is valid
          if(request.messageSignature === 'invalid'){
            return `The validation request is marked as invalid. Please validate your request`
          }
        } else {
          return `A validation request was found associated with this address. Please validate your request.`
        }

      } else {
        return `Please enter a valid wallet address`
      }

      // check if star is being added to block chain chain
      if (block.body.star != undefined && block.body.star !== null) {

        // check for dec, ra and story 
        if (block.body.star.dec == undefined || block.body.star.ra == undefined || block.body.star.story == undefined) {

          return `Cannot register star - some parameters are missing. Fill in missing parameters`

        } else {
          // remove non ascii characters from story
          block.body.star.story = block.body.star.story.replace(/[^\x20-\x7E]+/g, "")

          // add story to buffer and convert ascii then to hex
          let storyBuffer = new Buffer(block.body.star.story, 'ascii').toString('hex')

          // if string is larger than 500 bytes, truncate to 500 bytes
          if (storyBuffer.length > 500) {
            return `Cannot register star - story is too long (${storyBuffer.length}). Make story shorter.`
          }

          //store in block
          block.body.star.story = storyBuffer

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

          // delete request from mempool
          memPool = memPool.filter(_block => {
            if(_block.address !== block.body.address) {
              return _block
            }
          })

          // return message
          return block;

        }
      } else {
        return `Cannot register star - some parameters are missing. Fill in missing parameters`
      }
    } catch (error) {
      console.log(error);
    }
  }
}, {
  // request validation route
  method: "POST",
  path: "/requestValidation",
  handler: async (request, h) => {
    // get wallet address from request payload
    let address = request.payload.address

    if (address === undefined || address === null) {
      return `Please enter a valid bitcoin address`
    }

    // get current timestamp
    let timestamp = Date.now()

    // look for block matching address in memPool
    var block = memPool.find((block) => {
      if (block.address === address) {
        return block
      }
    })

    // check if returned object is null
    if (block == undefined || block == null) {

      // create response block
      block = {
        address: address,
        message: `${address}:${timestamp}:starRegistry`,
        requestTimestamp: timestamp,
        validationWindow: 300
      }

      // add block to memPool array
      memPool.push(block)

    } else {
      // get time elapsed since validation request was started
      let timeElapsed = Math.round((Date.now() - block.requestTimestamp) / 1000)

      if (timeElapsed <= 300) {
        // subtract time elapsed from validation window
        block.validationWindow = 300
        block.validationWindow -= timeElapsed

      } else {
        //delete all requests with matching address from memPool: user can only have one validation request at a time
        memPool = memPool.filter((block) => {
          if (block.address !== address) {
            return block
          }
        })

        // renew request
        block = {
          address: address,
          message: `${address}:${timestamp}:starRegistry`,
          requestTimestamp: timestamp,
          validationWindow: 300
        }

      }

    }

    // return block in response response
    return block
  }
}, {
  // validate message signature route
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

    if (address == undefined || address == null) {
      return `Please enter a valid wallet address`
    }

    if (signature == undefined || signature == null) {
      return `Please enter a valid signature`
    }

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
        try {

        // verify message using bitcoinJS
        if (bitcoinMessage.verify(block.message, address, signature)) {
          // set status and success
          success = true
          block.messageSignature = "valid"

        } else {
          // set status and success
          success = false
          block.messageSignature = "invalid"
        }
      } catch(err){
        // set status and success
        success = false
        block.messageSignature = "invalid"
        console.log(err)
      }

        // write block back to mempool
        memPool.forEach((item) => {
          if (item.address == address) {
            item = block
          }
        })

        // update validation window period
        block.validationWindow = 300
        block.validationWindow -= timeElapsed

        // assign response status to block
        status = block

      } else {
        // set status and success
        success = false
        status = `Validation window of 5 minutes has expired. Please make another validation request`
        console.log(status)

        //delete all requests with matching address from memPool: user can only have one validation request at a time
        memPool = memPool.filter((block) => {
          if (block.address !== address) {
            return block
          }
        })
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

    // console.log(`mempool length  ${memPool.length}`)

    // return response
    return response
  }
}, {
  // Get star by blockchain wallet address route
  method: "GET",
  path: "/stars/address:{address}",
  handler: async (request, h) => {
    // get address from payload
    let address = request.params.address

    // array to store blocks
    let blocks = []

    // get blocks from levelDB with matching address
    blocks = await lv
      .getBlocksByAddress(address)
      .then(blocks => {
        return blocks
      })
      .catch(error => {
        // display error
        console.log(error);
      })

    // check if there are any blocks
    if (blocks.length > 0) {
      // return blocks
      return blocks
    } else {
      // return message informing user that there are no blocks matching the address
      return `There are no blocks registered to the address: ${address}`
    }
  }
}, {
  // Get star by block hash address route
  method: "GET",
  path: "/stars/hash:{hash}",
  handler: async (request, h) => {
    // get address from payload
    let hash = request.params.hash

    let block = await lv
      .getBlockByHash(hash)
      .then((res) => {
        return res
      })
      .catch((err) => {
        // display error
        console.log(error);
      })

    // check if there is a result
    if (block !== null) {
      return block;
    } else {
      return `The a block with hash: '${hash}' does not exist`
    }
  }
}]);

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