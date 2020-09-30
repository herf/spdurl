# spdurl

*A new format to encode spectral power distributions for the Web*

#### What's an SPD?

SPD means "spectral power distribution" and is the data recorded by a spectrophotometer or spectroradiometer, for measuring the spectrum of a light source or reflectance of a material. 

This library aims to be the web equivalent of "web colors" for spectra with more than three components. You might write "red" as #FF0000, but what would it look like with 40 components? It turns out we can make SPDs relatively small too, so this library provides a simple way to compress and decode these values.

#### Example

Compressing a spectrum recorded from an x-rite meter from 380-730nm in 10nm spacing gives a result like this:

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

The result is 136 bytes, including the date:

`spd1,380,10,uw,1601502089,1,zdczdHzc66-F8lq7NL9i1_rw_P49y687T8Iy8CW7Qh6PC6r06nw6nl5_y49H30D2Rm1bf0tIz7EzbLzD1x1pw2_wN6vMYuWkxHj0nV2Jj5i8`

To decode we can reverse this and get the original data back:

```
var dec = spdurl.decodeSPD(enc);
```

#### Features (and Limits)

* Samples are uniformly spaced by wavelength, but any wavelength range is allowed (e.g., visible light is 380-780nm)
* All values share a single exponent (a power of two) - this matches what happens when using most meters
* Values are stored with 18 bits of precision (so they use three bytes once base64 encoded)
* Values are gamma-encoded to enhance the precision of smaller values
* A web-safe base64 is used (RFC 4648), and we do not require padding
* No limits on size are provided, however some browsers will discard more than 2KB.

#### Metadata

* The "kind" of SPD can be indicated using a dictionary of types (for instance "uW/cm^2" is called "uwi")
* The time/date a sample was made can be stored using UNIX UTC time (1s precision)
* Optional: location, name of sample
* A version number for future revisions


#### Compression rate

This method is rather simple, but even against sophisticated compression algorithms (e.g., zstd), this library produces encodings that can be 20-50% smaller.

For instance, given 401 values from an LED (380-780nm):

* Compressing 401 values with zstd: 2120 bytes (base64 encoded)
* This method: 1206 bytes

#### Future revisions/TODO

We will make changes to allow more flexible metadata encoding (optional values like location), and we may compress dates and other types also.

#### Languages/environments

This library is provided for Javascript and node.js, but we are happy to take contributions for other languages as well.
