# Houston appdata docker file
# Builds an ubuntu base with xmlstarlet for adding stripe key to appstream
# Build with `docker build -t flightcheck-appdata-stripe .`
#
# Version: 1.0.0

FROM elementary/docker:loki

MAINTAINER elementary

# Install liftoff
ENV DEBIAN_FRONTEND noninteractive
ENV DEBIAN_PRIORITY critical
ENV DEBCONF_NOWARNINGS yes

RUN apt update && apt install -y xmlstarlet

COPY appstripe.sh /usr/local/bin/appstripe.sh
RUN chmod +x /usr/local/bin/appstripe.sh

# Execution
RUN mkdir -p /tmp/flightcheck
WORKDIR /tmp/flightcheck
ENTRYPOINT ["/usr/local/bin/appstripe.sh"]
