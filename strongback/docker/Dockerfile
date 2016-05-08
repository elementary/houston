# Houston docker file
# Builds an ubuntu base with liftoff for packaging debian applications
#
# Version: 1.0.0

FROM ubuntu:xenial

MAINTAINER elementary

# Install liftoff
# TODO: Update liftoff with official build or ppa
ENV DEBIAN_FRONTEND noninteractive
ENV DEBIAN_PRIORITY critical
ENV DEBCONF_NOWARNINGS yes

RUN apt update && apt install -y --no-install-recommends \
  apt-cacher-ng \
  debhelper \
  debian-archive-keyring \
  dh-autoreconf \
  fakeroot \
  germinate \
  git \
  gobject-introspection \
  libgirepository1.0-dev \
  pbuilder \
  pixz \
  qemu-user-static \
  quilt \
  sudo

COPY liftoff_0.1_amd64.deb /houston/liftoff.deb
RUN dpkg -i /houston/liftoff.deb

# removes annoying log message
RUN touch /root/.pbuilderrc

# sudo access
RUN useradd -m docker && echo "docker:docker" | chpasswd && adduser docker sudo

# Execution
WORKDIR /houston/code
ENTRYPOINT ["liftoff"]
