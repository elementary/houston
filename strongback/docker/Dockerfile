FROM ubuntu:xenial

MAINTAINER elementary

# Install liftoff
# TODO: Update liftoff with official build or ppa
ADD liftoff_0.1_amd64.deb /houston/liftoff.deb

RUN apt update && apt install -y --no-install-recommends \
  debhelper \
  debian-archive-keyring \
  dh-autoreconf \
  germinate \
  gobject-introspection \
  libgirepository1.0-dev \
  pbuilder \
  pixz \
  qemu-user-static \
  quilt

RUN dpkg -i /houston/liftoff.deb

# Cleanup
RUN rm -rf /houston
