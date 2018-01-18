#!/bin/bash
#
# Extracts the `package.deb` file to `package` folder
# @see: https://gist.github.com/shamil/3140558

# Extracting a package
dpkg-deb -x package.deb package
dpkg-deb -e package.deb package/DEBIAN

rm package.deb

# Time to start patching the deb contents
cd package

# Creates a list of all the original package permissions for each file
touch FILES
find . -exec stat -c "0%a;%n" {} \; > FILES

# Sets everything to an open permission to allow edits without root access
chmod -R 777 .
