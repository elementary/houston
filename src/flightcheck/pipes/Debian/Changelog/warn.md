Changelog issues

Apphub had some issues with your changelog. We tried to fix them as best we can,
but you should take a look just in case.

{% for name, issues in data %}
##### {{ name }}
{% for issue in issues %}
- {{ issue }}
{% endfor %}

{% endfor %}
