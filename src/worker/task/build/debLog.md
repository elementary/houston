# Failed to build <%= storage.nameHuman %>

AppCenter failed to build <%= storage.nameHuman %>.

<%_ if (log != null) { _%>

<details>

<summary> Build Log </summary>

```
<%- log %>
```

</details>

<%_ } else { _%>

```
Unable to retrieve build log
```

<%_ } %>
