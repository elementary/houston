{% extends issue %}

{% block title %}
{% if errors.length == 1 %}
.apphub has an issue
{% elif errors.length > 1 %}
.apphub has issues
{% else %}
.apphub has some concerns
{% endif %}
{% endblock %}

{% block issue %}
Houston requires a valid `.apphub` file to assure reviewing, and publishing works as you want them.

{% if errors.length > 0 %}
Here are some problems we ran into while testing your `.apphub` file.
{% endif %}

{% for error in errors %}
{% if error == 'exist' %}
- [ ] You don't have an `.apphub` file. Frankly this is really weird. You might want to check to see if someone removed it in a commit.
{% elif error == 'parse' %}
- [ ] We were unable to parse your `.apphub` file.
{% else %}
- [ ] {{ error }}
{% endif %}
{% endfor %}

{% if warnings.length > 0 %}
While not show stopping, here are some questionable parts of your `.apphub` file.
{% endif %}

{% for warning in warnings %}
{% if warning == 'price' %}
- [ ] We were unable to identify your price. Please make sure it is a whole number.
{% elif warning == 'label' %}
- [ ] We were unable to identify your label. Please make sure it is a string.
{% else %}
- [ ] {{ warning }}
{% endif %}
{% endfor %}

A valid `.apphub` file can be as simple as an empty file, or as sophisticated as:
```json
{
  "priceUSD": 5,
  "issueLabel": "Houston"
}
```

{% if metadata.dump %}
Here is the obligatory code dump:
```javascript
{{ metadata.dump }}
```
{% endif %}

{% endblock %}
