# Not shipping a binary

AppCenter built your package but could not find a `<%= name %>`
binary in `/usr/bin`. Please make sure that your build system places a binary
file at `/usr/bin/<%= name %>`.

For reference, the built package includes these files:

<details>

<summary> Package Files </summary>

```
<% files.forEach(function (file) { _%>
<%= file %>
<%_ }) %>
```

</details>
