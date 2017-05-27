Debian control file errors

Apphub failed to build with liftoff due to problems with the `debian/control`
file.

{% for p in data %}
- {{ p.error | safe }} {% if p.critical %}(critical){% endif %}

{% endfor %}
