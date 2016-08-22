Failed to build with liftoff

Apphub failed to build with liftoff. Here is the log:

```
{% if data != null %}
{{ helper.lang.chop(data, 50) | safe }}
{% else %}
Unable to retrieve data
{% endif %}
```
