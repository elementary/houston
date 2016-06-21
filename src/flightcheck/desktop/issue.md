.desktop has a problem

Houston requires a valid `.desktop` file for proper desktop integration.

Here are some problems we ran into while testing `{{ data.name }}.desktop`.

{% for error in errors %}
{% if error == 'exist' %}
- [ ] You are missing a `.desktop` file at `data/{{ data.name }}.desktop`
{% elif error == 'parse' %}
- [ ] We were unable to parse `{{ data.name }}.desktop`
{% elif error == 'entry' %}
- [ ] You are missing a [Desktop Entry] in `{{ data.name }}.desktop`
{% elif error == 'name' %}
- [ ] You are missing a name entry
{% endif %}
{% endfor %}

For more information about a `.desktop` file, please read the [elementary developer guide](https://elementary.io/docs/code/getting-started#the-desktop-file).
A more technical specification is available on [freedesktop](https://specifications.freedesktop.org/desktop-entry-spec/latest/).

{% if metadata.dump %}
Here is the obligatory code dump:
```javascript
{{ metadata.dump }}
```
{% endif %}
