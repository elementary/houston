Failed to build with liftoff

AppCenter failed to build with liftoff.

{% if data != null %}

<details>
<summary> Build Log </summary>

```
{{ data | safe }}
```

</details>

{% else %}
```
Unable to retrieve data
```
{% endif %}
