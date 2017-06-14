# houston/src/repo

This process is responsible for receiving data from a web server via syslog. It
then parses the message for a file path, and increments the download count of
the package.

## Example

elementary serves an aptly repository behind a nginx server. Here is a tidbit of
the nginx configuration as an example:

```
# repository.conf
# Configures the static repository domain with houston syslog hook

log_format repo '$remote_addr|$status|$request_filename|$body_bytes_sent|$http_user_agent|$request_time';

# Standard HTTP route block
server {
  server_name _;

  listen 80;
  listen [::]:80;

  root /var/repository/aptly/public;

  access_log syslog:server=localhost:3000 repo;
}
```

Note that the package paths should be similar to:
```
/appcenter/pool/main/c/com.github.danrabbit.nimbus/com.github.danrabbit.nimbus_0.2.0_amd64.deb
```

The last path segment needs to be in the format of:
```
<reverse domain name>_<version>_<arch>.deb
```
