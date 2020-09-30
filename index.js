spdjs = require('./spdurl');

exports.SPD = function() {
	return new spdjs.SPD();
}

exports.encodeSPD = function(spd) {
	return spdjs.encodeSPD(spd);
}

exports.decodeSPD = function(str) {
	return spdjs.decodeSPD(str);
}
