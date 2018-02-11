# Appstream validate fails

AppCenter tried to run `appstreamcli validate` on <%= storage.nameHuman %> and
received the following errors:

```
<% if (log != null) { _%>
  <%- log %>
<%_ } else { _%>
  Unable to retrieve validate log
<%_ } %>
```

For more information, see:
- [The AppStream Quickstart Guide](https://www.freedesktop.org/software/appstream/docs/chap-Quickstart.html)
- [The AppStream Metadata Specification](https://www.freedesktop.org/software/appstream/docs/chap-Metadata.html)
