#!/bin/bash
#
# Packs `package` folder to `package.deb`
# @see: https://gist.github.com/shamil/3140558

# Extracting a package
cd package

# Restores the original package permissions
while read l in; do
  IFS=';' read o f <<< "$l"

  chmod "$o" "$f"
done < ./FILES

# Then remove the file because it's not part of the package
rm FILES


# And build the package
mkdir -p ./DEBIAN
touch ./DEBIAN/md5sums
find . -type f ! -regex '.*.hg.*' ! -regex '.*?debian-binary.*' ! -regex '.*?DEBIAN.*' -printf '%P ' | xargs md5sum > ./DEBIAN/md5sums
dpkg-deb -b . ../package.deb

# Remove the package directory after the deb is built
cd ..
rm -r package

# And set this to 777 so we can remove it if needed
chmod 777 ./package.deb
