// Sätteri hast plugin: links to other sites open in a new tab. Links within the site stay in the same tab.
export default function externalLinks() {
  return {
    name: 'external-links',
    element: {
      filter: ['a'],
      visit(node, ctx) {
        const href = node.properties?.href;
        if (typeof href !== 'string' || !/^https?:\/\//i.test(href)) return;
        ctx.setProperty(node, 'target', '_blank');
        ctx.setProperty(node, 'rel', 'noopener noreferrer');
      },
    },
  };
}
