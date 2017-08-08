#!/bin/bash
# Extracts and repacks deb files
# @see: https://gist.github.com/shamil/3140558
# Run with:
#   repack extract /tmp/package.deb /tmp/package
#   repack pack /tmp/package/ /tmp/package.deb

O=$1 # The operation. "extract" or "pack"
P=$2 # The path to folder or file
D=$3 # The destination path

# Checking cli args
if [ "$O" != "extract" ] && [ "$O" != "pack" ]; then
  echo "repack can only extract and pack files"
  exit 1
fi

if [ "$O" == "extract" ] && [ ! -f "$P" ]; then
  echo "extract package not found"
  exit 1
fi

if [ "$O" == "pack" ] && [ ! -d "$P" ]; then
  echo "pack directory not found"
  exit 1
fi

# Extracting a package
if [ "$O" == "extract" ]; then
  dpkg-deb -x $P $D
  dpkg-deb -e $P $D/DEBIAN

  rm $P
fi

if [ "$O" == "pack" ]; then
  cd $P
  find . -type f ! -regex '.*.hg.*' ! -regex '.*?debian-binary.*' ! -regex '.*?DEBIAN.*' -printf '%P ' | xargs md5sum > $P/DEBIAN/md5sums
  dpkg-deb -b $P $D

  rm -r $P
fi
