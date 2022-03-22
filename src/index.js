const {sources, workspace, window, SourceType} = require('coc.nvim')
const {convertRegex, byteSlice} = require('./util')

async function activate(context, languageId) {
  let config = workspace.getConfiguration('coc.source.vimtex')
  let {nvim} = workspace

  let res = await nvim.eval('get(g:,"loaded_vimtex",0)')
  if (res != 1) {
    let res = await window.showErrorMessage(`Plugin vimtex not loaded, make sure it's loaded loaded on filetype: ${languageId}`, `Exclude ${languageId} in user configuration`)
    if (res && res.startsWith('Exclude')) {
      let c = workspace.getConfiguration('coc.source.vimtex')
      let filetypes = c.get('filetypes', [])
      filetypes = filetypes.filter(s => s !== languageId)
      c.update('filetypes', filetypes, true)
    }
    return false
  }
  let regex = '\\\\(?:(?:\\w*cite|Cite)\\w*\\*?(?:\\s*\\[[^]]*\\]){0,2}\\s*{[^}]*|(?:\\w*cites|Cites)(?:\\s*\\([^)]*\\)){0,2}(?:(?:\\s*\\[[^]]*\\]){0,2}\\s*\\{[^}]*\\})*(?:\\s*\\[[^]]*\\]){0,2}\\s*\\{[^}]*|bibentry\\s*{[^}]*|(text|block)cquote\\*?(?:\\s*\\[[^]]*\\]){0,2}\\s*{[^}]*|(for|hy)\\w*cquote\\*?{[^}]*}(?:\\s*\\[[^]]*\\]){0,2}\\s*{[^}]*|defbibentryset{[^}]*}{[^}]*|\\w*ref(?:\\s*\\{[^}]*|range\\s*\\{[^,}]*(?:}{)?)|hyperref\\s*\\[[^]]*|includegraphics\\*?(?:\\s*\\[[^]]*\\]){0,2}\\s*\\{[^}]*|(?:include(?:only)?|input|subfile)\\s*\\{[^}]*|([cpdr]?(gls|Gls|GLS)|acr|Acr|ACR)[a-zA-Z]*\\s*\\{[^}]*|(ac|Ac|AC)\\s*\\{[^}]*|includepdf(\\s*\\[[^]]*\\])?\\s*\\{[^}]*|includestandalone(\\s*\\[[^]]*\\])?\\s*\\{[^}]*|(usepackage|RequirePackage|PassOptionsToPackage)(\\s*\\[[^]]*\\])?\\s*\\{[^}]*|documentclass(\\s*\\[[^]]*\\])?\\s*\\{[^}]*|begin(\\s*\\[[^]]*\\])?\\s*\\{[^}]*|end(\\s*\\[[^]]*\\])?\\s*\\{[^}]*|\\w*)'
  let pattern = new RegExp(convertRegex(regex) + '$')

  function convertItems(list) {
    let res = []
    for (let item of list) {
      if (typeof item == 'string') {
        res.push(Object.assign({word: item}))
      }
      if (item.hasOwnProperty('word')) {
        res.push(item)
      }
    }
    return res
  }

  let source = {
    name: 'vimtex',
    enable: config.get('enable', true),
    priority: config.get('priority', 99),
    filetypes: config.get('filetypes', ['tex', 'latex', 'plaintex']),
    disableSyntaxes: config.get('disableSyntaxes', []),
    sourceType: SourceType.Remote,
    triggerPatterns: [pattern],
    doComplete: async opt => {
      let {nvim} = workspace
      let func = 'vimtex#complete#omnifunc'
      let {line, colnr, col} = opt
      let startcol = col
      try {
        startcol = await nvim.call(func, [1, ''])
        startcol = Number(startcol)
      } catch (e) {
        workspace.showMessage(`vim error from ${func} :${e.message}`, 'error')
        return null
      }
      // invalid startcol
      if (isNaN(startcol) || startcol < 0 || startcol > colnr) return null
      let text = byteSlice(line, startcol, colnr - 1)
      let words = await nvim.call(func, [0, text])
      if (words.hasOwnProperty('words')) {
        words = words.words
      }
      let res = {items: convertItems(words)}
      res.startcol = startcol
      return res
    }
  }

  sources.addSource(source)
  context.subscriptions.push({
    dispose: () => {
      sources.removeSource(source)
    }
  })
  return true
}

exports.activate = async context => {
  let config = workspace.getConfiguration('coc.source.vimtex')
  let filetypes = config.get('filetypes', ['tex', 'latex', 'plaintex'])
  let activated = false
  let active = (languageId) => {
    if (activated) return
    activated = true
    activate(context, languageId)
  }
  for (let doc of workspace.documents) {
    if (filetypes.includes(doc.textDocument.languageId)) {
      active(doc.languageId)
    }
  }
  if (!activated) {
    workspace.onDidOpenTextDocument(e => {
      if (filetypes.includes(e.languageId)) {
        active(e.languageId)
      }
    }, null, context.subscriptions)
  }
}
