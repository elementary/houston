# Appstream tests fail

AppCenter ran a bunch of tests on your appstream file.

<% if ((errors || []).length > 0) { %>
Errors:
<% (errors || []).forEach(function (error) { %>
  - <%= error %>
<% }) %>
<% } %>

<% if ((warnings || []).length > 0) { %>
Warnings:
<% (warnings || []).forEach(function (warn) { %>
  - <%= warn %>
<% }) %>
<% } %>

For more information, see:
- [The AppStream Quickstart Guide](https://www.freedesktop.org/software/appstream/docs/chap-Quickstart.html)
- [The AppStream Metadata Specification](https://www.freedesktop.org/software/appstream/docs/chap-Metadata.html)
