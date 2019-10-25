# Houston pack deb docker file
# Packs a debian package from extracted files
#
# Version: 1.0.2

FROM elementary/docker:loki-stable

# Install liftoff
ENV DEBIAN_FRONTEND noninteractive
ENV DEBIAN_PRIORITY critical
ENV DEBCONF_NOWARNINGS yes

COPY pack-deb.sh /usr/local/bin/pack-deb
RUN chmod +x /usr/local/bin/pack-deb

# Execution
RUN mkdir -p /tmp/houston
WORKDIR /tmp/houston
ENTRYPOINT ["pack-deb"]
