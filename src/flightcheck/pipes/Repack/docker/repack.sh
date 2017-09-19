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

if [ "$O" == "extract" ]; then
  cd $P

  # Extracting a package
  dpkg-deb -x $P $D
  dpkg-deb -e $P $D/DEBIAN

  rm $P

  # Creates a list of all the original package permissions for each file
  touch $D/FILES
  find $P -exec stat -c "%a;%n" {} \; > $D/FILES

  # Sets everything to an open permission to allow edits without root access
  chmod -R 777 $D
fi

if [ "$O" == "pack" ]; then
  cd $P

  # Restores the original package permissions
  while read l in; do
    IFS=';' read o f <<< "$l"

    chmod "$o" "$f"
  done < $P/FILES

  # Remove any extra files that are not part of the package
  rm $P/FILES

  # And build the package
  mkdir -p $P/DEBIAN
  touch $P/DEBIAN/md5sums
  find . -type f ! -regex '.*.hg.*' ! -regex '.*?debian-binary.*' ! -regex '.*?DEBIAN.*' -printf '%P ' | xargs md5sum > $P/DEBIAN/md5sums
  dpkg-deb -b $P $D

  rm -r $P
fi
