debian/control has a problem

A valid `debian/control` file is required for accurate package building.

{% for error in errors %}
{% if error == 'exist' %}
- [ ] You are missing a `debian/control` file
{% elif error == 'parse' %}
- [ ] We were unable to parse `debian/control`. Please check it has no formatting errors.
{% elif error == 'source' %}
- [ ] Your `Source` field is incorrect. The file should include `Source: {{ data.name }}`
{% elif error == 'package' %}
- [ ] Your `Package` field is incorrect. The file should include `Package: {{ data.name }}`
{% endif %}
{% endfor %}

For more information about packaging an elementary app, please read the [elementary developer guide](http://elementary.io/docs/code/getting-started#debian-control).
A more technical specification is available on the [Debian policy manual](https://www.debian.org/doc/debian-policy/ch-controlfields.html).

{% if metadata.dump %}
Here is the obligatory code dump:
```javascript
{{ metadata.dump }}
```
{% endif %}
