// Sätteri hast plugin: HTML comments in Markdown are author notes and never reach the published page.
const COMMENT = /<!--[\s\S]*?-->/g;

export default function stripComments() {
  return {
    name: 'strip-comments',
    comment(node, ctx) {
      ctx.removeNode(node);
    },
    raw(node, ctx) {
      const value = node.value;
      if (typeof value !== 'string' || !value.includes('<!--')) return;
      const rest = value.replace(COMMENT, '');
      if (rest.trim() === '') ctx.removeNode(node);
      else ctx.replaceNode(node, { raw: rest });
    },
  };
}
