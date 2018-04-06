Errors in Debian control file

AppCenter Dashboard found some issues with your `debian/control` file. You will
need to fix these issues and create a new release on GitHub.

{% for error in data %}
- {{ error | safe }}

{% endfor %}
