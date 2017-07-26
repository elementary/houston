# Houston repack docker file
# Extracts and packages deb files for editing
# Build with `docker build -t flightcheck-repack-repack .`
#
# Version: 1.0.0

FROM elementary/docker:loki

MAINTAINER elementary

# Install liftoff
ENV DEBIAN_FRONTEND noninteractive
ENV DEBIAN_PRIORITY critical
ENV DEBCONF_NOWARNINGS yes

# TODO: Update liftoff with official build or ppa
COPY repack.sh /usr/local/bin/repack.sh
RUN chmod +x /usr/local/bin/repack.sh

# Execution
RUN mkdir -p /tmp/flightcheck
WORKDIR /tmp/flightcheck
CMD ["/usr/local/bin/repack.sh"]
