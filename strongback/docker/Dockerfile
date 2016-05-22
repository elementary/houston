# Houston docker file
# Builds an ubuntu base with liftoff for packaging debian applications
#
# Version: 1.0.1

FROM ubuntu:xenial

MAINTAINER elementary

# Install liftoff
ENV DEBIAN_FRONTEND noninteractive
ENV DEBIAN_PRIORITY critical
ENV DEBCONF_NOWARNINGS yes

# TODO: Update liftoff with official build or ppa
COPY liftoff_0.1_amd64.deb /houston/liftoff.deb
RUN dpkg -i /houston/liftoff.deb; exit 0

RUN apt update && apt install -y -f

# removes annoying log message
RUN touch /root/.pbuilderrc

# sudo access
RUN useradd -m docker && echo "docker:docker" | chpasswd && adduser docker sudo

# Execution
WORKDIR /houston/code
ENTRYPOINT ["liftoff"]
