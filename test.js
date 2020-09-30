var spdurl = require("./spdurl");

// make an SPD and encode/decode roundtrip:
var spd = spdurl.SPD();

spd.base = 380;
spd.delta = 10;
spd.date = Math.floor(new Date().valueOf() / 1000);
spd.data = [1.039693,1.039379,1.039198,1.564554,1.696937,1.583408,1.778512,1.970525,1.930359,1.800388,1.725509,1.659314,1.651000,1.587592,1.506774,1.541956,1.536947,1.536743,1.488346,1.409579,1.326508,1.219819,1.163692,1.117009,1.068008,1.037550,1.015638,0.944459,0.889883,0.855271,0.801936,0.759832,0.904105,1.111251,1.211360,1.453921];

var enc = spdurl.encodeSPD(spd);
console.log("Encoded URL = " + enc);
console.log(enc.length + " bytes");

var dec = spdurl.decodeSPD(enc);
//console.log(dec);

var relerr = spd.err(dec);

console.log("relerr", relerr);
