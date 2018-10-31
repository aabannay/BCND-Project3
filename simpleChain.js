/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');

/* ===== levelSandbox with level ============================
|  This is needed to presist the data using levelDB         |
|  ========================================================*/

const db = require('./levelSandbox');

/* ===== Block Class ==============================
|  Class with a constructor for block 			      |
|  ===============================================*/

class Block{
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		 |
|  ================================================*/

class Blockchain{
  constructor(){
    this.chain = [];
    this.addBlock(new Block("First block in the chain - Genesis block"));
  }
  // Add new block
  addBlock(newBlock){
    // Block hash with SHA256 using newBlock and converting to a string
    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
    // Block height
    getBlockHeight().then((height) => {
      newBlock.height = height + 1;
    });
    // UTC timestamp
    newBlock.time = new Date().getTime().toString().slice(0,-3);
    // previous block hash
    if(this.chain.length>0){
      newBlock.previousBlockHash = this.chain[this.chain.length-1].hash;
    }
    // Adding block object to chain
  	//this.chain.push(newBlock);
    db.addDataToLevelDB(newBlock.height, JSON.stringify(newBlock).toString())
      .then((result) => {
        console.log("added data: " + result.toString());
      }).catch((err) => {
        console.log("Error in addiing to database", err);
      });
  }

  // Get block height
    getBlockHeight(){
      let self = this; 
      return new Promise((resolve, reject) => {
        resolve(self.chain.length-1);
      });
    }

    // get block
    getBlock(blockHeight){
      // return object as a single string
      //return JSON.parse(JSON.stringify(this.chain[blockHeight]));
      return new Promise((resolve, reject) => {
            db.get(key, (err, value) => {
                if (err) return console.log('Not found!', err);
                resolve(value);
            });
        })
    }

    // validate block
    validateBlock(blockHeight){
      // get block object
      let block = null; 
      this.getBlock(blockHeight).then((result) => {
        block = result;
      });
      // get block hash
      let blockHash = block.hash;
      // remove block hash to test block integrity
      block.hash = '';
      //set time to 0 if this is the Genesis Block (so it validate)
      if (blockHeight == 0)
        block.time = 0; 
      // generate block hash
      let validBlockHash = SHA256(JSON.stringify(block)).toString();
      // Compare
      return new Promise ((resolve, reject) => {
        if (blockHash===validBlockHash) {
            resolve(true);
        } else {
            console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
            resolve(false);
        }
      });
       
    }

   // Validate blockchain
    validateChain(){
      let errorLog = [];
      for (var i = 0; i < this.chain.length-1; i++) {
        // validate block
        let isValid = undefined; 
        this.validateBlock(i).then((result) => {
          isValid = result; 
        });
        if (!isValid)
          errorLog.push(i);
        // compare blocks hash link
        let blockHash = this.chain[i].hash;
        let previousHash = this.chain[i+1].previousBlockHash;
        if (blockHash!==previousHash) {
          errorLog.push(i);
        }
      }
      if (errorLog.length>0) {
        console.log('Block errors = ' + errorLog.length);
        console.log('Blocks: '+errorLog);
      } else {
        console.log('No errors detected');
      }
    }
}
