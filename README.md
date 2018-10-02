# Star Registration Private Blockchain REST API

- created with Node.js and Hapi.js REST framework

## Instructions to run API

- Run the api.js file with node using node {location_of_project}/api.js

### get block

- located at endpoint: localhost:8000/block/{block_height}
- use GET http method
- where {block_height} is the block height of the block to retrieve
- returns block in JSON format

### add block

- located at endpoint: localhost:8000/block
- Use POST http method
- required parameter is body, which contains the body text for the new block to be added to the chain
- adds new block to the chain and returns the newly added block

### Request star validation

- located at endpoint: localhost:8000/requestValidation
- Use POST http method
- required parameter is wallet address
- starts the validation process
- returns
  - address
  - message
  - timestamp
  - validation window period which is set to 5 minutes (300 seconds)

### Validate signature

- validates address and allows the address to register a star
- Use POST http method
- required parameters are:
  - wallet address
  - signature. this is the message from the /requestValidation which has been signed by the wallet's address
- returns success/failure status

### Get star block by wallet address

- gets blocks linked to wallet address
- Use GET http method
- required parameter is wallet address
- returns array of blocks

### Get star block by block hash

- gets block by its hash
- Use GET http method
- required parameter is block hash
- returns block
