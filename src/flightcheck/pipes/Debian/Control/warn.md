Warnings about Debian control file

AppCenter Dashboard found some issues with your `debian/control` file. While we will continue
to try to build your project, we recommend you take a look and fix these
problems for next time.

{% for p in data %}
- {{ p.error | safe }} {% if p.critical %}(critical){% endif %}
{% endfor %}
