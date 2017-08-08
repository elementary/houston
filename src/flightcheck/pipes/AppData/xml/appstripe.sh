#!/bin/bash
# Adds an appstream key to the xml file
# Run with:
#   appstripe com.github.package.name.appdata.xml a-stripe-key-to-insert

F=$1 # The appstream file.
K=$2 # The stripe key.

xmlstarlet ed -L -s "/component/custom" -t elem -n "stripe" -v "$K" \
                 -i "/component/custom/stripe" -t attr -n "key" -v "x-appcenter-stripe" \
                 -r "/component/custom/stripe" -v "value" \
                 $F
