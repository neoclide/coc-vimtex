const { sources, workspace, SourceType } = require('coc.nvim')
const { convertRegex, byteSlice } = require('./util')

exports.activate = async context => {
  let config = workspace.getConfiguration('coc.source.vimtex')
  let shortcut = config.get('shortcut', '')
  let menu = shortcut ? '[' + shortcut + ']' : ''
  let { nvim } = workspace

  let regex = await nvim.getVar('vimtex#re#deoplete')
  if (!regex) {
    workspace.showMessage('vimtex not loaded', 'error')
    return
  }
  regex = regex.slice(2, regex.length)
  let pattern = new RegExp(convertRegex(regex) + '$')

  function convertToItems(list, extra) {
    let res = []
    extra = extra || {}
    for (let item of list) {
      if (typeof item == 'string') {
        res.push(Object.assign({ word: item }, { menu }, extra))
      }
      if (item.hasOwnProperty('word')) {
        if (item.menu) extra.info = item.menu
        res.push(Object.assign(item, extra))
      }
    }
    return res
  }

  let source = {
    name: 'vimtex',
    enable: config.get('enable', true),
    priority: config.get('priority', 99),
    filetypes: ['tex'],
    sourceType: SourceType.Remote,
    triggerPatterns: [pattern],
    doComplete: async opt => {
      let { nvim } = workspace
      let func = 'vimtex#complete#omnifunc'
      let { line, colnr, col } = opt
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
      let text = byteSlice(line, startcol, colnr)
      let words = await nvim.call(func, [0, text])
      if (words.hasOwnProperty('words')) {
        words = words.words
      }
      let res = {
        items: convertToItems(words)
      }
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
}
