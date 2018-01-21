# Incorrectly installed files

AppCenter noticed that some files will not be installed correctly on the
file system. This is most likely a problem with your build system referencing
non-existant folders.

<% files.forEach(function (file) { %>
- [ ] `<%= file %>`
<% }) %>
