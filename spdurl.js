"use strict";

// library constants, version should be adjusted if any other things are.
const version = "spd1";
const gamma = 3;

// fixed 18-bit precision:
const bitscale = 262143;
const ibitscale = 1.0 / bitscale;

// RFC 4648 "URLsafe base64" - we don't need a pad.
var b64enc = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

// node.js module support:
exports.SPD = function() {
	return new SPD();
}

exports.encodeSPD = function(spd) {
	return encodeSPD(spd);
}

exports.decodeSPD = function(str) {
	return decodeSPD(str);
}

// a SPD container
function SPD() {
	this.base = 380;
	this.delta = 1;
	this.data = [];
	this.unit = "uw";

	// some metadata
	//this.name = "";
	this.date = 0;
}

SPD.prototype.err = function(spd) {
	if (spd.base != this.base) return -1;
	if (spd.delta != this.delta) return -1;
	if (spd.data.length != this.data.length) return -1;

	var terr = 0;
	for (var i = 0; i < spd.data.length; i++) {
		if (this.data[i] > 0) {
			var dx = spd.data[i] - this.data[i];
			dx /= this.data[i];

			terr += dx * dx;
		}
	}

	// RMSE:
	return Math.sqrt(terr / spd.data.length);
}

function encodeSPD(spd) {
	
	var result = [];

	var maxval = 0;
	for (var i = 0; i < spd.data.length; i++) {
		if (maxval < spd.data[i]) maxval = spd.data[i];
	}

	var shexp = Math.ceil(Math.log(maxval) / Math.log(2));
	maxval = Math.pow(2, shexp);	// effective max now.

	// trim quantized tails to make smaller (no zeroes on end)
	if (0) {
		var unit = ibitscale * maxval;
		for (var li = 0; li < spd.data.length; li ++) {
			if (spd.data[li] >= unit) break;
		}
		for (var ri = spd.data.length - 1; ri >= 0; ri --) {
			if (spd.data[ri] >= unit) break;
		}

		console.log("Trim results", li, ri, spd.data.length);

		// all zero, we can special case?
		if (ri <= li) return nil;

		if (li > 0) {
			spd.base += spd.delta * li;
			spd.data = spd.data.slice(li, ri + 1);
		}
	}

	// version tag
	result.push(version);
	result.push(spd.base);
	result.push(spd.delta);
	result.push(spd.unit);
	result.push(spd.date);

	result.push(shexp);

	var spdnum = [];
	for (var i = 0; i < spd.data.length; i++) {
		var frac = spd.data[i] / maxval;

		// gamma-encode and write as 18 bits:
		frac = Math.floor(bitscale * Math.pow(frac, 1.0 / gamma));

		// break into three words:
		var f1 = frac >> 12;
		var f2 = frac >> 6 & 63;
		var f3 = frac & 63;

		// encode the three values words as characters:
		spdnum.push(b64enc.charAt(f1));
		spdnum.push(b64enc.charAt(f2));
		spdnum.push(b64enc.charAt(f3));
	}

	result.push(spdnum.join(""));
	return result.join(",");
}

function d64(a) {
	return b64enc.indexOf(a);
}

function decodeSPD(str) {
	var spd = new SPD();
	var tok = str.split(',');

	// sanity checks:
	if (tok.length != 7) return nil;
	if (tok[0] != version) return nil;

	spd.base = parseFloat(tok[1]);
	spd.delta = parseFloat(tok[2]);
	spd.unit = tok[3];
	spd.date = parseInt(tok[4]);

	var shexp = parseInt(tok[5]);
	var b64 = tok[6];

	// decode 3 characters at a time
	var shbase = Math.pow(2, shexp);

	for (var c = 0; c < b64.length; c += 3) {
		var c0 = b64.charAt(c);
		var c1 = b64.charAt(c + 1);
		var c2 = b64.charAt(c + 2);

		// decode and scale:
		var frac = (d64(c0) << 12) + (d64(c1) << 6) + d64(c2);

		frac *= ibitscale;

		// back to linear floating:
		var orig = shbase * Math.pow(frac, gamma);
		spd.data.push(orig);
	}

	return spd;
}
