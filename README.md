# spdurl

*An encoder to represent spectral data for the Web*

#### What's a SPD?

SPD means "spectral power distribution", and it's commonly used to record data about a light source or reflectance of a material. 

This library aims to be the equivalent of "web colors" for spectra. You might write "red" as #FF0000, but how would it look with 40 components? It turns out we can make SPDs relatively small too, so this library provides a simple way to compress and decode these values.

#### Example

Here's how we compress the spectrum recorded from an x-rite meter from 380-730nm, using 10nm spacing:

```
var spdurl = require("./spdurl");

// make an SPD and encode/decode roundtrip:
var spd = spdurl.SPD();

spd.base = 380;
spd.delta = 10;
spd.date = Math.floor(new Date().valueOf() / 1000);
spd.data = [1.039693,1.039379,1.039198,1.564554,1.696937,1.583408,1.778512,1.970525,1.930359,1.800388,1.725509,1.659314,1.651000,1.587592,1.506774,1.541956,1.536947,1.536743,1.488346,1.409579,1.326508,1.219819,1.163692,1.117009,1.068008,1.037550,1.015638,0.944459,0.889883,0.855271,0.801936,0.759832,0.904105,1.111251,1.211360,1.453921];

var enc = spdurl.encodeSPD(spd);
console.log(enc);
```

The result is 90 bytes:

    spd1,380,10,uwi,4,uJuIuI4m68488W_h-38t7c6S6J5A3i4M4G4G3N1u0Hx-w0v0uwuFtmr-qsp2ohncrBvsxz2j

Decoding this string is easy, giving the original data back:

```
var spdagain = spdurl.decodeSPD(enc);
```

Metadata is optional, so here is a date, location, and a name (now 132 bytes):

	spd1,380,10,uwi,4,uJuIuI4m68488W_h-38t7c6S6J5A3i4M4G4G3N1u0Hx-w0v0uwuFtmr-qsp2ohncrBvsxz2j,d1601573778,ni1Studio%20Sample,l34:-118.5

#### Features (and Limits)

* Value encoding:
  * Stored with 12 bits of precision (they use two bytes once base64 encoded)
  * Gamma-encoded to enhance the precision of smaller values
  * Use a shared exponent to set the scale
* Samples must be uniformly spaced by wavelength, but any wavelength range is allowed (e.g., visible light is 380-780nm)
* Web-safe base64 is used (RFC 4648)
* No limits on size are enforced, however some browsers will discard more than 2KB.

#### Metadata

* Required
  * The "kind" of SPD must be indicated using a dictionary of types (the default is "uW/cm^2" and is abbreviated "uwi")
  * A version number for future revisions
* Optional metadata: 
  * Name of sample
  * Date (in UTC unix time)
  * Location (lat, long)

#### Compression rate

Compared with sophisticated compression algorithms (e.g., zstd), this library produces encodings that can be half the size.

For instance, given 401 values from an LED (380-780nm):

* Compressing 401 values with zstd: 2120 bytes (base64 encoded), which doesn't work in all browsers
* This method: 804 bytes, which is a valid URL

#### Languages/environments

This library is provided for Javascript and node.js, but we are happy to take contributions for other languages as well.
