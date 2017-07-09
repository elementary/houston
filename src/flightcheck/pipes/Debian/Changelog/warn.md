Missing changelog information

AppCenter had some issues with your GitHub release changelog. We tried to fix
them as best we can, but you should make note about fixing them for your next
release.

{% for error in data.errors %}
- {{ error.message }}
{% endfor %}

Please format your [GitHub release](https://github.com/{{ data.owner }}/{{ data.repo }}/releases/tag/{{ data.tag }})
body with a list of changes. AppCenter will use this to fill in all the needed
changelog information.
