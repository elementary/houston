# Houston appdata docker file
# Builds an ubuntu base with desktop-file-utils for validating desktop files
# Build with `docker build -t flightcheck-desktop-util .`
#
# TODO: Move this to a unique repository?
#
# Version: 1.0.0

FROM ubuntu:xenial

MAINTAINER elementary

# Install liftoff
ENV DEBIAN_FRONTEND noninteractive
ENV DEBIAN_PRIORITY critical
ENV DEBCONF_NOWARNINGS yes

RUN apt update && apt install -y desktop-file-utils

# Execution
RUN mkdir -p /tmp/flightcheck
WORKDIR /tmp/flightcheck
ENTRYPOINT ["desktop-file-validate"]
