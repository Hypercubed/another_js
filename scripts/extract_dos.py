#!/usr/bin/env python
#
# Extract and convert Another World DOS datafiles to be used with 'another.js'
#

import base64
import ctypes
import os
import struct
import sys
import zipfile
import zlib

COUNT = 146

TYPE_SND = 0 # 8bits raw sound
TYPE_MOD = 1 # soundfx module
TYPE_BMP = 2 # 320x200x4 bitmap
TYPE_PAL = 3 # palette
TYPE_MAC = 4 # bytecode
TYPE_MAT = 5 # polygons
TYPE_BNK = 6 # bank2.mat

class Resource(object):
	def __init__(self):
		self.rtype = 0
		self.bank = 0
		self.offset = 0
		self.compressed = 0
		self.uncompressed = 0

banks = {}
resources = []

zf = zipfile.ZipFile(sys.argv[1])
for name in zf.namelist():
	lname = name.lower()
	if lname == 'memlist.bin':
		f = zf.open(name)
		for i in range(COUNT):
			r = Resource()
			f.read(1) # status
			r.rtype = ord(f.read(1))
			f.read(4) # pointer
			f.read(1) # rank
			r.bank = ord(f.read(1))
			r.offset = struct.unpack('>I', f.read(4))[0]
			r.compressed = struct.unpack('>I', f.read(4))[0]
			r.uncompressed = struct.unpack('>I', f.read(4))[0]
			resources.append(r)
		assert ord(f.read(1)) == 0xff
	elif len(lname) == 6 and (lname.startswith('bank') or lname.startswith('demo')):
		num = int(name[4:6], 16)
		banks[num] = zf.read(name)

def unpack(i, r):
	buf = banks[r.bank][r.offset:r.offset+r.compressed]
	name = os.path.join('dump', 'file%02x' % i)
	with open(name, 'wb') as f:
		buf = banks[r.bank][r.offset:r.offset+r.compressed]
		if r.uncompressed != r.compressed:
			lib = ctypes.cdll.LoadLibrary('bytekiller_unpack.so')
			tmp = ctypes.create_string_buffer(r.uncompressed)
			ret = lib.bytekiller_unpack(tmp, r.uncompressed, buf, r.compressed)
			assert ret == 0
			buf = tmp
		f.write(buf)
	return buf

for i, r in enumerate(resources):
	if r.uncompressed == 0 or not banks.has_key(r.bank):
		continue
	# if r.rtype in (TYPE_SND, TYPE_MOD):
	# 	continue
	buf = unpack(i, r)
	buf = zlib.compress(buf, 9)
	print 'export const data%02x = "%s";' % (i, base64.b64encode(buf))
	print 'export const size%02x = %d;' % (i, r.uncompressed);

print 'export const bitmaps = {'
for i, r in enumerate(resources):
	if r.uncompressed == 0 or not banks.has_key(r.bank):
		continue
	if r.rtype != TYPE_BMP:
		continue
	print '\t%3d : [ data%02x, size%02x ],' % (i, i, i)
print '};'

print 'export const sounds = {'
for i, r in enumerate(resources):
	if r.uncompressed == 0 or not banks.has_key(r.bank):
		continue
	if r.rtype != TYPE_SND:
		continue
	print '\t%3d : [ data%02x, size%02x ],' % (i, i, i)
print '};'

print 'export const modules = {'
for i, r in enumerate(resources):
	if r.uncompressed == 0 or not banks.has_key(r.bank):
		continue
	if r.rtype != TYPE_MOD:
		continue
	print '\t%3d : [ data%02x, size%02x ],' % (i, i, i)
print '};'
