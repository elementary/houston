# Missing AppStream OARS attributes

Please make sure you include the following `content_attribute` tags in your
AppStream file:

<% attributes.forEach(function (attribute) { _%>
- <%- attribute %>
<%_ }) %>

For more information, please look at the
[Open Age Rating Service website](https://hughsie.github.io/oars/).
