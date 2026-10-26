// Approximation of the IntelliJ dark editor theme (new UI) for Shiki code blocks.
export default {
  name: 'intellij-dark',
  type: 'dark',
  colors: {
    'editor.background': '#1e1f22',
    'editor.foreground': '#bcbec4',
  },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#9a9ea6' } },
    {
      scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.control', 'keyword.operator.new', 'constant.language', 'entity.name.tag'],
      settings: { foreground: '#cf8e6d' },
    },
    { scope: ['string', 'string.quoted', 'punctuation.definition.string'], settings: { foreground: '#6aab73' } },
    { scope: ['constant.numeric'], settings: { foreground: '#2aacb8' } },
    { scope: ['entity.name.function', 'support.function', 'meta.function-call.generic'], settings: { foreground: '#56a8f5' } },
    {
      scope: ['variable.other.property', 'variable.other.object.property', 'support.type.property-name', 'meta.object-literal.key'],
      settings: { foreground: '#c77dbb' },
    },
    { scope: ['meta.decorator', 'storage.type.annotation', 'entity.other.attribute-name'], settings: { foreground: '#b3ae60' } },
    { scope: ['entity.name.type', 'entity.name.class', 'support.class', 'support.type', 'variable.parameter'], settings: { foreground: '#bcbec4' } },
  ],
};
