const crypto = require('crypto');
const privateKey = 'someprivatekey';

//to let the app running when there is an error in the try catch statment
process.on('uncaughtException', function (error) {
   console.log(error.stack);
});

var decrypt = function(textToDecipher){
	try{
	//var textToDecipher = 'QgEfVn9CaC0gCvA3FWbw74cHln/pwPZTipoEsqcyuFaakukdFOQnf9kIpUS9Ekl9QtqUmIo04b4='; // Text "dataToEncrypt" encrypted using DES using CBC and PKCS5 padding with the key "someprivatekey"
	console.log('Decrypting')
	var iv = new Buffer(8);
	iv.fill(0);
	var decipher = crypto.createDecipheriv('des-cbc', privateKey.substr(0,8), iv);
	var dec = decipher.update(textToDecipher, 'base64', 'utf8');
	dec += decipher.final('utf8');
	console.log('deciphered: ' + dec);
	return dec;
	}catch(e){
		console.log('There was an error decrypting the data. '+ e);
		return "";
	}
}; 

module.exports.decrypt = decrypt;

module.exports.testFunction = function(testVariable){
	console.log('My name is '+ testVariable);
}