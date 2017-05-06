Missing changelog information

AppCenter had some issues with your changelog. We tried to fix them as best we
can, but you should make note about fixing them for your next release.

{% for error in data %}
- {{ error.message }}
{% endfor %}
