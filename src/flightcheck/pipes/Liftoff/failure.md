Failed to build with liftoff

AppCenter failed to build with liftoff. Here is the log:

```
{% if data != null %}
{{ data | langChop(50) | safe }}
{% else %}
Unable to retrieve data
{% endif %}
```
