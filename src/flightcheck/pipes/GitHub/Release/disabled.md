Disabled configuration for GitHub Release pipe

{% if data %}
AppHub configuration has disabled posting to GitHub. Unable to publish packages
to GitHub release.
{% else %}
AppHub was unable to post any release files to GitHub due to being ran without
an authentication code. If you are an application developer, this error usually
means there was a problem with Houston internally. Please report an issue
[here](https://github.com/elementary/houston/issues) with a link to this GitHub
issue. Thank you.
{% endif %}
