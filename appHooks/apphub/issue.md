# Invalid `.apphub` file

Houston requires a valid `.apphub` file to assure reviewing, and publishing works as you want them.

{{#hasLength hook.errors}}
Here are some problems we ran into while testing your `.apphub` file.
{{/hasLength}}

{{#each hook.errors}}
{{#is this 'parse'}}
- [ ] We were unable to parse your `.apphub` file.
{{/is}}
{{/each}}

{{#hasLength hook.warnings}}
While not show stopping, here are some questionable parts of your `.apphub` file.
{{/hasLength}}

{{#each hook.warnings}}
{{#is this 'price'}}
- [ ] We were unable to identify your price. Please make sure it is a whole number.
{{/is}}
{{#is this 'label'}}
- [ ] We were unable to identify your label. Please make sure it is a string.
{{/is}}
{{/each}}

A valid `.apphub` file can be as simple as:
```json
{}
```
Or as sophisticated as:
```json
{
  "priceUSD": 5,
  "issueLabel": "Houston"
}
```

{{#hasLength hook.dump}}
Here is the obligatory code dump:
{{#each hook.dump}}
```javascript
{{this}}
```
{{/each}}
{{/hasLength}}
