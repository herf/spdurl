# spdurl

*A new format to encode spectral power distributions for the Web*

#### What's an SPD?

SPD means "spectral power distribution" and is the data recorded by a spectroradiometer or spectrophotometer, for measuring the spectrum of a light source or reflectance of a material. 

This library aims to be the equivalent of "web colors" for spectra with more than three components. You might write "red" as #FF0000, but how would it look with 40 components? It turns out we can make SPDs relatively small too, so this library provides a simple way to compress and decode these values.

#### Example

Here's how we compress the spectrum recorded from an x-rite meter from 380-730nm in 10nm spacing:

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

The result is 90 bytes, including the date and other metadata:

    spd1,380,10,uwi,4,uJuIuI4m68488W_h-38t7c6S6J5A3i4M4G4G3N1u0Hx-w0v0uwuFtmr-qsp2ohncrBvsxz2j

To decode this we can easily get the original data back:

```
var dec = spdurl.decodeSPD(enc);
```

We can optionally add metadata, here with a date, location, and a name (now 132 bytes):

	spd1,380,10,uwi,4,uJuIuI4m68488W_h-38t7c6S6J5A3i4M4G4G3N1u0Hx-w0v0uwuFtmr-qsp2ohncrBvsxz2j,d1601573778,ni1Studio%20Sample,l34:-118.5

#### Features (and Limits)

* Values are stored with 12 bits of precision, gamma-encoded (they use two bytes once base64 encoded)
* All values share a single exponent
* Values are gamma-encoded to enhance the precision of smaller values
* Samples are uniformly spaced by wavelength, but any wavelength range is allowed (e.g., visible light is 380-780nm)
* A web-safe base64 is used (RFC 4648)
* No limits on size are provided, however some browsers will discard more than 2KB.

#### Metadata

* The "kind" of SPD can be indicated using a dictionary of types (for instance "uW/cm^2" is called "uwi")
* Optional metadata: location, name of sample, date
* A version number for future revisions

#### Compression rate

This method is rather simple, but even against sophisticated compression algorithms (e.g., zstd), this library produces encodings that can be half the size.

For instance, given 401 values from an LED (380-780nm):

* Compressing 401 values with zstd: 2120 bytes (base64 encoded), which doesn't work in all browsers
* This method: 804 bytes, which is a valid URL

#### Languages/environments

This library is provided for Javascript and node.js, but we are happy to take contributions for other languages as well.
