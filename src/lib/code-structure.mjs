// Sätteri hast plugin for the editor themes: an article renders like a class, each h2 section
// like a method. It only inserts empty decoration elements; the stylesheet fills them in and
// hides them in the normal themes. Heading text and ids stay untouched.

const span = (className) => ({ type: 'element', tagName: 'span', properties: { className: [className], ariaHidden: 'true' }, children: [] });
const div = (className) => ({ type: 'element', tagName: 'div', properties: { className: className.split(' '), ariaHidden: 'true' }, children: [] });

export default function codeStructure() {
  let sections = 0;
  return {
    name: 'code-structure',
    element: {
      filter: ['h2', 'h3'],
      visit(node, ctx) {
        if (node.tagName === 'h3') {
          ctx.prependChild(node, span('decl-comment'));
          return;
        }
        if (sections > 0) ctx.insertBefore(node, div('code-brace brace-close'));
        sections += 1;
        ctx.prependChild(node, span('decl-method'));
        ctx.appendChild(node, span('decl-params'));
        ctx.insertAfter(node, div('code-brace brace-open'));
      },
    },
  };
}
