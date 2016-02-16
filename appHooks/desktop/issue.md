# `{{application.github.name}}.desktop` has issues

Houston requires a valid `.desktop` file for proper desktop integration.

Here are some problems we ran into while testing `{{application.github.name}}.desktop`.

{{#each hook.errors}}
{{#is this 'parse'}}
- [ ] We were unable to parse `{{application.github.name}}.desktop`.
{{/is}}
{{#is this 'name'}}
- [ ] We could not find a name valid in `{{application.github.name}}.desktop`. This is critical for package generation and desktop integration.
{{/is}}
{{/each}}

For more information about a `.desktop` file, please read the [elementary developer guide](https://elementary.io/docs/code/getting-started#the-desktop-file).

{{#hasLength hook.dump}}
Here is the obligatory code dump:
{{#each hook.dump}}
```javascript
{{this}}
```
{{/each}}
{{/hasLength}}
