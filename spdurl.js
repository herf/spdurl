"use strict";

// Library constants, version should be adjusted if any other things are.
const version = "spd1";

// 1. Shared exponents:
// If we use a power of 2 shared exponent, we can lose a bit of precision, because e.g.,: 
// a signal could have a maximum value of 64.1, requiring that the maximal value is 128
// However, if we were to use a different base (like 1.3) it would require a working "pow" function which might not be available on embedded processors
// Instead, we simply use the fourth root of 2, and "simple" implementations can simply round up to the nearest (MSB + 1) * 4
const expbase = Math.sqrt(Math.sqrt(2));

// 2. Precision: 
// Early versions of this library used an 18-bit encoding, but with careful rounding and gamma encoding, we think 12 is sufficient
// Most detectors today only measure 12 bits of precision (and less SNR with noise), but we should anticipate that the best detectors are capable of 16 bits of precision
// We believe 12 bits gamma-encoded is sufficient even for these "great" detectors in the presence of noise
// If needed, we can add 18-bit encoding back via a version tag
const bitscale = 4095;
const ibitscale = 1.0 / bitscale;

// 3. Gamma:
// Gamma encoding can let us tune geometric error (relative error of small values) vs. linear error
// Usually, CCD detectors measure linear values, and gamma encoding can allow us to encode these values with low error in fewer bits
// Here we choose a "low" gamma in order to balance geometric error with linear error. 
// 2.0 is nearly optimal in an empirical test:
const gamma = 2.0;

// 4. Base64: Standard RFC 4648 "URLsafe base64" - we don't need a pad.
var b64enc = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

// node.js module support:
if (typeof exports !== 'undefined') {
	exports.SPD = function() {
		return new SPD();
	}

	exports.encodeSPD = function(spd) {
		return encodeSPD(spd);
	}

	exports.decodeSPD = function(str) {
		return decodeSPD(str);
	}
}

// a SPD container
function SPD() {
	this.base = 380;
	this.delta = 1;
	this.data = [];
	this.unit = "uwi";

	// some optional metadata
	this.name = null;
	this.date = 0;
	// lat/long as 2 components:
	this.loc = [];
}

// list of selected, abbreviated units, can be extended/modified on request:
const UnitMap = {

	// "fractions"
	"as": "Action spectrum (power)",
	"tr": "Fraction transmitted",
	"re": "Fraction reflected",

	// power units (total, irradiance, radiance)
	"uw": "uW total",
	"mw": "mW total",
	"w": "W total",
	"uwi": "uW/cm^2",
	"mwi": "mW/cm^2",
	"wi": "W/m^2",
	"uwr": "uW/cm^2/sr",
	"mwr": "mW/cm^2/sr",
	"wr": "W/m^2/sr",

	// energy units (total, irradiance, radiance)
	"uj": "uJ total",
	"mj": "mJ total",
	"j": "J total",
	"uji": "uJ/cm^2",
	"mji": "mJ/cm^2",
	"ji": "J/m^2",
	"ujr": "uJ/cm^2/sr",
	"mjr": "mJ/cm^2/sr",
	"jr": "J/m^2/sr",

	// Quanta/mol units
	"q": "quanta (photons)",
	"qi": "q/cm^2",
	"qr": "q/cm^2/sr",
	"lq": "log10(quanta)",
	"lqi": "log10(quanta)/cm^2",
	"lqr": "log10(quanta)/cm^2/sr",
	"mm": "mmol",
	"mmi": "mmol/cm^2",
	"mmr": "mmol/cm^2/sr"
};

// Compute RMSE between two SPDs, linear or geometric (default is geometric)
SPD.prototype.err = function(spd, linear) {
	if (spd.base != this.base) return -1;
	if (spd.delta != this.delta) return -1;
	if (spd.data.length != this.data.length) return -1;

	var terr = 0;

	// for linear, divide by average radiance per bin:
	var radbin = 0;
	for (var i = 0; i < spd.data.length; i++) {
		radbin += spd.data[i];
	}
	radbin /= spd.data.length;

	for (var i = 0; i < spd.data.length; i++) {
		if (this.data[i] > 0) {
			var dx = spd.data[i] - this.data[i];

			if (linear) {
				dx /= radbin;
			} else {
				dx /= this.data[i];
			}

			terr += dx * dx;
		}
	}

	// RMSE:
	return Math.sqrt(terr / spd.data.length);
}

SPD.prototype.Unit = function(spd) {
	return UnitMap[this.unit];
}

function encodeSPD(spd) {
	
	var result = [];

	var maxval = 0;
	for (var i = 0; i < spd.data.length; i++) {
		if (maxval < spd.data[i]) maxval = spd.data[i];
	}

	var shexp = Math.ceil(Math.log(maxval) / Math.log(expbase));
	maxval = Math.pow(expbase, shexp);	// effective max now.

	// TODO: trim quantized tails to make smaller (no zeroes on end)
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

	// these five fields (including base64 spectrum) are required:
	result.push(version);
	result.push(spd.base);
	result.push(spd.delta);
	result.push(spd.unit);

	result.push(shexp);

	var spdnum = [];
	for (var i = 0; i < spd.data.length; i++) {
		var frac = spd.data[i] / maxval;

		// gamma-encode and write as 18 bits:
		frac = Math.round(bitscale * Math.pow(frac, 1.0 / gamma));

		// break into three words:
		var f1 = frac >> 6 & 63;
		var f2 = frac & 63;

		spdnum.push(b64enc.charAt(f1));
		spdnum.push(b64enc.charAt(f2));
	}

	result.push(spdnum.join(""));

	// optional fields follow with a one-character ID
	if (spd.date) {
		result.push("d" + spd.date);
	}
	if (spd.name) {
		result.push("n" + encodeURIComponent(spd.name));
	}
	if (spd.loc && spd.loc.length == 2) {
		result.push("l" + spd.loc[0] + ":" + spd.loc[1]);
	}

	return result.join(",");
}

function d64(a) {
	return b64enc.indexOf(a);
}

function decodeSPD(str) {
	var spd = new SPD();
	var tok = str.split(',');

	// sanity checks:
	if (tok.length < 5) return nil;
	if (tok[0] != version) return nil;

	spd.base = parseFloat(tok[1]);
	spd.delta = parseFloat(tok[2]);
	spd.unit = tok[3];
	
	var shexp = parseInt(tok[4]);
	var b64 = tok[5];

	// optional fields:
	for (var i = 6; i < tok.length; i++) {
		var ti = tok[i];
		
		// key, like "d"
		var ki = tok[i].charAt(0);
		// value, like "name"
		var vi = tok[i].slice(1);

		if (ki == 'd') {
			spd.date = parseInt(vi);
		}
		if (ki == 'l') {
			var tmp = vi.split(':');
			if (tmp.length == 2) {
				spd.loc[0] = parseFloat(tmp[0]);
				spd.loc[1] = parseFloat(tmp[1]);
			}
		}
		if (ki == 'n') {
			spd.name = decodeURIComponent(vi);
		}
	}

	// decode n characters at a time
	var shbase = Math.pow(expbase, shexp);

	for (var c = 0; c < b64.length; c += 2) {
		var c0 = b64.charAt(c);
		var c1 = b64.charAt(c + 1);

		// decode and scale:
		var frac = (d64(c0) << 6) + d64(c1);

		frac *= ibitscale;

		// back to linear floating:
		var orig = shbase * Math.pow(frac, gamma);
		spd.data.push(orig);
	}

	return spd;
}
