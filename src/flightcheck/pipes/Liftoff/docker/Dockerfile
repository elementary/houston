# Houston liftoff docker file
# Builds an ubuntu base with liftoff for packaging debian applications
# Build with `docker build -t flightcheck-liftoff-liftoff .`
#
# TODO: Add liftoff to repository
#
# Version: 1.0.3

FROM elementary/docker:loki

MAINTAINER elementary

# Install liftoff
ENV DEBIAN_FRONTEND noninteractive
ENV DEBIAN_PRIORITY critical
ENV DEBCONF_NOWARNINGS yes

# TODO: Update liftoff with official build or ppa
COPY liftoff_0.1_amd64.deb /tmp/liftoff.deb
RUN dpkg -i /tmp/liftoff.deb; exit 0

RUN apt update && apt install -y -f

# removes annoying log message
RUN touch /root/.pbuilderrc

# sudo access
RUN useradd -m docker && echo "docker:docker" | chpasswd && adduser docker sudo

# Execution
RUN mkdir -p /tmp/flightcheck
WORKDIR /tmp/flightcheck
ENTRYPOINT ["liftoff"]
