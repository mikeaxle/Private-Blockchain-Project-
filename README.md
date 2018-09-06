#Private Blockchain REST API

created with Node.js and Hapi.js REST framework

##Instructions to run API

- Run the api.js file with node (node {location_of_project}/api.js)


## get block 
    - located at endpoint: __localhost:8000/block/{block_height}__
    - use **GET** http method
    - where *{block_height}* is the block height of the block to retrieve
    - returns block in JSON format

## add block
    - located at endpoint: **localhost:8000/block**
    - Use **POST** http method
    - required parameter is body, which contains the body text for the new block to be added to the chain
    - adds new block to the chain and returns the newly added block
