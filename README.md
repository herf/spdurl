# spdurl

*Preliminary format to compress spectral power distributions to fit into a URL*

#### What's an SPD?

SPD means "spectral power distribution" and is the data recorded by a spectrophotometer or spectroradiometer, for measuring the spectrum of a light source or reflectance of a material. 

This library aims to be the web equivalent of "web colors" for spectra with more than three components. You might write "red" as #FF0000, but what would it look like with 40 components? It turns out we can make SPDs relatively small too, so this library provides a simple way to compress and decode these values.

#### Features (and Limits)

* Samples are uniformly spaced by wavelength, but any wavelength range is allowed (e.g., visible light is 380-780nm)
* All values share a single exponent (a power of two) - this matches what happens when using most meters
* Values are stored with 18 bits of precision, so they be base64 encoded to three bytes each
* Values are gamma-encoded to enhance the precision of smaller values
* A web-safe base64 is used (RFC 4648), and we do not require padding
* No limits on size are provided, however some browsers will discard more than 2K.

#### Metadata

* The "kind" of SPD can be indicated using a dictionary of types (for instance "uW/cm^2" is called "uw")
* The time/date a sample was made can be stored using UNIX UTC time (1s precision)
* Optional: location, name of sample
* A version number for future revisions

#### Example

Compressing a spectrum recorded from an x-rite meter from 380-730nm in 10nm spacing gives a result like this (136 bytes, including the date):

`spd1,380,10,uw,1601502089,1,zdczdHzc66-F8lq7NL9i1_rw_P49y687T8Iy8CW7Qh6PC6r06nw6nl5_y49H30D2Rm1bf0tIz7EzbLzD1x1pw2_wN6vMYuWkxHj0nV2Jj5i8`

#### Compression rate

This method is rather simple, but even against "good" compression algorithms (e.g., zstd), this library produces encodings that can be half the size.

For instance, given 401 values from an LED (380-780nm):
* Compressing with zstd: 2120 bytes, base64 encoded
* This method: 1206 bytes
