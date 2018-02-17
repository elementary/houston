# Desktop validate fails

AppCenter tried to run `desktop-file-validate` on <%= storage.nameHuman %> and
received the following errors:

<%_ Object.keys(logs).forEach(function (file) { _%>
### <%= file %>

```
<%- logs[file] %>
```
<%_ }) _%>

### For more information, see:
- [The Desktop Entry Specification](https://standards.freedesktop.org/desktop-entry-spec/latest/ar01s05.html)
