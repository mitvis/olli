export const treeStyle = `ul[role="tree"] {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  
  ul[role="tree"] li {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  
  ul[role="tree"] a {
    text-decoration: underline;
    border-color: transparent;
  }
  
  [role="treeitem"] ul {
    margin: 0;
    padding: 0;
    margin-left: 0.9em;
  }
  
  [role="treeitem"][aria-expanded="false"] > ul {
    display: none;
  }
  
  [role="treeitem"][aria-expanded="true"] > ul {
    display: block;
  }
  
  [role="treeitem"][aria-expanded="false"] > span::before {
    position: relative;
    left: -0.25em;
  }
  
  [role="treeitem"][aria-expanded="true"] > span::before {
    position: relative;
    left: -0.25em;
  }
  
  /* [role="treeitem"], */
  [role="treeitem"] span {
    width: 16em;
    margin: 0;
    padding: 0.125em;
    border: 2px transparent solid;
    display: block;
  }
  
  /* disable default keyboard focus styling for treeitems
     Keyboard focus is styled with the following CSS */
  [role="treeitem"]:focus {
    outline: 0;
  }
  
  [role="treeitem"].focus,
  [role="treeitem"] span.focus {
    border-color: black;
    background-color: #ddd;
  }
  
  [role="treeitem"].hover,
  [role="treeitem"] span.hover {
    background-color: #ddd;
  }`