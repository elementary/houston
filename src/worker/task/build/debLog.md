# Failed to build <%= storage.nameHuman %>

AppCenter failed to build <%= storage.nameHuman %>.

<% if (log != null) { %>

<details>

<summary> Build Log </summary>

```
<%= log %>
```

</details>

<% } else { %>

```
Unable to retrieve build log
```

<% } %>
