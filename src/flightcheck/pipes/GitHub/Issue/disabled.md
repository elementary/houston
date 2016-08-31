Disabled configuration for GitHub Issue pipe

{% if data %}
AppHub configuration has disabled posting to GitHub. Unable to create GitHub
issues or labels.
{% else %}
AppHub was unable to post create any issues on GitHub due to being ran without
an authentication code. If you are an application developer, this error usually
means there was a problem with Houston internally. Please report an issue
[here](https://github.com/elementary/houston/issues) with a link to this GitHub
issue. Thank you.
{% endif %}
