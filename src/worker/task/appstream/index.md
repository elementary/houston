# Appstream tests fail

AppCenter ran a bunch of tests on your appstream file. These are the results.

<%_ if ((errors || []).length > 0) { _%>
## Errors:
<%_ (errors || []).forEach(function (error) { _%>
  - <%- (error.title || 'Unknown internal error') %>
<%_ }) _%>
<%_ } _%>

<%_ if ((warnings || []).length > 0) { _%>
## Warnings:
Most of these are fixed during the building process, but you should ensure they
are fixed in your code for future releases.
<%_ (warnings || []).forEach(function (warn) { _%>
  - <%- (warn.title || 'Unknown internal error') %>
<%_ }) _%>
<%_ } _%>

### For more information, see:
- [The AppStream Quickstart Guide](https://www.freedesktop.org/software/appstream/docs/chap-Quickstart.html)
- [The AppStream Metadata Specification](https://www.freedesktop.org/software/appstream/docs/chap-Metadata.html)
