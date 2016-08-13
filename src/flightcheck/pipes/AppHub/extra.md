Clean extra AppHub data

It seems you have some extra `.apphub` data. While this isn't an error, we would
recommend keeping it nice and clean so it's easy to read and change if need be.

Here are the extra keys we found:
{% for key in data %}
- {{ key }}
{% endfor %}
