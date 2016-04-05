{% extends issue %}

{% block title %}
Missing changelog
{% endblock %}

{% block issue %}

Houston requires a changelog for each individual release.
You are currently missing changelogs for:

{% for error in errors %}
- [ ] {{ error }}
{% endfor %}

Please edit these GitHub releases with body text to include changes made.
{% endblock %}
