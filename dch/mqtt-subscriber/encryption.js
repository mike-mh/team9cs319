var crypto = require('crypto');
var privateKey = 'someprivatekey';


var decryptText = function(textToDecipher){
  try {
    var iv = new Buffer(8);
    iv.fill(0);
    var decipher = crypto.createDecipheriv('des-cbc', privateKey.substr(0, 8), iv);
    var dec = decipher.update(textToDecipher, 'base64', 'utf8');
    dec += decipher.final('utf8');
    //console.log('deciphered: ' + dec);
    return dec;
  } catch (e) {
    return "";
  }
}; 

module.exports.decryptText = decryptText;
