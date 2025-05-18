import { u as unified, r as remarkParse, a as remarkGfm, b as remarkRehype, c as rehypeRaw, d as rehypeStringify } from './index-DV-hSISQ.js';
import { v as visit, n as nameFor, i as invocationOf } from './main-MaTxhs28.js';
import './_commonjsHelpers-D5KtpA0t.js';

const GLIMDOWN_PREVIEW = Symbol('__GLIMDOWN_PREVIEW__');
const GLIMDOWN_RENDER = Symbol('__GLIMDOWN_RENDER__');
const ALLOWED_LANGUAGES = ['gjs', 'hbs'];
function isLive(meta) {
  return meta.includes('live');
}
function isPreview(meta) {
  return meta.includes('preview');
}
function isBelow(meta) {
  return meta.includes('below');
}

// TODO: extract and publish remark plugin
function liveCodeExtraction(options = {}) {
  const {
    copyComponent,
    snippets,
    demo
  } = options;
  let {
    classList: snippetClasses
  } = snippets || {};
  let {
    classList: demoClasses
  } = demo || {};
  snippetClasses ??= [];
  demoClasses ??= [];
  function isRelevantCode(node) {
    if (node.type !== 'code') return false;
    let {
      meta
    } = node;
    const {
      lang
    } = node;
    meta = meta?.trim();
    if (!meta || !lang) return false;
    if (!meta.includes('live')) {
      return false;
    }
    if (!ALLOWED_LANGUAGES.includes(lang)) return false;
    return true;
  }
  const copyNode = {
    type: 'html',
    value: copyComponent
  };
  function enhance(code) {
    code.data ??= {};
    code.data['hProperties'] ??= {};
    // This is secret-to-us-only API, so we don't really care about the type
    code.data['hProperties'][GLIMDOWN_PREVIEW] = true;
    return {
      data: {
        hProperties: {
          className: snippetClasses
        }
      },
      type: 'div',
      hProperties: {
        className: snippetClasses
      },
      children: [code, copyNode]
    };
  }
  function flatReplaceAt(array, index, replacement) {
    array.splice(index, 1, ...replacement);
  }

  // because we mutate the tree as we iterate,
  // we need to make sure we don't loop forever
  const seen = new Set();
  return function transformer(tree, file) {
    visit(tree, ['code'], function (node, index, parent) {
      if (parent === null || parent === undefined) return;
      if (index === null || index === undefined) return;
      if (!isRelevantCode(node)) {
        const enhanced = enhance(node);
        parent.children[index] = enhanced;
        return 'skip';
      }
      if (seen.has(node)) return 'skip';
      seen.add(node);
      const {
        meta,
        lang,
        value
      } = node;
      if (!meta) return 'skip';
      if (!lang) return 'skip';
      file.data.liveCode ??= [];
      const code = value.trim();
      const name = nameFor(code);
      let invocation = invocationOf(name);
      const shadow = options.shadowComponent;
      const wrapInShadow = shadow && !meta?.includes('no-shadow');
      if (wrapInShadow) {
        invocation = `<${shadow}>${invocation}</${shadow}>`;
      }
      const invokeNode = {
        type: 'html',
        data: {
          hProperties: {
            [GLIMDOWN_RENDER]: true
          }
        },
        value: `<div class="${demoClasses}">${invocation}</div>`
      };
      const wrapper = enhance(node);
      file.data.liveCode.push({
        lang,
        name,
        code
      });
      const live = isLive(meta);
      const preview = isPreview(meta);
      const below = isBelow(meta);
      if (live && preview && below) {
        flatReplaceAt(parent.children, index, [wrapper, invokeNode]);
        return 'skip';
      }
      if (live && preview) {
        flatReplaceAt(parent.children, index, [invokeNode, wrapper]);
        return 'skip';
      }
      if (live) {
        parent.children[index] = invokeNode;
        return 'skip';
      }
      parent.children[index] = wrapper;
      return;
    });
  };
}
function sanitizeForGlimmer(/* options */
) {
  return tree => {
    visit(tree, 'element', node => {
      if ('tagName' in node) {
        if (!['pre', 'code'].includes(node.tagName)) return;
        visit(node, 'text', textNode => {
          if ('value' in textNode && textNode.value) {
            textNode.value = textNode.value.replace(/{{/g, '\\{{');
          }
        });
        return 'skip';
      }
    });
  };
}
function buildCompiler(options) {
  let compiler = unified().use(remarkParse).use(remarkGfm);

  /**
   * If this were "use"d after `remarkRehype`,
   * remark is gone, and folks would need to work with rehype trees
   */
  if (options.remarkPlugins) {
    options.remarkPlugins.forEach(plugin => {
      // Arrays are how plugins are passed options (for some reason?)
      // why not just invoke the the function?
      const p = Array.isArray(plugin) ? plugin : [plugin];
      compiler = compiler.use(...p);
    });
  }

  // TODO: we only want to do this when we have pre > code.
  //       code can exist inline.
  compiler = compiler.use(liveCodeExtraction, {
    snippets: {
      classList: ['glimdown-snippet', 'relative']
    },
    demo: {
      classList: ['glimdown-render']
    },
    copyComponent: options?.CopyComponent,
    shadowComponent: options?.ShadowComponent
  });

  // .use(() => (tree) => visit(tree, (node) => console.log('i', node)))
  // remark rehype is needed to convert markdown to HTML
  // However, it also changes all the nodes, so we need another pass
  // to make sure our Glimmer-aware nodes are in tact
  compiler = compiler.use(remarkRehype, {
    allowDangerousHtml: true
  });

  // Convert invocables to raw format, so Glimmer can invoke them
  compiler = compiler.use(() => tree => {
    visit(tree, function (node) {
      // We rely on an implicit transformation of data.hProperties => properties
      const properties = node.properties;
      if (properties?.[GLIMDOWN_PREVIEW]) {
        return 'skip';
      }
      if (node.type === 'element' || 'tagName' in node && node.tagName === 'code') {
        if (properties?.[GLIMDOWN_RENDER]) {
          node.type = 'glimmer_raw';
          return;
        }
        return 'skip';
      }
      if (node.type === 'text' || node.type === 'raw') {
        // definitively not the better way, but this is supposed to detect "glimmer" nodes
        if ('value' in node && typeof node.value === 'string' && node.value.match(/<\/?[_A-Z:0-9].*>/g)) {
          node.type = 'glimmer_raw';
        }
        node.type = 'glimmer_raw';
        return 'skip';
      }
      return;
    });
  });
  if (options.rehypePlugins) {
    options.rehypePlugins.forEach(plugin => {
      // Arrays are how plugins are passed options (for some reason?)
      // why not just invoke the the function?
      const p = Array.isArray(plugin) ? plugin : [plugin];
      compiler = compiler.use(...p);
    });
  }
  compiler = compiler.use(rehypeRaw, {
    passThrough: ['glimmer_raw', 'raw']
  }).use(() => tree => {
    visit(tree, 'glimmer_raw', node => {
      node.type = 'raw';
    });
  });
  compiler = compiler.use(sanitizeForGlimmer);

  // Finally convert to string! oofta!
  compiler = compiler.use(rehypeStringify, {
    collapseEmptyAttributes: true,
    closeSelfClosing: true,
    allowParseErrors: true,
    allowDangerousCharacters: true,
    allowDangerousHtml: true
  });
  return compiler;
}
/**
 * @internal not under semver
 */
async function parseMarkdown(input, options = {}) {
  const markdownCompiler = buildCompiler(options);
  const processed = await markdownCompiler.process(input);
  const liveCode = processed.data.liveCode || [];
  const templateOnly = processed.toString();
  return {
    templateOnlyGlimdown: templateOnly,
    blocks: liveCode
  };
}

export { parseMarkdown };
