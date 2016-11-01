# Houston appdata docker file
# Builds an ubuntu base with liftoff for packaging debian applications
# Build with `docker build -t flightcheck-appdata-util .`
#
# TODO: Move this to a unique repository?
#
# Version: 1.0.1

FROM ubuntu:xenial

MAINTAINER elementary

# Install liftoff
ENV DEBIAN_FRONTEND noninteractive
ENV DEBIAN_PRIORITY critical
ENV DEBCONF_NOWARNINGS yes

# ca-certificate stuff for removing glib-net error
RUN apt update && apt install -y appstream openssl ca-certificates
RUN update-ca-certificates

# Execution
RUN mkdir -p /tmp/flightcheck
WORKDIR /tmp/flightcheck
ENTRYPOINT ["appstreamcli"]
