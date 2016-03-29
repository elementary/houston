{% extends issue %}

{% block title %}
{{ data.project.name }}.desktop has a problem
{% endblock %}

{% block issue %}
# `{{ data.project.name }}.desktop` has a problem

Houston requires a valid `.desktop` file for proper desktop integration.

Here are some problems we ran into while testing `{{ data.project.name }}.desktop`.

{% for error in errors %}
{% if error == 'exist' %}
- [ ] You seem to be missing a `{{ data.project.name }}.desktop` file
{% elif error == 'parse' %}
- [ ] We were unable to parse `{{ data.project.name }}.desktop`
{% elif error == 'entry' %}
- [ ] You are missing a [Desktop Entry] in `{{ data.project.name }}.desktop`
{% elif error == 'name' %}
- [ ] You are missing a name entry
{% endif %}
{% endfor %}

For more information about a `.desktop` file, please read the [elementary developer guide](https://elementary.io/docs/code/getting-started#the-desktop-file).

{% if meta.dump %}
Here is the obligatory code dump:
```javascript
{{ meta.dump }}
```
{% endif %}

{% endblock %}
