# Houston appdata docker file
# Builds an ubuntu base with appstreamcli for validating appstream files
#
# Version: 1.0.3

FROM elementary/docker:loki

MAINTAINER elementary

# Install liftoff
ENV DEBIAN_FRONTEND noninteractive
ENV DEBIAN_PRIORITY critical
ENV DEBCONF_NOWARNINGS yes

# ca-certificate stuff for removing glib-net error
RUN apt update && apt install -y appstream openssl ca-certificates
RUN update-ca-certificates

# Execution
RUN mkdir -p /tmp/houston
WORKDIR /tmp/houston
ENTRYPOINT ["appstreamcli"]
