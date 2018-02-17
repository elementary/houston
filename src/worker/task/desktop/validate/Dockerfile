# Houston desktop validate docker file
# Builds an ubuntu base with desktop-file-utils for validating desktop files
#
# Version: 1.0.2

FROM elementary/docker:loki

MAINTAINER elementary

# Install liftoff
ENV DEBIAN_FRONTEND noninteractive
ENV DEBIAN_PRIORITY critical
ENV DEBCONF_NOWARNINGS yes

RUN apt update && apt install -y desktop-file-utils

# Execution
RUN mkdir -p /tmp/houston
WORKDIR /tmp/houston
ENTRYPOINT ["desktop-file-validate"]
