Changelog errors

Apphub failed to build with liftoff due to Debian changelog issues.

{% for name, issues in data %}
##### {{ name }}
{% for issue in issues %}
- {{ issue }}
{% endfor %}

{% endfor %}
