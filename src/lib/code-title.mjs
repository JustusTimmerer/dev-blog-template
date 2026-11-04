// Shiki transformer: a code fence with title="..." gets a caption above the block, for example a file path or a class name.
const titleOf = (meta) => {
  const match = meta?.match(/title=(?:"([^"]*)"|'([^']*)')/);
  return match ? (match[1] ?? match[2]) : undefined;
};

export default function codeTitle() {
  return {
    name: 'code-title',
    root(root) {
      const title = titleOf(this.options.meta?.__raw);
      const pre = root.children[0];
      if (!title || !pre) return;
      root.children = [{
        type: 'element',
        tagName: 'figure',
        properties: { className: ['code-figure'] },
        children: [
          { type: 'element', tagName: 'figcaption', properties: { className: ['code-title'] }, children: [{ type: 'text', value: title }] },
          pre,
        ],
      }];
    },
  };
}
